import { db } from "@/firebase/config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  IncomingBidCommentModel,
  IncomingBidCommentType,
  IncomingBidModel,
  IncomingBidType,
} from "../models/bids";
import { chunkArray, fetchBulkQuery } from "./firebase";
import { generateRandomId } from "../utils";
import { NegotiationDataType } from "../models/team";
import { DealerDataType } from "../models/dealer";
import { filesToUploadedUrls } from "./files";

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
  const q = query(
    incomingBids,
    where("dealerId", "==", dealerId)
    // where("delete", "!=", true)
  );
  const snapshot = await getDocs(q);
  const negotiationIds: string[] = [];
  const bidsNotWonIds: string[] = [];
  const filteredBids = snapshot.docs.filter((doc) => {
    const data = doc.data();
    return !data.delete;
  });
  const bids = filteredBids.map((doc) => {
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

  const [clientData, negotiations, bidsWonBySomeoneElse] = await Promise.all([
    fetchBulkQuery("Clients", "negotiation_Id", negotiationIds),
    fetchBulkQuery("delivrd_negotiations", "id", negotiationIds),
    getBidsWonBySomeoneElse(negotiationIds, dealerId),
  ]);

  const negotiationsMap: Record<string, NegotiationDataType> = {};
  negotiations.forEach((negotiation) => {
    negotiationsMap[negotiation.id] = negotiation;
  });

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
    const negotiation = negotiationsMap[bid.negotiationId];

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

      const finalBid = {
        ...bid,
        ...client,
        bidStatus,
        submittedDate: formattedDate,
      };

      if (bid.bidType === "tradeIn") {
        finalBid.VIN = negotiation.tradeDetails?.vin;
        finalBid.Mileage = negotiation.tradeDetails?.mileage;
      }

      finalBids.push(finalBid);
    }
  }

  return finalBids;
};

export const createNewBid = async (
  negotiation: NegotiationDataType,
  dealer: DealerDataType,
  newBidValues: any,
  type: "tradeIn" | "bid"
) => {
  const newId = generateRandomId();
  const bidRef = doc(db, "Incoming Bids", newId);
  const fileUrls = await filesToUploadedUrls(newBidValues.files);

  const bidObject: IncomingBidType = {
    id: newId,
    bid_id: newId,
    negotiationId: negotiation.id,
    dealerId: dealer.id,
    dealerName: dealer.Dealership,
    files: fileUrls,
    price: newBidValues.price,
    comments: newBidValues.comments,
    timestamp: Date.now(),
    createdAt: new Date().toISOString(),
    bidType: type,
    bid_source: "FTC",
  };
  await setDoc(bidRef, bidObject);
  return bidObject;
};

export const getBidsByNegotiationId = async (negotiationId: string) => {
  const bidTable = collection(db, "Incoming Bids");
  const bidsSnapshot = await getDocs(
    query(bidTable, where("negotiationId", "==", negotiationId))
  );

  const workingDealerIds: string[] = [];
  const bidIds: string[] = [];
  const bids = bidsSnapshot.docs.map((doc) => {
    const data = doc.data();
    workingDealerIds.push(data.dealerId);
    bidIds.push(data.bid_id);
    return {
      ...data,
    };
  });

  const dealerIds = Array.from(new Set(workingDealerIds)).filter(
    (id) => id && id !== "N/A"
  );
  const [dealers, bidComments] = await Promise.all([
    fetchBulkQuery("Dealers", "id", dealerIds),
    fetchBulkQuery("bid comment", "bid_id", bidIds),
  ]);

  const bidCommentsMap: Record<string, IncomingBidCommentType[]> = {};
  bidComments.forEach((comment) => {
    if (!bidCommentsMap[comment.bid_id]) {
      bidCommentsMap[comment.bid_id] = [];
    }
    bidCommentsMap[comment.bid_id].push(comment);
  });

  const dealersMap: Record<string, DealerDataType> = {};
  dealers.forEach((dealer) => {
    dealersMap[dealer.id] = dealer;
  });

  const finalBids: {
    [key: string]: IncomingBidType[];
  } = {
    tradeIns: [],
    bids: [],
  };

  bids.forEach((bid) => {
    // @ts-ignore
    const finalBid: IncomingBidType & { bidDealer: DealerDataType } = {
      ...bid,
      bidDealer: dealersMap[bid.dealerId as string],
      bidComments: bidCommentsMap[bid.bid_id],
    };

    if (bid.bidType === "tradeIn") {
      finalBids.tradeIns.push(finalBid as IncomingBidType);
    } else {
      finalBids.bids.push(finalBid as IncomingBidType);
    }
  });

  return finalBids;
};

/**
 * Grab the different bids and cache the total number of each type e.g. trade in or regular
 * on the negotiation.  Reduces the need to calculate this on the fly in the UI + reduces reads
 */
export const cacheBidTypeCounts = async (
  negotiationId: string,
  archived = false
) => {
  const bids = await getBidsByNegotiationId(negotiationId);
  const negotiationRef = doc(
    db,
    archived ? "delivrd_archive" : "delivrd_negotiations",
    negotiationId
  );
  await updateDoc(negotiationRef, {
    totalTradeInBids: bids.tradeIns.filter((bid) => !bid.delete).length,
    totalRegularBids: bids.bids.filter((bid) => !bid.delete).length,
  });
};
