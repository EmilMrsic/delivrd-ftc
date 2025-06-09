import { db } from "@/firebase/config";
import { getClients } from "@/lib/helpers/clients";
import { getDealerFromDb } from "@/lib/helpers/dealer";
import { getUserDataFromDb } from "@/lib/helpers/user";
import { NegotiationDataType } from "@/lib/models/team";
import { collection, getDocs, query, where } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

// const getNegotiations = async () => {
//   const negotiations = await getDocs(collection(db, "negotiations"));
//   return negotiations.docs.map((doc) => doc.data());
// };

export const GET = async (request: NextRequest) => {
  const headers = request.headers;
  const userData = await getUserDataFromDb(headers.get("auth") as string);
  const dealer = await getDealerFromDb(userData?.dealer_id?.[0]);
  const negotiationsById: Record<string, NegotiationDataType> = {};
  const requests = Promise.all([
    getDocs(collection(db, "delivrd_negotiations")),
    getDocs(
      query(collection(db, "Incoming Bids"), where("dealerId", "==", dealer.id))
    ),
    getDocs(collection(db, "Clients")),
  ]);

  const [negotiations, incomingBids, clients] = await requests;

  negotiations.docs.map((doc) => {
    negotiationsById[doc.id] = doc.data() as NegotiationDataType;
  });

  const dealerBidIdList: string[] = [];

  incomingBids.docs.map((doc) => {
    const data = doc.data();
    dealerBidIdList.push(data.bid_id);
  });

  const dealerBidIds = new Set(dealerBidIdList);

  const finalClients: any[] = [];
  for (const doc of clients.docs) {
    const client = doc.data();
    const negotiation = negotiationsById[client.negotiation_Id];
    for (const bid of negotiation?.incomingBids || []) {
      if (dealerBidIds.has(bid)) {
        continue;
      }
    }

    finalClients.push({
      ...client,
      trade: negotiation?.trade,
      bidNum: negotiation?.incomingBids?.length,
    });
  }

  return NextResponse.json({ clients: finalClients });
};
