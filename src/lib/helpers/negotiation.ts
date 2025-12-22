import { NegotiationData } from "@/types";
import {
  consultModeStatusOrder,
  negotiationStatusOrder,
} from "../constants/negotiations";
import {
  DealNegotiatorType,
  NegotiationDataModel,
  NegotiationDataType,
} from "../models/team";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  QueryConstraint,
  where,
  doc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { chunk } from "lodash";
import { Dispatch, SetStateAction } from "react";
import { useNegotiationStore } from "../state/negotiation";

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
  const orderList = [...negotiationStatusOrder, ...consultModeStatusOrder];
  return statuses.sort((a, b) => {
    // return (
    //   negotiationStatusOrder.indexOf(a) - negotiationStatusOrder.indexOf(b)
    // );
    const indexA = orderList.indexOf(a);
    const indexB = orderList.indexOf(b);

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
  archive?: boolean;
  mode?: "consult" | "standard";
  profile?: boolean;
  filter?: {
    [key: string]: string | string[];
  };
  include?: {
    incomingBids?: boolean;
    activityLog?: boolean;
  };
}): Promise<NegotiationDataType[]> => {
  const negotiationsCollectionRef = collection(
    db,
    dealQuery.archive ? "delivrd_archive" : "delivrd_negotiations"
  );
  const queryConditions: QueryConstraint[] = [
    // where("dealCoordinatorId", "!=", null),
  ];

  if (dealQuery?.dealNegotiatorId) {
    queryConditions.push(
      where("dealCoordinatorId", "==", dealQuery.dealNegotiatorId)
    );
  }

  if (dealQuery?.filter) {
    Object.keys(dealQuery.filter).forEach((key) => {
      if (key === "createdAt" || key === "consultDate") {
        if (dealQuery?.filter?.[key]) {
          const day = dealQuery.filter[key];
          const start = `${day}T00:00:00.000Z`;
          const end = `${day}T23:59:59.999Z`;
          queryConditions.push(where(key, ">=", start));
          queryConditions.push(where(key, "<=", end));
        }
      } else {
        if (dealQuery?.filter?.[key]) {
          if (Array.isArray(dealQuery.filter[key])) {
            queryConditions.push(where(key, "in", dealQuery.filter[key]));
          } else {
            queryConditions.push(where(key, "==", dealQuery.filter[key]));
          }
        }
      }
    });
  }

  const negotiationsQuery = query(
    negotiationsCollectionRef,
    ...queryConditions
  );

  let negotiationsSnapshot = await getDocs(negotiationsQuery);
  if (dealQuery.profile && !negotiationsSnapshot.docs.length) {
    negotiationsSnapshot = await getDocs(
      query(collection(db, "delivrd_archive"), ...queryConditions)
    );
  }

  const negotiations = negotiationsSnapshot.docs.map((doc) => {
    const data = doc.data();
    const negotiation = data as NegotiationDataType;
    if (dealQuery.archive) {
      negotiation.fromArchive = true;
    }
    return negotiation;
    // try {
    //   const parsed = NegotiationDataModel.parse(data);
    //   return parsed;
    // } catch (error) {
    //   console.error("Error parsing negotiation data:", data.id);
    //   console.error(error);
    //   return null;
    // }
  });

  const filteredNegotiations = negotiations.filter(
    (negotiation: NegotiationDataType | null) => {
      if (!negotiation) return false;
      if (dealQuery.profile) return true;
      if (dealQuery.archive) {
        return ["Closed", "Closed No Review"].includes(
          negotiation.stage as string
        );
      } else if (dealQuery.mode === "consult") {
        return consultModeStatusOrder.includes(negotiation.stage as string);
      } else {
        return negotiationStatusOrder.includes(negotiation.stage as string);
      }
    }
  ) as NegotiationDataType[];

  return filteredNegotiations;
};

export const getNegotiationsByClientId = async (clientId: string) => {
  const negotiationsCollectionRef = collection(db, "delivrd_negotiations");
  const queryConditions: QueryConstraint[] = [
    where("userId", "==", clientId.trim()),
  ];
  queryConditions.push(orderBy("createdAt", "desc"));
  // queryConditions.push(limit(1));

  const negotiationsQuery = query(
    negotiationsCollectionRef,
    // where("userId", "==", "3fz6TO4HGd48fEdXqaXJ")
    ...queryConditions
  );

  const negotiationsSnapshot = await getDocs(negotiationsQuery);

  return negotiationsSnapshot.docs.map((doc) => {
    const data = doc.data() as NegotiationDataType;
    return data;
  });
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
      ["Actively Negotiating", "Paid", "Deal Started"].includes(
        deal.stage as string
      )
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

export const removeNegotiatorFromNegotiations = async (
  negotiationId: string,
  refetch?: () => void
) => {
  try {
    const negotiationRef = doc(db, "delivrd_negotiations", negotiationId);
    await updateDoc(negotiationRef, {
      dealCoordinatorId: "",
    });

    if (refetch) {
      refetch();
    }

    return true;
  } catch (error) {
    console.error("Error removing negotiator:", error);
    return false;
  }
};

export const removeDealSupportAgentFromNegotiation = async (
  negotiationId: string,
  refetch?: () => void
) => {
  try {
    const negotiationRef = doc(db, "delivrd_negotiations", negotiationId);
    await updateDoc(negotiationRef, {
      supportAgentId: "",
    });

    updateNegotiationInStore(negotiationId, { supportAgentId: "" });

    if (refetch) {
      refetch();
    }

    return true;
  } catch (error) {
    console.error("Error removing negotiator:", error);
    return false;
  }
};

export const updateNegotiationInFirebase = async (
  negotiationId: string,
  negotiation: Partial<NegotiationDataType>
) => {
  try {
    const negotiationRef = doc(db, "delivrd_negotiations", negotiationId);
    const snap = await getDoc(negotiationRef);
    await updateDoc(negotiationRef, {
      ...snap.data(),
      ...negotiation,
    });

    return true;
  } catch (error) {
    console.error("Error updating negotiation:", error);
    return false;
  }
};

export const updateNegotiationInStore = (
  negotiationId: string,
  negotiation: Partial<NegotiationDataType>
) => {
  // console.log("updating negotiation in store:", negotiationId, negotiation);
  const existingNegotiation =
    useNegotiationStore.getState().negotiations[negotiationId];
  useNegotiationStore.getState().setNegotiation(negotiationId, {
    ...existingNegotiation,
    ...negotiation,
  });
};
