import { db } from "@/firebase/config";
import { NegotiationDataType } from "@/lib/models/team";
import {
  collection,
  DocumentData,
  getDocs,
  query,
  QuerySnapshot,
  where,
} from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (
  request: NextRequest
): Promise<NextResponse<{ activeDeals: number }>> => {
  const body = await request.json();
  const negotiationsTable = collection(db, "delivrd_negotiations");
  const archivedTable = collection(db, "delivrd_archive");
  const metricsTable = collection(db, "metrics");
  const activeDealsQuery = getDocs(
    query(
      negotiationsTable,
      where("stage", "in", ["Paid", "Deal Started", "Actively Negotiating"])
    )
  );

  const pickingUpAndShippingQueryConditions: any = [
    where("stage", "in", [
      "Deal Complete- Local",
      "Deal Complete- Long Distance",
      "Shipping",
    ]),
  ];
  const day = new Date();
  const month = (day.getMonth() + 1).toString().padStart(2, "0");
  const year = day.getFullYear();
  const dayOfMonth = day.getDate().toString().padStart(2, "0");
  const todaysDate = `${month}-${dayOfMonth}-${year}`;
  // rechGSd56lVxxJYcs
  pickingUpAndShippingQueryConditions.push(
    where("arrivalToClient", "==", todaysDate)
  );

  const pickingUpAndShippingQuery = getDocs(
    query(negotiationsTable, ...pickingUpAndShippingQueryConditions)
  );

  // const todaysTimestamp = new Date().toISOString().split("T")[0];
  // const start = `${todaysTimestamp}T00:00:00.000Z`;
  // const end = `${todaysTimestamp}T23:59:59.999Z`;
  const closedDealsQueryConditions: any = [
    where("stage", "in", ["Closed"]),
    // where("closeDate", "==", todaysDate),
    // where("closeDate", "<=", end),
  ];

  const closedDealsQuery = getDocs(
    query(archivedTable, ...closedDealsQueryConditions)
  );

  const metricsQuery = getDocs(query(metricsTable));

  let activeDeals = 0;
  let closedDeals = 0;
  let pickingUpToday: NegotiationDataType[] = [];
  let shippingToday: NegotiationDataType[] = [];

  const [
    activeDealsSnapshot,
    pickingUpAndShippingSnapshot,
    closedDealsSnapshot,
    metricsSnapshot,
  ] = await Promise.all([
    activeDealsQuery,
    pickingUpAndShippingQuery,
    closedDealsQuery,
    metricsQuery,
  ]);

  activeDealsSnapshot.forEach((doc) => {
    const data = doc.data();
    if (["Paid", "Deal Started", "Actively Negotiating"].includes(data.stage)) {
      activeDeals++;
    }
  });

  pickingUpAndShippingSnapshot.forEach((doc) => {
    const data = doc.data();
    switch (data.stage) {
      case "Deal Complete- Local":
        pickingUpToday.push(data as NegotiationDataType);
        break;
      case "Deal Complete- Long Distance":
      case "Shipping":
        shippingToday.push(data as NegotiationDataType);
        break;
    }
  });

  const [dailyClosedDeals, monthlyClosedDeals] = await countClosedDeals(
    closedDealsSnapshot
  );

  const metrics = metricsSnapshot.docs.map((doc) => doc.data())[0];

  return NextResponse.json({
    activeDeals,
    pickingUpToday,
    shippingToday,
    dailyClosedDeals,
    monthlyClosedDeals,
    metrics,
  });
};

const countClosedDeals = async (
  closedDealsSnapshot: QuerySnapshot<DocumentData>
) => {
  let dailyClosedDeals = 0;
  let monthlyClosedDeals = 0;

  closedDealsSnapshot.forEach((doc) => {
    const data = doc.data();
    if (data.closeDate) {
      let useableDate = data.closeDate;
      if (data.closeDate.includes("T")) {
        useableDate = data.closeDate.split("T")[0];
      }
      const closeDate = new Date(useableDate);
      if (isSameDay(closeDate, new Date())) {
        dailyClosedDeals++;
      }
      if (isWithinLast30Days(closeDate)) {
        monthlyClosedDeals++;
      }
      // if (isSameDay(closeDate, new Date(todaysDate))) {
      //   monthlyClosedDeals++;
      // }
    }
    // if (data.closeDate === todaysDate) {
    //   dailyClosedDeals++;
    // }
  });

  return [dailyClosedDeals, monthlyClosedDeals];
};

export const isSameDay = (date1: Date, date2: Date) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

export const isWithinLast30Days = (date: Date) => {
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  // Remove time part for accurate comparison
  now.setHours(0, 0, 0, 0);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return date >= thirtyDaysAgo && date <= now;
};
