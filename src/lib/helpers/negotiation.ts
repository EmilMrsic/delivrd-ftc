import { NegotiationData } from "@/types";
import { negotiationStatusOrder } from "../constants/negotiations";
import { NegotationDataType } from "../models/team";

export const sortNegotiationsByStatus = (
  negotiations: NegotationDataType[],
  direction: "ascending" | "descending" = "ascending"
) => {
  return negotiations.sort((a, b) => {
    const statusA = a.negotiations_Status ?? "";
    const statusB = b.negotiations_Status ?? "";

    const indexA = negotiationStatusOrder.indexOf(statusA);
    const indexB = negotiationStatusOrder.indexOf(statusB);

    // If either status is not found in the order array, put them at the end
    if (indexA === -1 && indexB === -1) return 0;
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return direction === "ascending" ? indexA - indexB : indexB - indexA;
  });
};

export const pruneNegotiations = (negotiations: NegotationDataType[]) => {
  return negotiations.filter((negotiation) => {
    return (
      negotiation.negotiations_Status !== "Closed" &&
      negotiation.negotiations_Status !== "Paid Lost Contact" &&
      negotiation.negotiations_Status !== "Refunded" &&
      negotiation.negotiations_Status !== "Closed No Review"
    );
  });
};

export const sortDataHelper = (
  setCurrentDeals: (deals: NegotationDataType[]) => void,
  currentDeals: NegotationDataType[]
) => {
  return (key: string, direction: string) => {
    console.log("got here:", key, direction);
    if (key == "negotiations_Status") {
      console.log("sorting by status");
      const sortedDeals = sortNegotiationsByStatus(
        currentDeals as NegotationDataType[],
        direction === "ascending" ? "ascending" : "descending"
      );
      setCurrentDeals(sortedDeals as NegotiationData[]);
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
