import { db } from "@/firebase/config";
import { collection, getDocs } from "firebase/firestore";

export const getDealerDocuments = async () => {
  const dealerTable = collection(db, "Dealers");
  const dealerSnapshot = await getDocs(dealerTable);
  dealerSnapshot.docs.map((doc) => {
    const data = doc.data();
    // console.log(data);
  });
};
