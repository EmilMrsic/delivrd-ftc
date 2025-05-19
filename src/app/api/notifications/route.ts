import { db } from "@/firebase/config";
import { getUserDataFromDb } from "@/lib/helpers/user";
import { NotificationDataType } from "@/lib/models/notification";
import { NegotiationDataType } from "@/lib/models/team";
import {
  collection,
  getDocs,
  orderBy,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  const headers = request.headers;
  const userData = await getUserDataFromDb(headers.get("auth") as string);
  // console.log("got here", headers.get("auth"));
  // const twentyFourHoursAgo = Timestamp.fromDate(
  //   new Date(Date.now() - 24 * 60 * 60 * 1000)
  // );
  const twentyFourHoursAgo = new Date(
    Date.now() - 24 * 60 * 60 * 1000
  ).toISOString();

  // Query 1: All unread items
  const unreadQuery = query(
    collection(db, "delivrd_notifications"),
    where("read", "==", false),
    orderBy("createdAt", "desc")
  );

  // Query 2: Read items less than 24 hours old
  const recentReadQuery = query(
    collection(db, "delivrd_notifications"),
    where("read", "==", true),
    where("createdAt", ">", twentyFourHoursAgo),
    orderBy("createdAt", "desc")
  );

  // Get both results
  const [unreadSnapshot, recentReadSnapshot] = await Promise.all([
    getDocs(unreadQuery),
    getDocs(recentReadQuery),
  ]);

  // Combine the results
  const notificationsSnapshot = [
    ...unreadSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as NotificationDataType)
    ),
    ...recentReadSnapshot.docs.map(
      (doc) => ({ id: doc.id, ...doc.data() } as NotificationDataType)
    ),
  ];

  const table = collection(db, "delivrd_notifications");
  // const notificationsQuery = query(
  //   table,
  //   where("dealCoordinatorId", "==", userData?.deal_coordinator_id)
  // );
  // const notificationsSnapshot = await getDocs(notificationsQuery);

  const authorIds = new Set<string>();
  const bidIds = new Set<string>();
  const negotiationIds = new Set<string>();

  console.log("notificationsSnapshot", notificationsSnapshot);

  const notifications = Array.from(notificationsSnapshot).map((data) => {
    if (data.data.author && !authorIds.has(data.data.author)) {
      authorIds.add(data.data.author);
    }

    if (data.data.bidId && !bidIds.has(data.data.bidId)) {
      bidIds.add(data.data.bidId);
    }

    if (
      data.data.negotiationId &&
      !negotiationIds.has(data.data.negotiationId)
    ) {
      negotiationIds.add(data.data.negotiationId);
    }

    return data;
  });

  const requests = [
    Array.from(authorIds).length
      ? getDocs(
          query(
            collection(db, "users"),
            where("id", "in", Array.from(authorIds))
          )
        )
      : Promise.resolve({
          docs: [],
        }),
    Array.from(bidIds).length
      ? getDocs(
          query(
            collection(db, "Incoming Bids"),
            where("bid_id", "in", Array.from(bidIds))
          )
        )
      : Promise.resolve({
          docs: [],
        }),

    Array.from(negotiationIds).length
      ? getDocs(
          query(
            collection(db, "delivrd_negotiations"),
            where("id", "in", Array.from(negotiationIds))
          )
        )
      : Promise.resolve({
          docs: [],
        }),
  ];

  const [authorsSnapshot, bidsSnapshot, negotiationsSnapshot] =
    await Promise.all(requests);

  const authors: Record<string, any> = {};
  const bids: Record<string, any> = {};
  const negotiations: Record<string, any> = {};

  authorsSnapshot?.docs.map((doc) => {
    const data = doc.data();
    authors[data.id] = data;
  });

  bidsSnapshot?.docs.map((doc) => {
    const data = doc.data();
    bids[data.bid_id] = data;
  });

  negotiationsSnapshot?.docs.map((doc) => {
    const data = doc.data();
    negotiations[data.id] = data;
  });

  const notificationData = notifications.map((notification) => {
    const newNotification = {
      ...notification,
    };

    if (bids[notification.data.bidId]) {
      console.log("found:", bids[notification.data.bidId]);
      newNotification.data.bid = bids[notification.data.bidId];
    }

    if (authors[notification.data.author]) {
      newNotification.data.author = authors[notification.data.author];
    }

    if (negotiations[notification.data.negotiationId]) {
      newNotification.data.negotiation =
        negotiations[notification.data.negotiationId];
    }

    // switch (notification.type) {
    //   case "bid_comment":
    //     console.log("got here", notification.data.bidId, bids);
    //     break;
    // }

    return newNotification;
  });

  return NextResponse.json({ notificationData });
};
