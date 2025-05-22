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
import { toZonedTime } from "date-fns-tz";
import { isSameWeek } from "date-fns";

const getUserDataFromDb = async (id: string) => {
  const userRef = doc(db, "users", id);
  const userDoc = await getDoc(userRef);
  return userDoc.data();
};

export interface DealCountType {
  count: number;
  deals: NegotiationDataType[];
}

export interface OverviewDashboardData {
  activeDeals: number;
  pickingUpToday: NegotiationDataType[];
  shippingToday: NegotiationDataType[];
  dailyClosedDeals: DealCountType;
  weeklyClosedDeals: DealCountType;
  metrics: any;
  salesThisWeek: number;
  salesThisMonth: number;
  coordinatorSalesThisWeek: {
    [key: string]: { coordinatorName: string; sales: DealCountType };
  };
  activeDealsByNegotiator: { [key: string]: number };
  shippingAndPickingUpTodayByCoordinator: {
    [key: string]: {
      pickingUpToday: NegotiationDataType[];
      shippingToday: NegotiationDataType[];
    };
  };
}

export const POST = async (
  request: NextRequest
): Promise<NextResponse<OverviewDashboardData>> => {
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
  const metrics =
    mode === "coordinator"
      ? {
          dailyGoal: userData?.dailyGoal || 0,
          monthlyGoal: userData?.weeklyGoal || 0,
        }
      : metricsSnapshot.docs.map((doc) => doc.data())[0];
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
      console.log(
        "coordinator",
        userData?.deal_coordinator_id,
        deal.dealCoordinatorId
      );
      if (
        mode === "coordinator" &&
        userData?.deal_coordinator_id !== deal.dealCoordinatorId
      ) {
      } else {
        if (coordinator?.visible || !coordinator) {
          const coordinatorName =
            coordinators[deal.dealCoordinatorId]?.name ?? "Unassigned";
          if (!activeDealsByNegotiator[coordinatorName]) {
            activeDealsByNegotiator[coordinatorName] = 0;
          }
          activeDealsByNegotiator[coordinatorName]++;

          activeDeals++;
        }
      }
    }

    if (
      deal.arrivalToClient == todaysDate &&
      deal.stage === "Deal Complete- Local"
    ) {
      if (mode === "reviewer" && coordinator?.visible) {
        shippingAndPickingUpTodayByCoordinator[
          coordinator.name
        ].pickingUpToday.push(deal as NegotiationDataType);
      } else {
        if (
          mode === "coordinator" &&
          deal.dealCoordinatorId !== userData?.deal_coordinator_id
        ) {
          return;
        }
        pickingUpToday.push(deal as NegotiationDataType);
      }
    }

    if (
      deal.arrivalToClient == todaysDate &&
      (deal.stage === "Shipping" ||
        deal.stage === "Deal Complete- Long Distance")
    ) {
      if (mode === "reviewer" && coordinator?.visible) {
        shippingAndPickingUpTodayByCoordinator[
          coordinator.name
        ].shippingToday.push(deal as NegotiationDataType);
      } else {
        if (
          mode === "coordinator" &&
          deal.dealCoordinatorId !== userData?.deal_coordinator_id
        ) {
          return;
        }
        shippingToday.push(deal as NegotiationDataType);
      }
    }

    if (deal.datePaid && isThisWeek(new Date(deal.datePaid))) {
      // console.log("salesThisWeek", deal.datePaid);
      salesThisWeek++;
    }

    if (deal.datePaid && isThisMonth(new Date(deal.datePaid))) {
      // console.log("salesThisMonth", deal.datePaid, salesThisMonth);
      salesThisMonth++;
    }
  });

  const [dailyClosedDeals, weeklyClosedDeals, coordinatorSalesThisWeek] =
    await countClosedDeals(allDeals as NegotiationDataType[], mode, userData);

  for (const dealCoordinatorId of Object.keys(coordinatorSalesThisWeek)) {
    coordinatorSalesThisWeek[dealCoordinatorId].coordinatorName =
      coordinators[dealCoordinatorId].name;
  }

  console.log("activeDeals", activeDeals);

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
  deals: NegotiationDataType[],
  mode: "coordinator" | "owner" | "reviewer",
  userData: any
): Promise<
  [
    DealCountType,
    DealCountType,
    { [key: string]: { coordinatorName: string; sales: DealCountType } }
  ]
