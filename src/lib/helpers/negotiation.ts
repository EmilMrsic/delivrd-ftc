import { NegotiationData } from "@/types";
import { negotiationStatusOrder } from "../constants/negotiations";
import { NegotiationDataModel, NegotiationDataType } from "../models/team";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase/config";
import { chunk } from "lodash";

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
  setCurrentDeals: (deals: NegotiationDataType[]) => void,
  currentDeals: NegotiationDataType[]
) => {
  return (key: string, direction: string) => {
    if (key == "negotiations_Status") {
      console.log("sorting by status");
      const sortedDeals = sortNegotiationsByStatus(
        currentDeals as NegotiationDataType[],
        direction === "ascending" ? "ascending" : "descending"
      );
      setCurrentDeals(sortedDeals as NegotiationDataType[]);
    } else {
      const sortedDeals = [...currentDeals].sort((a: any, b: any) => {
        let aValue = a[key];
        let bValue = b[key];

        if (typeof aValue === "string") aValue = aValue.toLowerCase();
        if (typeof bValue === "string") bValue = bValue.toLowerCase();

        if (aValue < bValue) return direction === "ascending" ? -1 : 1;
        if (aValue > bValue) return direction === "ascending" ? 1 : -1;
        return 0;
      });

      setCurrentDeals(sortedDeals);
    }
  };
};

export const getActiveDealDocuments = async (dealQuery: {
  dealNegotiatorId?: string;
}) => {
  const negotiationsCollectionRef = collection(db, "delivrd_negotiations");
  const negotiationsQuery = query(
    negotiationsCollectionRef,
    where("dealCoordinatorId", "==", dealQuery.dealNegotiatorId)
  );
  const negotiationsSnapshot = await getDocs(negotiationsQuery);
  return negotiationsSnapshot.docs.map((doc) => {
    const data = doc.data();
    return NegotiationDataModel.parse(data);
  });
};

export const getActiveDealObjects = async (activeDeals: string[]) => {
  const negotiationsCollectionRef = collection(db, "negotiations");
  const chunkedIds = chunk(activeDeals, 30);
  const negotiationData = await Promise.all(
    chunkedIds.map(async (idChunk) => {
      const negotiationsQuery = query(
        negotiationsCollectionRef,
        where("__name__", "in", idChunk)
      );
      const negotiationsSnapshot = await getDocs(negotiationsQuery);
      return negotiationsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return NegotiationDataModel.parse(data);
      });
    })
  );

  return negotiationData.flat();
};
