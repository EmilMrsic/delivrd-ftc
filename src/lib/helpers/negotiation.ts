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
