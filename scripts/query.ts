import { config } from "dotenv";
config();
import { db } from "@/firebase/config";
import { collection, getDocs } from "firebase/firestore";

async function run() {
  const startOfMay = new Date(2025, 4, 1); // May 1
  const startOfJune = new Date(2025, 5, 1); // June 1

  const negotiations = collection(db, "delivrd_negotiations");
  const snapshot = await getDocs(negotiations);
  const mayDocs = snapshot.docs.filter((doc) => {
    const raw = doc.get("datePaid");
    const date = raw ? new Date(raw) : null;
    return date && date >= startOfMay && date < startOfJune;
  });

  console.log(`Found ${mayDocs.length} documents with datePaid in May 2025`);
  return mayDocs;
}

run().then(() => {
  console.log("Finished");
});
