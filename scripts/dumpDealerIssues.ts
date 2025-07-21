import { config } from "dotenv";
config();
import { db } from "@/firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import { fetchBulkQuery } from "@/lib/helpers/firebase";

export const grabDealerRows = async (dealerLogins: any) => {
  const users = await fetchBulkQuery(
    "users",
    "id",
    dealerLogins.map((login: any) => login.userId)
  );

  //   console.log("found users:", users);
  const dealerIds = users
    .map((user: any) => {
      return user.dealer_id?.[0] || user?.dealer_id;
    })
    .filter((dealerId: any) => dealerId !== undefined);

  const userMap: Record<string, any> = {};
  users.forEach((user: any) => {
    userMap[user.id] = user;
  });

  const dealerRows = await fetchBulkQuery("Dealers", "id", dealerIds);
  const dealerRowMap: Record<string, any> = {};
  dealerRows.forEach((row: any) => {
    dealerRowMap[row.id] = row;
  });

  const finalDealerLogins = dealerLogins.map((login: any) => {
    const user = userMap[login.userId];
    const dealerId = user.dealer_id?.[0] || user?.dealer_id;
    const dealer = dealerRowMap[dealerId];
    return {
      ...login,
      user: {
        ...user,
        dealer,
      },
    };
  });

  return finalDealerLogins;
};

export const main = async () => {
  const dealerLoginSnapshot = await getDocs(
    query(
      collection(db, "delivrd_user_logins"),
      where("userType", "==", "Dealer"),
      where("host", "==", "delivrdfor.me")
    )
  );

  const dealerLogins = dealerLoginSnapshot.docs.map((doc) => doc.data());
  console.log("Found", dealerLogins.length, "dealer logins");
  const dealers = await grabDealerRows(dealerLogins);

  dealers.forEach((dealer: any) => {
    if (!dealer.user?.dealer?.updated) {
      console.log("found an issue!", dealer);
    }
  });
};

main().then(() => {
  process.exit(0);
});
