import { config } from "dotenv";
config();

import { db } from "@/firebase/config";

import { collection, getDocs } from "firebase/firestore";

export const main = async () => {
  const userQuery = await getDocs(collection(db, "users"));
  const usersByEmail: any = {};
  const users: any[] = userQuery.docs.map((doc) => doc.data());

  users.forEach((user: any) => {
    if (!user.email) {
      return;
    }

    if (!usersByEmail[user.email]) {
      usersByEmail[user.email] = [];
    }

    usersByEmail[user.email].push(user);
  });

  const duplicatedEmails = Object.keys(usersByEmail).filter((email) => {
    if (usersByEmail[email].length > 1) {
      return true;
    }
  });

  console.log(duplicatedEmails.length);
};

main().then(() => {
  process.exit(0);
});
