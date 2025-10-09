import { db } from "@/firebase/config";
import { generateRandomId } from "@/lib/utils";
import { collection, doc, setDoc } from "firebase/firestore";

export const main = async () => {
  const newDealerId = generateRandomId();
  const newUserId = generateRandomId();

  const dealerRow = {
    Brand: [],
    id: newDealerId,
    Dealership: "Test Dealer",
    Position: "Manager",
    SalesPersonName: "John Doe",
    SalesPersonPhone: "(618) 751-6231",
    YourEmail: "dylandealer@thankyuu.com",
    YourWebsite: "https://example.com",
    State: "IL",
    City: "Springfield",
    source: "addNewDealer Script",
  };

  const userRow = {
    id: newUserId,
    dealer_id: [newDealerId],
    createdAt: new Date().toISOString(),
    email: "dylandealer@thankyuu.com",
    name: "John Doe",
    phone: "(618) 751-6231",
    privilege: "Dealer",
  };

  console.log(dealerRow, userRow);

  const dealerTable = collection(db, "Dealers");
  const usersTable = collection(db, "users");

  const dealerDoc = doc(dealerTable, newDealerId);
  const userDoc = doc(usersTable, newUserId);

  await Promise.all([setDoc(dealerDoc, dealerRow), setDoc(userDoc, userRow)]);
};

main().then(() => {
  process.exit(0);
});
