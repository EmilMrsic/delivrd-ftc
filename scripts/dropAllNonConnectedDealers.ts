import { db } from "@/firebase/config";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
} from "firebase/firestore";

export const getAllUsers = async () => {
  const userQuery = await getDocs(
    query(collection(db, "users"), where("privilege", "==", "Dealer"))
  );
  const dealerQuery = await getDocs(query(collection(db, "Dealers")));

  const users = userQuery.docs.map((doc) => {
    const data = doc.data();
    return { firebaseId: doc.id, ...data } as any;
  });
  const dealerSnapshot = dealerQuery.docs.map((doc) => {
    const data = doc.data();
    return { ...data, firebaseId: doc.id } as any;
  });
  const dealerIds = users.map((u) => u.dealer_id[0]);
  const userConnectedIds = new Set<string>(dealerIds);
  //   console.log(userConnectedIds.size, dealerIds.length);

  let totalDealersNotConnected = 0;
  let emailDoesntExist = 0;
  const deletableIds: string[] = [];

  for (const dealer of dealerSnapshot) {
    if (!userConnectedIds.has(dealer.id)) {
      totalDealersNotConnected += 1;
      deletableIds.push(dealer.firebaseId);
    } else if (!dealer.YourEmail || dealer.YourEmail.trim() === "") {
      emailDoesntExist += 1;
    }
  }

  for (const dealerId of deletableIds) {
    console.log("deleting dealer id:", dealerId);
    await deleteDoc(doc(collection(db, "Dealers"), dealerId));
  }
};

export const main = async () => {
  await getAllUsers();
};

main().then(() => process.exit(0));
