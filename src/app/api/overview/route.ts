import { db } from "@/firebase/config";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";
import {
  collection,
  doc,
  DocumentData,
  getDoc,
  getDocs,
  query,
  QuerySnapshot,
  where,
} from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

const getUserDataFromDb = async (id: string) => {
  const userRef = doc(db, "users", id);
  const userDoc = await getDoc(userRef);
  return userDoc.data();
};

export const POST = async (request: NextRequest): Promise<NextResponse<{}>> => {
  const body = await request.json();
  const { mode } = body;
  const headers = request.headers;
  const userData = await getUserDataFromDb(headers.get("auth") as string);
  const negotiationsTable = collection(db, "delivrd_negotiations");
  const archivedTable = collection(db, "delivrd_archive");
  const metricsTable = collection(db, "metrics");
  const teamDelivrdTable = collection(db, "team delivrd");

  const day = new Date();
  const month = (day.getMonth() + 1).toString().padStart(2, "0");
  const year = day.getFullYear();
  const dayOfMonth = day.getDate().toString().padStart(2, "0");
  const todaysDate = `${month}-${dayOfMonth}-${year}`;

  // rechGSd56lVxxJYcs

  const dealsQuery = getDocs(query(negotiationsTable));
  const archivedDealsQuery = getDocs(query(archivedTable));
  const metricsQuery = getDocs(query(metricsTable));
  const teamDelivrdQuery = getDocs(query(teamDelivrdTable));

  const [
    dealsSnapshot,
    archivedDealsSnapshot,
    metricsSnapshot,
    teamDelivrdSnapshot,
  ] = await Promise.all([
    dealsQuery,
    archivedDealsQuery,
    metricsQuery,
    teamDelivrdQuery,
  ]);

  const deals = dealsSnapshot.docs.map(
    (doc) => doc.data() as NegotiationDataType
  );
  const archivedDeals = archivedDealsSnapshot.docs.map(
    (doc) => doc.data() as NegotiationDataType
  );
  const allDeals: NegotiationDataType[] = [...deals, ...archivedDeals];
  const metrics = metricsSnapshot.docs.map((doc) => doc.data())[0];
  let activeDeals = 0;
  let closedDeals = 0;
  let pickingUpToday: NegotiationDataType[] = [];
  let shippingToday: NegotiationDataType[] = [];
  let salesThisWeek = 0;
  let salesThisMonth = 0;
  const activeDealsByNegotiator: { [key: string]: number } = {};

  const coordinators: { [key: string]: DealNegotiatorType } = {};
  teamDelivrdSnapshot.docs.forEach((doc) => {
    coordinators[doc.id] = doc.data() as DealNegotiatorType;
  });

  const shippingAndPickingUpTodayByCoordinator: {
    [key: string]: {
      pickingUpToday: NegotiationDataType[];
      shippingToday: NegotiationDataType[];
    };
  } = {};

  console.log("allDeals", mode, userData?.id);

  allDeals.forEach((deal) => {
    const coordinator = coordinators[deal.dealCoordinatorId];

    if (mode === "reviewer" && coordinator?.visible) {
      if (!shippingAndPickingUpTodayByCoordinator[coordinator.name]) {
        shippingAndPickingUpTodayByCoordinator[coordinator.name] = {
          pickingUpToday: [],
          shippingToday: [],
        };
      }
    }

    if (["Paid", "Deal Started", "Actively Negotiating"].includes(deal.stage)) {
      // if assigned, make sure the coordinator is "visible" e.g. not a dev
      if (coordinator?.visible || !coordinator) {
        const coordinatorName =
          coordinators[deal.dealCoordinatorId]?.name ?? "Unassigned";
        if (!activeDealsByNegotiator[coordinatorName]) {
          activeDealsByNegotiator[coordinatorName] = 0;
        }
        activeDealsByNegotiator[coordinatorName]++;

        activeDeals++;
      }
    } else if (
      deal.arrivalToClient == todaysDate &&
      deal.stage === "Deal Complete- Local"
    ) {
      if (mode === "reviewer" && coordinator?.visible) {
        shippingAndPickingUpTodayByCoordinator[
          coordinator.name
        ].pickingUpToday.push(deal as NegotiationDataType);
      } else {
        if (mode === "coordinator" && deal.dealCoordinatorId !== userData?.id) {
          return;
        }
        pickingUpToday.push(deal as NegotiationDataType);
      }
    } else if (
      deal.arrivalToClient == todaysDate &&
      (deal.stage === "Shipping" ||
        deal.stage === "Deal Complete- Long Distance")
    ) {
      if (mode === "reviewer" && coordinator?.visible) {
        shippingAndPickingUpTodayByCoordinator[
          coordinator.name
        ].shippingToday.push(deal as NegotiationDataType);
      } else {
        if (mode === "coordinator" && deal.dealCoordinatorId !== userData?.id) {
          return;
        }
        shippingToday.push(deal as NegotiationDataType);
      }
    } else if (deal.datePaid && isThisWeek(new Date(deal.datePaid))) {
      salesThisWeek++;
    } else if (deal.datePaid && isThisMonth(new Date(deal.datePaid))) {
      salesThisMonth++;
    }
  });

  const [dailyClosedDeals, weeklyClosedDeals, coordinatorSalesThisWeek] =
    await countClosedDeals(allDeals);

  for (const dealCoordinatorId of Object.keys(coordinatorSalesThisWeek)) {
    coordinatorSalesThisWeek[dealCoordinatorId].coordinatorName =
      coordinators[dealCoordinatorId].name;
  }

  return NextResponse.json({
    activeDeals,
    pickingUpToday,
    shippingToday,
    dailyClosedDeals,
    weeklyClosedDeals,
    metrics,
    salesThisWeek,
    salesThisMonth,
    coordinatorSalesThisWeek,
    activeDealsByNegotiator,
    shippingAndPickingUpTodayByCoordinator,
  });
};

