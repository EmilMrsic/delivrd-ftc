import { db } from "@/firebase/config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import {
  IncomingBidCommentModel,
  IncomingBidCommentType,
  IncomingBidModel,
  IncomingBidType,
} from "../models/bids";
import { chunkArray, fetchBulkQuery } from "./firebase";

export const getIncomingBids = async (incomingBidIds: string[]) => {
  const incomingBidsCollection = collection(db, "Incoming Bids");
  const batchSize = 10;
  const requests = [];

  for (let i = 0; i < incomingBidIds.length; i += batchSize) {
    requests.push(
      getDocs(
        query(
          incomingBidsCollection,
          where("bid_id", "in", incomingBidIds.slice(i, i + batchSize))
        )
      )
    );
  }

  const batchResults = await Promise.all(requests);
  const allBids = batchResults.flatMap((batch) =>
    batch.docs.map((doc) => {
      const data = doc.data();
      const parsedData = IncomingBidModel.parse(data);
      return parsedData;
    })
  );

  const bidComments = await getBidComments(incomingBidIds);
  const finalBids = allBids.map((bid) => {
    if (bid.bid_id) {
      bid.bidComments = bidComments[bid.bid_id];
    }
    return bid;
  });

  return {
    bids: finalBids,
    commentsById: bidComments,
  };
};

export const getBidComments = async (incomingBidIds: string[]) => {
  const bidCommentsCollection = collection(db, "bid comment");
  const batchSize = 10;
  const requests = [];

  for (let i = 0; i < incomingBidIds.length; i += batchSize) {
    requests.push(
      getDocs(
        query(
          bidCommentsCollection,
          where("bid_id", "in", incomingBidIds.slice(i, i + batchSize))
        )
      )
    );
  }

  const batchResults = await Promise.all(requests);
  const result: Record<string, IncomingBidCommentType[]> = {};
  batchResults.flatMap((batch) => {
    batch.docs.map((doc) => {
      const data = doc.data();
      const parsedData = IncomingBidCommentModel.parse(data);
      if (!result[parsedData.bid_id]) {
        result[parsedData.bid_id] = [];
      }
      result[parsedData.bid_id].push(parsedData);
    });
  });

  return result;
};

export const fetchDealers = async (incomingBids: IncomingBidType[]) => {
  const dealersData = [];

  for (const bid of incomingBids) {
    const id = bid.dealerId;
    console.log("maching dealer: bid", bid);
    if (id !== "N/A" && id)
      try {
        const dealerRef = doc(db, "Dealers", id);
        const dealerSnap = await getDoc(dealerRef);

        if (dealerSnap.exists()) {
          dealersData.push(dealerSnap.data());
        } else {
          console.warn(`Dealer with ID ${id} not found`);
        }
      } catch (error) {
        console.error(`Error fetching dealer data for ID ${id}:`, error);
      }
  }

  return dealersData;
};

const getBidsWonBySomeoneElse = async (
  negotiationIds: string[],
  dealerId: string
) => {
  const incomingBids = collection(db, "Incoming Bids");
  const chunks = chunkArray(negotiationIds, 10);
  const requests = chunks.map((chunk) => {
    return getDocs(
      query(
        incomingBids,
        where("negotiationId", "in", chunk),
        where("accept_offer", "==", true)
      )
    );
  });

  const batchResults = await Promise.all(requests);
  const result: any[] = [];
  batchResults.flatMap((batch) => {
    batch.docs.map((doc) => {
      const data = doc.data();
      result.push(data);
    });
  });
  return result;
};

export const getDealerBids = async (dealerId: string) => {
  const incomingBids = collection(db, "Incoming Bids");
  const q = query(incomingBids, where("dealerId", "==", dealerId));
  const snapshot = await getDocs(q);
  const negotiationIds: string[] = [];
  const bidsNotWonIds: string[] = [];
  const bids = snapshot.docs.map((doc) => {
    const data = doc.data();
    if (
      data.negotiationId &&
      data.negotiationId !== "N/A" &&
      data.negotiationId !== ""
    ) {
      negotiationIds.push(data.negotiationId);
    }

    if (!data.accept_offer) {
      bidsNotWonIds.push(data.negotiationId);
    }
    return data;
  });

  const [clientData, bidsWonBySomeoneElse] = await Promise.all([
    fetchBulkQuery("Clients", "negotiation_Id", negotiationIds),
    getBidsWonBySomeoneElse(negotiationIds, dealerId),
  ]);

  const bidsWonBySomeoneElseMap: Record<string, any> = {};
  bidsWonBySomeoneElse.forEach((bid) => {
    bidsWonBySomeoneElseMap[bid.negotiationId] = bid;
  });

  const clients: Record<string, any> = {};
  clientData.forEach((client) => {
    clients[client.negotiation_Id] = client;
  });
  const finalBids: any[] = [];
  for (const bid of bids) {
    const client = clients[bid.negotiationId];

    if (client) {
      let bidStatus = "pending";
      if (bid.accept_offer) {
        bidStatus = "won";
      } else {
        if (bidsWonBySomeoneElseMap[bid.negotiationId]) {
          bidStatus = "lost";
          bid.winningBid = bidsWonBySomeoneElseMap[bid.negotiationId];
        }
      }
      // if (bid.client_offer === "accepted") {
      //   bidStatus = "accepted";
      // }

      const useableDate = bid.timestamps || bid.timestamp;
      const date = new Date(useableDate);
      const formattedDate = date
        .toLocaleDateString("en-US", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        })
        .replaceAll("/", "-");

      finalBids.push({
        ...bid,
        ...client,
        bidStatus,
        submittedDate: formattedDate,
      });
    }
  }

  return finalBids;
};
