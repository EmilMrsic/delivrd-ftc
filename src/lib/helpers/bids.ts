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
