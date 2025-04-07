import { NegotiationData } from "@/types";
import { negotiationStatusOrder } from "../constants/negotiations";
import {
  DealNegotiatorType,
  NegotiationDataModel,
  NegotiationDataType,
} from "../models/team";
import {
  collection,
  getDocs,
  query,
  QueryConstraint,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { chunk } from "lodash";
import { Dispatch, SetStateAction } from "react";

export const sortNegotiationsByStatus = (
  negotiations: NegotiationDataType[],
  direction: "ascending" | "descending" = "ascending"
) => {
  return negotiations.sort((a, b) => {
    const statusA = a.stage ?? "";
    const statusB = b.stage ?? "";

    const indexA = negotiationStatusOrder.indexOf(statusA);
    const indexB = negotiationStatusOrder.indexOf(statusB);

    // If either status is not found in the order array, put them at the end
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return direction === "ascending" ? indexA - indexB : indexB - indexA;
  });
};

export const pruneNegotiations = (negotiations: NegotiationDataType[]) => {
  return negotiations.filter((negotiation) => {
    return (
      negotiation.stage !== "Closed" &&
      negotiation.stage !== "Paid Lost Contact" &&
      negotiation.stage !== "Refunded" &&
      negotiation.stage !== "Closed No Review"
    );
  });
};

export const sortDataHelper = (
  currentDeals: NegotiationDataType[],
  setCurrentDeals?: Dispatch<SetStateAction<NegotiationDataType[]>>
) => {
  return (key: string, direction: string) => {
    let sortedDeals: NegotiationDataType[] = [];
    if (key == "stage") {
      sortedDeals = sortNegotiationsByStatus(
        currentDeals as NegotiationDataType[],
        direction === "ascending" ? "ascending" : "descending"
      );

      if (setCurrentDeals) {
        setCurrentDeals(sortedDeals as NegotiationDataType[]);
      }
    } else {
      sortedDeals = [...currentDeals].sort((a: any, b: any) => {
        let aValue = a[key];
        let bValue = b[key];

        if (typeof aValue === "string") aValue = aValue.toLowerCase();
        if (typeof bValue === "string") bValue = bValue.toLowerCase();

        if (aValue < bValue) return direction === "ascending" ? -1 : 1;
        if (aValue > bValue) return direction === "ascending" ? 1 : -1;
        return 0;
      });

      if (setCurrentDeals) {
        setCurrentDeals(sortedDeals);
      }
    }

    if (!setCurrentDeals) {
      return sortedDeals;
    }
  };
};

export const sortMappedDataHelper = (
  mappedNegotiations: Record<string, NegotiationDataType[]>,
  key: string,
  direction: string
) => {
  const sortedMappedNegotiations: Record<string, NegotiationDataType[]> = {};
  Object.keys(mappedNegotiations).forEach((status) => {
    const sortDataFn = sortDataHelper(mappedNegotiations[status]);
    const sortedData = sortDataFn(key, direction);
    if (sortedData) {
      sortedMappedNegotiations[status] = sortedData;
    }
  });

  return sortedMappedNegotiations;
};

export const sortStatuses = (statuses: string[]) => {
  return statuses.sort((a, b) => {
    // return (
    //   negotiationStatusOrder.indexOf(a) - negotiationStatusOrder.indexOf(b)
    // );
    const indexA = negotiationStatusOrder.indexOf(a);
    const indexB = negotiationStatusOrder.indexOf(b);

    // If neither status is in the order array, maintain original order
    if (indexA === -1 && indexB === -1) return 0;
    // If only a is not in the order array, push it to the bottom
    if (indexA === -1) return 1;
    // If only b is not in the order array, push it to the bottom
    if (indexB === -1) return -1;

    // Both statuses are in the order array, sort by their position
    return indexA - indexB;
  });
};

export const orderNegotiationsByColumns = (
  negotiationsByColumn: Record<
    string,
    NegotiationDataType[] | Record<string, NegotiationDataType[]>
  >
) => {
  const sortedStatuses = sortStatuses(Object.keys(negotiationsByColumn));

  return sortedStatuses.map((status) => {
    return {
      stage: status,
      deals: negotiationsByColumn[status],
    };
  });
};

export const getActiveDealDocuments = async (dealQuery: {
  dealNegotiatorId?: string;
  filter?: {
    [key: string]: string | string[];
  };
  include?: {
    incomingBids?: boolean;
    activityLog?: boolean;
  };
}): Promise<NegotiationDataType[]> => {
  const negotiationsCollectionRef = collection(db, "delivrd_negotiations");
  const queryConditions: QueryConstraint[] = [
    // where("dealCoordinatorId", "!=", null),
  ];

  if (dealQuery?.dealNegotiatorId) {
    queryConditions.push(
      where("dealCoordinatorId", "==", dealQuery.dealNegotiatorId)
    );
  }

  console.log("dealQuery: ", dealQuery);

  if (dealQuery?.filter) {
    Object.keys(dealQuery.filter).forEach((key) => {
      if (dealQuery?.filter?.[key]) {
        if (Array.isArray(dealQuery.filter[key])) {
          queryConditions.push(where(key, "in", dealQuery.filter[key]));
        } else {
          queryConditions.push(where(key, "==", dealQuery.filter[key]));
        }
      }
    });
  }

  const negotiationsQuery = query(
    negotiationsCollectionRef,
    ...queryConditions
  );

  const negotiationsSnapshot = await getDocs(negotiationsQuery);

  const negotiations = negotiationsSnapshot.docs.map((doc) => {
    const data = doc.data();
    try {
      return NegotiationDataModel.parse(data);
    } catch (error) {
      console.error("Error parsing negotiation data:", data.id);
      console.error("Error:", error);
      return null;
    }
  });

  return negotiations.filter((negotiation: NegotiationDataType | null) => {
    if (!negotiation) return false;
    return negotiationStatusOrder.includes(negotiation.stage);
  }) as NegotiationDataType[];
};

export const mapNegotiationsToTeam = (
  negotiations: NegotiationDataType[],
  team: DealNegotiatorType[]
): {
  team: DealNegotiatorType[];
  dealsWithoutCoordinator: NegotiationDataType[];
} => {
  const dealsWithoutCoordinator: NegotiationDataType[] = [];
  const teamIdToObject: {
    [key: string]: NegotiationDataType[];
  } = {};

  negotiations.map((deal: NegotiationDataType) => {
    if (deal.dealCoordinatorId) {
      if (!teamIdToObject[deal.dealCoordinatorId]) {
        teamIdToObject[deal.dealCoordinatorId] = [];
      }

      teamIdToObject[deal.dealCoordinatorId].push(deal);
    } else if (
      ["Actively Negotiating", "Paid", "Deal Started"].includes(deal.stage)
    ) {
      dealsWithoutCoordinator.push(deal);
    }
  });

  for (const index in team) {
    const member = team[index];
    const teamMemberDeals = teamIdToObject[member.id] ?? [];
    team[index].negotiations = teamMemberDeals;
  }

  return {
    team,
    dealsWithoutCoordinator,
  };
};

export const mapNegotiationsByColumn = (
  negotiations: NegotiationDataType[],
  column: string,
  seachFn?: (deal: NegotiationDataType) => boolean
) => {
  const negotiationsByColumn = negotiations.reduce(
    (
      acc: { [key: string]: NegotiationDataType[] },
      deal: NegotiationDataType
    ) => {
      const columnValue = deal[column as keyof NegotiationDataType] as string;
      if (!acc[columnValue]) {
        acc[columnValue] = [];
      }

      if (seachFn) {
        if (seachFn(deal)) {
          acc[columnValue].push(deal);
        }
      } else {
        acc[columnValue].push(deal);
      }
      return acc;
    },
    {} as Record<string, NegotiationDataType[]>
  );
  return negotiationsByColumn;
};
