import { config } from "dotenv";
config();

import { db } from "@/firebase/config";
import { collection, getDocs, query } from "firebase/firestore";
import { IncomingBidCommentModel, IncomingBidModel } from "@/lib/models/bids";

export const testAllBids = async () => {
  const table = collection(db, "Incoming Bids");
  const querySnapshot = await getDocs(query(table));

  querySnapshot.forEach((doc) => {
    try {
      console.log(doc.id);
      IncomingBidModel.parse(doc.data());
    } catch (e) {
      console.log(doc.data());
      console.log(doc.id, " => ", e);
      throw e;
    }
  });
};

export const testAllBidComments = async () => {
  const table = collection(db, "bid Comments");
  const querySnapshot = await getDocs(query(table));

  querySnapshot.forEach((doc) => {
    try {
      console.log(doc.id);
      IncomingBidCommentModel.parse(doc.data());
    } catch (e) {
      console.log(doc.data());
      console.log(doc.id, " => ", e);
      throw e;
    }
  });
};

export const main = async () => {
  // testAllBids().then(() => {});
  console.log("Testing all bid comments");
  testAllBidComments().then(() => {});
};

main().then(() => {});
