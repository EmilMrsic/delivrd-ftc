import { db } from "@/firebase/config";
import { collection, getDocs, query, where } from "firebase/firestore";
import { DealerDataType, DealerModel } from "../models/dealer";
import { fetchBulkQuery } from "./firebase";
import { IncomingBidType } from "../models/bids";

export const getDealerDocuments = async (
  dealerQuery: {
    withBids?: boolean;
    all?: boolean;
  } = {}
): Promise<any> => {
  console.log("got variable:", process.env.NEXT_PUBLIC_COMMENT_FUNC_URL);

  const dealerTable = collection(db, "delivrd_dealers");
  // const dealerSnapshot = await getDocs(dealerTable);
  const dealerQueryList: any = [];
  if (!dealerQuery.all) {
    dealerQueryList.push(where("updated", "==", true));
  }

  const dealerSnapshot = await getDocs(query(dealerTable, ...dealerQueryList));

  const dealerIds: string[] = [];

  const dealerRows = dealerSnapshot.docs
    .map((doc) => {
      const data = doc.data();
      if (!data?.id) {
        return null;
      }

      dealerIds.push(data.id);
      try {
        // if (data.Brand.length === 0) {
        //   return null;
        // }
        const parsed = DealerModel.parse(data);
        return parsed;
      } catch (e: any) {
        console.log("error:", e, "from:", data);
        return null;
      }
    })
    .filter((dealer) => dealer !== null);

  const dealerBidRows = await fetchBulkQuery(
    "Incoming Bids",
    "dealerId",
    dealerIds
  );

  const dealerBids: Record<string, IncomingBidType[]> = {};

  dealerBidRows.forEach((bid) => {
    if (!dealerBids[bid.dealerId]) {
      dealerBids[bid.dealerId] = [];
    }

    dealerBids[bid.dealerId].push({
      ...bid,
      intTimestamp: new Date(bid?.timestamp).getTime(),
    });
  });

  return dealerRows.map((dealer) => {
    const bids = dealerBids[dealer.id] || [];
    const orderedBids = bids.sort(
      (a, b) => (b.intTimestamp ?? 0) - (a.intTimestamp ?? 0)
    );

    return {
      ...dealer,
      lastBid: orderedBids[0]?.intTimestamp,
      bids: orderedBids,
    };
  });
};
