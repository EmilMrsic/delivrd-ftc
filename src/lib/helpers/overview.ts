import { db } from "@/firebase/config";
import { getAllNegotiations } from "./negotiation";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { DealNegotiatorType, NegotiationDataType } from "../models/team";
import { UserType } from "../models/user";
import { isSameDay, isThisMonth, isThisWeek } from "./dates";

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

export const generateOverviews = async () => {
  const deals = await getAllNegotiations();
  const metricsCacheTable = collection(db, "delivrd_metrics_cache");
  const teamDelivrdTable = collection(db, "team delivrd");
  const userTable = collection(db, "users");
  const teamDelivrdQuery = await getDocs(query(teamDelivrdTable));
  const teamDelivrd = teamDelivrdQuery.docs.map(
    (doc) =>
      ({
        id: doc.id,
        ...doc.data(),
      } as DealNegotiatorType)
  );
  const teamMemberEmails = teamDelivrd.map((member) => member.email);
  const userSnapshot = await getDocs(
    query(userTable, where("email", "in", teamMemberEmails))
  );
  const usersByEmail: { [key: string]: UserType } = {};
  userSnapshot.docs
    .map((doc) => {
      const data = doc.data();
      return data;
    })
    .filter((user) => user.privilege === "Team")
    .forEach((user) => {
      usersByEmail[user.email] = user as UserType;
    });

  const teamMembersWithUserAccount = teamDelivrd.filter(
    (member) => usersByEmail[member.email]
  );

  const coordinators: { [key: string]: DealNegotiatorType } =
    teamDelivrd.reduce(
      (
        acc: { [key: string]: DealNegotiatorType },
        coordinator: DealNegotiatorType
      ) => {
        acc[coordinator.id] = coordinator;
        return acc;
      },
      {}
    );

  const day = new Date();
  const month = (day.getMonth() + 1).toString().padStart(2, "0");
  const year = day.getFullYear();
  const dayOfMonth = day.getDate().toString().padStart(2, "0");
  const todaysDate = `${month}-${dayOfMonth}-${year}`;

  for (const coordinator of teamMembersWithUserAccount) {
    const user = usersByEmail[coordinator.email];
    let mode = user.mode || "coordinator";
    if (mode === "deal coordinator") {
      mode = "coordinator";
    }

    const activeDealsByNegotiator: { [key: string]: number } = {};

    const shippingAndPickingUpTodayByCoordinator: {
      [key: string]: {
        pickingUpToday: NegotiationDataType[];
        shippingToday: NegotiationDataType[];
      };
    } = {};

    let activeDeals = 0;
    let closedDeals = 0;
    let pickingUpToday: NegotiationDataType[] = [];
    let shippingToday: NegotiationDataType[] = [];
    let salesThisWeek = 0;
    let salesThisMonth = 0;

    // Do something with the user and coordinator
    console.log(
      "calculating metrics for team Member:",
      coordinator.name,
      `[${coordinator.id}]`,
      "with role",
      mode
    );

    deals.forEach((deal) => {
      if (mode === "reviewer" && coordinator?.visible) {
        if (!shippingAndPickingUpTodayByCoordinator[coordinator.name]) {
          shippingAndPickingUpTodayByCoordinator[coordinator.name] = {
            pickingUpToday: [],
            shippingToday: [],
          };
        }
      }

      if (
        ["Paid", "Deal Started", "Actively Negotiating"].includes(
          deal.stage as string
        )
      ) {
        // if assigned, make sure the coordinator is "visible" e.g. not a dev
        if (
          mode === "coordinator" &&
          coordinator.id !== deal.dealCoordinatorId
        ) {
          // do nothing, rewrite this somehow
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
            deal.dealCoordinatorId !== coordinator.id
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
            deal.dealCoordinatorId !== coordinator.id
          ) {
            return;
          }
          shippingToday.push(deal as NegotiationDataType);
        }
      }

      if (deal.datePaid && isThisWeek(new Date(deal.datePaid))) {
        salesThisWeek++;
      }

      if (deal.datePaid && isThisMonth(new Date(deal.datePaid))) {
        salesThisMonth++;
      }
    });

    const [dailyClosedDeals, weeklyClosedDeals, coordinatorSalesThisWeek] =
      await countClosedDeals(deals, mode, user);

    for (const dealCoordinatorId of Object.keys(coordinatorSalesThisWeek)) {
      coordinatorSalesThisWeek[dealCoordinatorId].coordinatorName =
        coordinators[dealCoordinatorId].name;
    }

    const outputRow = {
      activeDeals,
      pickingUpToday,
      shippingToday,
      dailyClosedDeals,
      weeklyClosedDeals,
      // metrics,
      salesThisWeek,
      salesThisMonth,
      coordinatorSalesThisWeek,
      activeDealsByNegotiator,
      shippingAndPickingUpTodayByCoordinator,
    };

    const cacheDoc = doc(metricsCacheTable, coordinator.id);
    await setDoc(cacheDoc, outputRow);
  }
};

export const countClosedDeals = async (
  deals: NegotiationDataType[],
  mode: string,
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