> => {
  let dailyClosedDeals = { count: 0, deals: [] };
  let weeklyClosedDeals = { count: 0, deals: [] };

  const coordinatorSalesThisWeek: {
    [key: string]: { coordinatorName: string; sales: DealCountType };
  } = {};

  deals.forEach((deal: NegotiationDataType) => {
    if (
      mode === "coordinator" &&
      userData?.deal_coordinator_id !== deal.dealCoordinatorId
    ) {
      return;
    }

    if (deal.closeDate) {
      let useableDate = deal.closeDate;
      if (deal.closeDate.includes("T")) {
        useableDate = deal.closeDate.split("T")[0];
      }

      const closeDate = new Date(useableDate);
      if (isSameDay(closeDate, new Date())) {
        dailyClosedDeals.count++;
        // @ts-ignore
        dailyClosedDeals.deals.push(deal);
      }

      if (isThisWeek(closeDate)) {
        // if (isWithinLast30Days(closeDate)) {
        weeklyClosedDeals.count++;
        // @ts-ignore
        weeklyClosedDeals.deals.push(deal);

        if (deal.dealCoordinatorId) {
          if (!coordinatorSalesThisWeek[deal.dealCoordinatorId]) {
            coordinatorSalesThisWeek[deal.dealCoordinatorId] = {
              sales: {
                count: 0,
                deals: [],
              },
              coordinatorName: "",
            };
          }

          coordinatorSalesThisWeek[deal.dealCoordinatorId].sales.count++;
          coordinatorSalesThisWeek[deal.dealCoordinatorId].sales.deals.push(
            deal
          );
        }
      }
    }
  });

  return [dailyClosedDeals, weeklyClosedDeals, coordinatorSalesThisWeek];
};

const isSameDay = (date1: Date, date2: Date) => {
  if (!date1 || !date2) return false;

  // Convert both dates to Eastern Time
  const estDate1 = dateToTimeZone(date1);
  const estDate2 = dateToTimeZone(date2);

  // Compare year, month, and day components in Eastern Time
  return (
    estDate1.getFullYear() === estDate2.getFullYear() &&
    estDate1.getMonth() === estDate2.getMonth() &&
    estDate1.getDate() === estDate2.getDate()
  );
};

// const isSameDay = (date1: Date, date2: Date) => {
//   const formatter = dateTimeFormatter();
//   // console.log(
//   //   "looking at day",
//   //   formatter.format(date1) === formatter.format(date2)
//   // );

//   return formatter.format(date1) === formatter.format(date2);

//   return (
//     date1.getFullYear() === date2.getFullYear() &&
//     date1.getMonth() === date2.getMonth() &&
//     date1.getDate() === date2.getDate()
//   );
// };

// const isWithinLast30Days = (date: Date) => {
//   const now = new Date();
//   const thirtyDaysAgo = new Date();
//   thirtyDaysAgo.setDate(now.getDate() - 30);

//   // Remove time part for accurate comparison
//   now.setHours(0, 0, 0, 0);
//   thirtyDaysAgo.setHours(0, 0, 0, 0);
//   date.setHours(0, 0, 0, 0);

//   return date >= thirtyDaysAgo && date <= now;
// };

const isThisMonth = (date: Date) => {
  if (!date) return false;
  // Convert dates to Eastern Time
  const estNow = dateToTimeZone(new Date());
  const estDate = dateToTimeZone(date);

  // Extract year and month from the EST dates
  const estNowYear = estNow.getFullYear();
  const estNowMonth = estNow.getMonth();

  // Check if the date falls within the same year and month in EST
  return (
    estDate.getFullYear() === estNowYear && estDate.getMonth() === estNowMonth
  );

  // if (!date) return false;

  // const now = dateToTimeZone(new Date());

  // Compare year and month in Eastern Time
  // return dateYear === nowYear && dateMonth === nowMonth;
  // const useableDate = date ? dateToTimeZone(date) : null;

  // const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  // const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  // return (
  //   useableDate && useableDate >= startOfMonth && useableDate < startOfNextMonth
  // );
};

// check if the date this week, including sunday
const isThisWeek = (date: Date) => {
  if (!date) return false;

  // Convert both dates to Eastern Time
  const estNow = dateToTimeZone(new Date());
  const estDate = dateToTimeZone(date);

  // Use date-fns to check if they're in the same week
  return isSameWeek(estDate, estNow, { weekStartsOn: 0 });
  // const now = new Date();
  // const lastSaturday = new Date();
  // lastSaturday.setDate(now.getDate() - now.getDay() - 1);
  // const nextSunday = new Date();
  // nextSunday.setDate(now.getDate() + (7 - now.getDay()));
  // return date >= lastSaturday && date <= nextSunday;
};

const dateTimeFormatter = () => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  });

  return formatter;
};

const dateToTimeZone = (date: Date) => {
  return toZonedTime(date, "America/New_York");
};
