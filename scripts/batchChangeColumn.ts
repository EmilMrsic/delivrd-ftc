import { config } from "dotenv";
config();

import { db } from "@/firebase/config";
import {
  collection,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { deleteApp, getApps } from "firebase-admin/app";

const COLUMN_NAME = "stage";
const FIND_VALUE = "Delivery Scheduled";
const REPLACE_VALUE = "Deal Complete- Local";

export const batchChangeColumn = async () => {
  const table = collection(db, "delivrd_negotiations");
  const querySnapshot = await getDocs(
    query(table, where(COLUMN_NAME, "==", FIND_VALUE))
  );

  const batch = writeBatch(db);
  querySnapshot.forEach((doc) => {
    console.log(doc.id, " => ", doc.data().stage);
    batch.update(doc.ref, {
      [COLUMN_NAME]: REPLACE_VALUE,
    });
  });

  await batch.commit();
};

batchChangeColumn().then(() => {});
