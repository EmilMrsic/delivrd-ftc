import { config } from "dotenv";
config();

import { db } from "@/firebase/config";

import { collection, doc, getDoc, getDocs } from "firebase/firestore";

export const main = async () => {
  const userQuery = await getDoc(
    doc(db, "delivrd_client_share", "recfDX7oLNe2XtuAPTJ")
  );
  console.log(userQuery.data());
};

main().then(() => {
  process.exit(0);
});
