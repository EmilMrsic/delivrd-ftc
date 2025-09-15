import { db } from "@/firebase/config";

import {
  collection,
  deleteDoc,
  getDocs,
  query,
  where,
  doc,
} from "firebase/firestore";

export const main = async () => {
  console.log("Dropping bad dealers...");
  const userSnapshot = await getDocs(
    query(collection(db, "users"), where("privilege", "==", "Dealer"))
  );

  const dealerSnapshot = await getDocs(query(collection(db, "Dealers")));

  const validDealerIds = new Set<string>();
  dealerSnapshot.forEach((doc) => {
    const dealer = doc.data();
    validDealerIds.add(dealer.id);
  });

  let total = 0;
  let count = 0;
  let badIdCount = 0;
  let nullEmailDealersCount = 0;
  let nullEmailbutGoodDealerCount = 0;
  const deletableUsers: string[] = [];
  userSnapshot.forEach((document) => {
    const user = document.data();
    const dealerId = user.dealer_id?.[0] || user?.dealer_id;
    if (!dealerId || !dealerId?.length) {
      console.log("found bad dealer user:", user.id, user.email, dealerId);
      count++;
      deletableUsers.push(user.id);
    } else if (!validDealerIds.has(dealerId)) {
      badIdCount++;
      deletableUsers.push(user.id);
    }

    if (!user.email) {
      nullEmailDealersCount++;

      if (validDealerIds.has(dealerId)) {
        nullEmailbutGoodDealerCount++;
      }
    }

    total++;
    // console.log("data", dealerId);
  });

  //   console.log("going to delete", deletableUsers.length, "users");
  //   console.log("got", count, "dealers without dealer IDs");
  //   console.log("got", badIdCount, "dealers with invalid dealer IDs");
  //   console.log("got", nullEmailDealersCount, "dealers with null emails");
  //   console.log("of those,", nullEmailbutGoodDealerCount, "had valid dealer IDs");
  //   console.log("out of", total, "total dealers");
  for (const userId of deletableUsers) {
    console.log("deleting user:", userId);
    await deleteDoc(doc(db, "users", userId));
  }
};

main().then(() => process.exit(0));
