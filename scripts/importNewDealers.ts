import { db } from "@/firebase/config";
import { generateRandomId } from "@/lib/utils";
import { collection, doc, getDocs, query, setDoc } from "firebase/firestore";
import { readFileSync } from "fs";
import { parse } from "papaparse";

export const main = async () => {
  const file = readFileSync("/tmp/ftc-list.csv", "utf-8");
  const result = parse(file, {
    header: true,
    skipEmptyLines: true,
  });

  const dealerSnapshot = await getDocs(query(collection(db, "Dealers")));
  const existingDealers = dealerSnapshot.docs.map((doc) => doc.data());
  const usersSnapshot = await getDocs(query(collection(db, "users")));
  const existingUsers = usersSnapshot.docs.map((doc) => doc.data());

  const dealers: any[] = [];
  let total = 0;
  let existsTotal = 0;
  let usersExistTotal = 0;
  let dealersWithoutUser = 0;
  let usersWithoutDealer = 0;
  // result.data.forEach((row: any) => {
  for (const row of result.data as any[]) {
    const dealerId = generateRandomId();
    const userId = generateRandomId();

    const dealer = {
      id: dealerId,
      Brand: row["Brand"].slice(","),
      Dealership: row["Dealership"],
      SalesPersonName: row["Sales Person Name"],
      YourEmail: row["Your Email"],
      City: row["City"],
      State: row["State"],
      source: "csv-ftc-list-(airtable)",
    };

    const user = {
      id: userId,
      dealer_id: [dealerId],
      email: row["Your Email"],
      name: dealer.SalesPersonName,
      privilege: "Dealer",
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      source: "csv-ftc-list-(airtable)",
    };

    // console.log("row", dealer);
    const dealerExists = existingDealers.find((d) => {
      const emailExists = d.YourEmail === dealer.YourEmail;
      if (!emailExists) {
        if (
          d.Dealership === dealer.Dealership &&
          d.State === dealer.State &&
          d.City === dealer.City
        ) {
          return true;
        }

        return false;
      }

      return true;
    });

    const userExists = existingUsers.find((u) => u.email === user.email);

    // console.log("exists", exists);
    // if (dealerExists) {
    //   existsTotal++;
    // }

    // if (userExists) {
    //   usersExistTotal++;
    // }

    // if (!dealerExists && userExists) {
    //   console.log("user without a dealer", row, user, userExists);
    //   usersWithoutDealer++;
    // }

    if (!dealerExists && !userExists) {
      // insert both dealer and user
      const dealerDoc = doc(db, "Dealers", dealerId);
      const dealerResult = await setDoc(dealerDoc, dealer);

      const userDoc = doc(db, "users", userId);
      const result = await setDoc(userDoc, user);
    }

    if (dealerExists && !userExists) {
      // insert just user
      const userDoc = doc(db, "users", userId);
      const result = await setDoc(userDoc, user);
      console.log(result);
      console.log("got here:", user.id);
    }

    total++;
  }

  console.log("total rows", total);
  console.log("existing dealers", existsTotal);
  console.log("existing users", usersExistTotal);
  console.log("dealers without user", dealersWithoutUser);
  console.log("users without dealer", usersWithoutDealer);
  //   console.log("new dealers to add", dealers.length);
};

main().then(() => process.exit(0));
