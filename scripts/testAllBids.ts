import { config } from "dotenv";
config();

import { db } from "@/firebase/config";
import { collection, getDocs, query } from "firebase/firestore";
import { IncomingBidModel } from "@/lib/models/bids";

export const batchChangeColumn = async () => {
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

batchChangeColumn().then(() => {});
