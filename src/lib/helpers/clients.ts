import { db } from "@/firebase/config";
import { collection, getDocs } from "firebase/firestore";

export const getClients = async (
  mapFn?: (client: any) => any,
  query?: { dealerId?: string | { not: string } }
) => {
  const clientsCollection = collection(db, "Clients");
  const snapshot = await getDocs(clientsCollection);
  const output: any[] = [];
  const clients = snapshot.docs.forEach((doc) => {
    const client = doc.data();
    Object.keys(query || {}).forEach((key) => {
      // @ts-ignore
      if (query?.[key] === client[key]) {
        return;
      }
    });

    if (mapFn) {
      output.push(mapFn(client));
    } else {
      output.push(client);
    }
  });
  return output;
};
