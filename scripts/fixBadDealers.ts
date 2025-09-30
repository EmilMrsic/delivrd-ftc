/**
 * two scenarios:
 *
 * 1. User and dealer exist but dealer_id is simply wrong in user table
 * 2. User and dealer exists, and there are multiple dealer rows for the email
 */

import { db } from "@/firebase/config";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";

/**
 * Steps:
 *
 * 1. Find all dealers with a bad dealer_id (not in dealers table)
 * 2. For each dealer, look up by dealer email
 * 3. If one dealer found, simply update the dealer_id to match the found dealer
 * 4. If multiple dealers found, check for updated: true or number of bids
 *   4.1. If one clearly stands out, update dealer_id to match that dealer
 */

export const chooseBestDealer = (dealers: any[]) => {
  console.log("--> Choosing best dealer from", dealers.length, "options");
  const scoredDealers = dealers.map((dealer) => {
    let score = 0;
    if (dealer.Dealership && dealer.Dealership?.length > 0) {
      score += 1;
    }

    if (dealer.updated) {
      score += 1;
    }

    if (dealer.bidCount > 0) {
      score += 100;
    }

    if (dealer.Brand.length > 0) {
      score += 1;
    }

    return {
      dealer_id: dealer.id,
      score: score,
    };
  });

  const sortedDealers = scoredDealers.sort((a, b) => b.score - a.score);
  return sortedDealers[0].dealer_id;
};

export const getDealershipsByEmail = (
  dealers: Record<string, any>,
  bidsByDealerId: Record<string, any[]>,
  email: string
) => {
  return Object.values(dealers)
    .filter((dealer) => dealer.YourEmail === email)
    .map((dealer) => {
      const bids = bidsByDealerId?.[dealer.id] || [];
      return { ...dealer, bids: bids, bidCount: bids.length };
    });
};

export const getAllUsers = async (): Promise<[any[], Record<string, any>]> => {
  const userQuery = await getDocs(
    query(collection(db, "users"), where("privilege", "==", "Dealer"))
  );
  const dealerQuery = await getDocs(query(collection(db, "Dealers")));

  const users = userQuery.docs.map((doc) => {
    const data = doc.data();
    return { firebaseId: doc.id, ...data } as any;
  });
  const dealerSnapshot = dealerQuery.docs.map((doc) => doc.data());
  const dealersById: Record<string, any> = {};
  dealerSnapshot.forEach((dealer) => {
    dealersById[dealer.id] = dealer;
  });

  const filteredUsers = users.filter((user) => {
    if (!dealersById?.[user.dealer_id[0]]) {
      return true;
    }

    return false;
  });

  return [filteredUsers, dealersById];
};

export const getBidsByDealerId = async () => {
  const bidsQuery = await getDocs(query(collection(db, "Incoming Bids")));
  const bidsByDealerId: Record<string, any[]> = {};
  bidsQuery.docs.forEach((doc) => {
    const bid = doc.data();
    if (!bidsByDealerId[bid.dealer_id]) {
      bidsByDealerId[bid.dealer_id] = [];
    }
    bidsByDealerId[bid.dealer_id].push(bid);
  });

  return bidsByDealerId;
};

export const main = async () => {
  console.log("Looking up dealers...");
  const [users, dealersById] = await getAllUsers();
  const bidsByDealerId = await getBidsByDealerId();
  let noDealers = 0;
  let singleDealer = 0;
  let multipleDealers = 0;

  // .filter((u) => u.dealer_id[0] === "rec8dQe9Wa")
  for (const user of users) {
    const foundDealers = getDealershipsByEmail(
      dealersById,
      bidsByDealerId,
      user.email
    );
    console.log(user.id, user.email, user.dealer_id);
    console.log("-> Found", foundDealers.length, "dealers");
    let newDealerId = null;

    if (foundDealers.length === 0) {
      noDealers++;
    } else if (foundDealers.length === 1) {
      singleDealer++;
      newDealerId = foundDealers[0].id;
    } else {
      multipleDealers++;
      newDealerId = chooseBestDealer(foundDealers);
    }

    if (newDealerId) {
      await updateDoc(doc(collection(db, "users"), user.firebaseId), {
        dealer_id: [newDealerId],
      });
      // break;
    } else {
      console.log("need to delete user", user.id);
    }
  }

  console.log(`Found ${users.length} dealers`);
  console.log(`No dealers found: ${noDealers}`);
  console.log(`Single dealer found: ${singleDealer}`);
  console.log(`Multiple dealers found: ${multipleDealers}`);
};

main().then(() => process.exit(0));
