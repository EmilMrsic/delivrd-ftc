import { db } from "@/firebase/config";
import { fetchBulkQuery } from "@/lib/helpers/firebase";
import { getUserDataFromDb } from "@/lib/helpers/user";
import { ClientDataType } from "@/lib/models/client";
import { NegotiationDataType } from "@/lib/models/team";
import { collection, getDocs } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  const headers = req.headers;
  const userData = await getUserDataFromDb(headers.get("auth") as string);

  const negotiationsTable = collection(db, "delivrd_negotiations");
  const negotiationsSnapshot = await getDocs(negotiationsTable);
  const negotiations = negotiationsSnapshot.docs.map((doc) => doc.data());

  const tradeIns = negotiations.filter((negotiation) => {
    if (negotiation.tradeInInfo && negotiation.tradeDetails) {
      return negotiation as NegotiationDataType;
    }
  });

  const clients = await fetchBulkQuery(
    "Clients",
    "negotiation_Id",
    tradeIns.map((trade) => trade.id)
  );

  const clientById: Record<string, ClientDataType> = {};

  const clientToNegotiation: (NegotiationDataType & {
    client: ClientDataType;
  })[] = [];

  clients.forEach((client) => {
    clientById[client.id] = client;
  });

  // @ts-ignore
  tradeIns.forEach((trade: NegotiationDataType) => {
    console.log("got trade:", trade.id, clientById[trade.id]?.id);
    if (clientById[trade.id]) {
      clientToNegotiation.push({
        ...trade,
        client: clientById[trade.id],
      });
    }
  });

  return NextResponse.json({
    tradeIns: clientToNegotiation,
  });
};
