import { db } from "@/firebase/config";
import { getClients } from "@/lib/helpers/clients";
import { getDealerFromDb } from "@/lib/helpers/dealer";
import { getUserDataFromDb } from "@/lib/helpers/user";
import { NegotiationDataType } from "@/lib/models/team";
import { collection, getDocs } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

// const getNegotiations = async () => {
//   const negotiations = await getDocs(collection(db, "negotiations"));
//   return negotiations.docs.map((doc) => doc.data());
// };

export const GET = async (request: NextRequest) => {
  const headers = request.headers;
  const userData = await getUserDataFromDb(headers.get("auth") as string);
  const dealer = await getDealerFromDb(userData?.dealer_id?.[0]);
  const allowedBrands = dealer?.Brand || [];
  const clients = await getClients();
  const negotiationsById: Record<string, NegotiationDataType> = {};
  const negotiations = await getDocs(collection(db, "delivrd_negotiations"));
  negotiations.docs.map((doc) => {
    negotiationsById[doc.id] = doc.data() as NegotiationDataType;
  });

  const finalClients = clients.map((client) => {
    const negotiation = negotiationsById[client.negotiation_Id];
    console.log(
      "negotiation",
      client.createdAt,
      client.id,
      negotiation ? "found" : "not found"
    );

    return {
      ...client,
      trade: negotiation?.trade,
      bidNum: negotiation?.incomingBids?.length,
    };
  });

  return NextResponse.json({ clients: finalClients });
};
