import { config } from "dotenv";
config();

import { db } from "@/firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";

import { Timestamp } from "firebase/firestore";
import { toZonedTime } from "date-fns-tz";

export const main = async () => {
  const tzOffset = -7; // e.g. PDT = -7, adjust as needed
  const now = new Date();
  now.setDate(now.getDate() - 11);

  // "Yesterday" relative to local time
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);

  // Start = 11 PM yesterday
  const start = new Date(
    yesterday.getFullYear(),
    yesterday.getMonth(),
    yesterday.getDate(),
    0,
    0,
    0
  );

  // End = 3 AM today
  const end = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    3,
    0,
    0
  );

  const startTs = Timestamp.fromDate(start);
  const endTs = Timestamp.fromDate(end);

  //   const start = Timestamp.fromDate(
  //     new Date(Date.now() -  * 24 * 60 * 60 * 1000)
  //   );
  const q = query(
    collection(db, "delivrd_user_logins"),
    where("loginInitiationTimestamp", ">=", start),
    where("loginInitiationTimestamp", "<", endTs)
  );

  const snap = await getDocs(q);
  console.log("got snapshot", snap.size);
  snap.forEach((doc) => {
    const data = doc.data();
    if (data.loginInitiationTimestamp instanceof Timestamp) {
      const utc = data.loginInitiationTimestamp;
      //   const zonedTime = toZonedTime(utc, "America/Los Angeles");
      //   console.log(zonedTime);

      console.log(utc.toDate(), data.email, data.emailFound);
    }
  });
};

main().then(() => {
  process.exit(0);
});
