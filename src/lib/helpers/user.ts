import { db } from "@/firebase/config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

export const getUserDataFromDb = async (id: string) => {
  // const userRef = doc(db, "users", id);
  const userRef = await getDocs(
    query(collection(db, "users"), where("id", "==", id))
  );
  const docs = userRef.docs.map((doc) => doc.data());
  const userDoc = docs?.[0];
  // const userDoc = await getDoc(userRef);
  if (!userDoc) {
    console.log("user", id, "doesn't exist");
  }
  return userDoc;
};