const countClosedDeals = async (
  deals: NegotiationDataType[]
): Promise<
  [
    number,
    number,
    { [key: string]: { coordinatorName: string; sales: number } }
  ]
> => {
  let dailyClosedDeals = 0;
  let weeklyClosedDeals = 0;

  const coordinatorSalesThisWeek: {
    [key: string]: { coordinatorName: string; sales: number };
  } = {};

  deals.forEach((deal) => {
    if (deal.closeDate) {
      let useableDate = deal.closeDate;
      if (deal.closeDate.includes("T")) {
        useableDate = deal.closeDate.split("T")[0];
      }
      const closeDate = new Date(useableDate);
      if (isSameDay(closeDate, new Date())) {
        dailyClosedDeals++;
      }
      // if (isThisMonth(closeDate)) {
      //   monthlyClosedDeals++;
      // }

      if (isThisWeek(closeDate)) {
        weeklyClosedDeals++;

        if (deal.dealCoordinatorId) {
          if (!coordinatorSalesThisWeek[deal.dealCoordinatorId]) {
            coordinatorSalesThisWeek[deal.dealCoordinatorId] = {
              sales: 0,
              coordinatorName: "",
            };
          }

          coordinatorSalesThisWeek[deal.dealCoordinatorId].sales++;
        }
      }
    }
  });

  return [dailyClosedDeals, weeklyClosedDeals, coordinatorSalesThisWeek];
};

const isSameDay = (date1: Date, date2: Date) => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

const isWithinLast30Days = (date: Date) => {
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);

  // Remove time part for accurate comparison
  now.setHours(0, 0, 0, 0);
  thirtyDaysAgo.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);

  return date >= thirtyDaysAgo && date <= now;
};

const isThisMonth = (date: Date) => {
  const now = new Date();
  return (
    date.getMonth() === now.getMonth() &&
    date.getFullYear() === now.getFullYear()
  );
};

// check if the date this week, including sunday
const isThisWeek = (date: Date) => {
  const now = new Date();
  const lastSaturday = new Date();
  lastSaturday.setDate(now.getDate() - now.getDay() - 1);
  const nextSunday = new Date();
  nextSunday.setDate(now.getDate() + (6 - now.getDay()));
  return date >= lastSaturday && date <= nextSunday;
};
