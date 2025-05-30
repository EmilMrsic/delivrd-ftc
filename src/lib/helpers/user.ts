import { db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";

export const getUserDataFromDb = async (id: string) => {
  const userRef = doc(db, "users", id);
  const userDoc = await getDoc(userRef);
  if (!userDoc.exists()) {
    console.log(id, "doesn't exist");
  }
  return userDoc.data();
};
