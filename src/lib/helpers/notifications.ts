import { db } from "@/firebase/config";
import { addDoc, collection } from "firebase/firestore";

export const createNotification = async (
  userId: string,
  type: string,
  data: any
) => {
  const notificationTable = collection(db, "delivrd_notifications");
  console.log("inserting new notification");
  await addDoc(notificationTable, {
    userId,
    type,
    createdAt: new Date().toISOString(),
    read: false,
    data,
  });
};
