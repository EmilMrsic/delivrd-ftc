import { db } from "@/firebase/config";
import { addDoc, collection, doc, setDoc } from "firebase/firestore";

export const createNotification = async (
  userId: string,
  type: string,
  data: any
) => {
  const newId = doc(collection(db, "delivrd_notifications")).id;
  const docRef = doc(db, "delivrd_notifications", newId);
  await setDoc(docRef, {
    dealCoordinatorId: userId,
    type,
    createdAt: new Date().toISOString(),
    read: false,
    data,
    id: newId,
  });
};
