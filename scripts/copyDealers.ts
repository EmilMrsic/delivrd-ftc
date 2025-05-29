import { config } from "dotenv";
config();
import { db } from "@/firebase/config";

import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";

export const main = async () => {
  const delivrdDealersCollection = collection(db, "delivrd_dealers");
  const dealersCollection = collection(db, "Dealers");

  const delivrdDealers = await getDocs(delivrdDealersCollection);
  const updatedDealers = await getDocs(
    query(dealersCollection, where("updated", "==", true))
  );

  const delivrdDealersIds = new Set(delivrdDealers.docs.map((doc) => doc.id));
  const updatedDealersData = await Promise.all(
    updatedDealers.docs.map(async (row) => {
      const data = row.data();
      console.log(data.id, delivrdDealersIds.has(data.id));

      if (!delivrdDealersIds.has(data.id)) {
        const docRef = doc(db, "delivrd_dealers", data.id);
        await setDoc(docRef, data);
      }
    })
  );
};

main().then(() => {});
