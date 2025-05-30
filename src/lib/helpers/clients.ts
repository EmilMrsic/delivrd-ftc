import { db } from "@/firebase/config";
import { collection, getDocs } from "firebase/firestore";

export const getClients = async () => {
  const clientsCollection = collection(db, "Clients");
  const snapshot = await getDocs(clientsCollection);
  const clients = snapshot.docs.map((doc) => doc.data());
  return clients;
};
