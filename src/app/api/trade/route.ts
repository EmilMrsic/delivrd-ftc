import { db } from "@/firebase/config";
import { fetchBulkQuery } from "@/lib/helpers/firebase";
import { getUserDataFromDb } from "@/lib/helpers/user";
import { ClientDataType } from "@/lib/models/client";
import { NegotiationDataType } from "@/lib/models/team";
import { collection, getDocs, query, where } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  const headers = req.headers;
  const userData = await getUserDataFromDb(headers.get("auth") as string);
  const dealerId = userData?.dealer_id?.[0] || userData?.dealer_id;

  const negotiationsTable = collection(db, "delivrd_negotiations");
  const bidsTable = collection(db, "Incoming Bids");
  const negotiationsSnapshot = await getDocs(negotiationsTable);
  const negotiations = negotiationsSnapshot.docs.map((doc) => doc.data());

  const tradeIns = negotiations.filter((negotiation) => {
    if (negotiation.tradeInInfo && negotiation.tradeDetails) {
      return negotiation as NegotiationDataType;
    }
  });

  const [clients, bidsSnapshot] = await Promise.all([
    fetchBulkQuery(
      "Clients",
      "negotiation_Id",
      tradeIns.map((trade) => trade.id)
    ),
    getDocs(query(bidsTable, where("dealerId", "==", dealerId))),
  ]);

  const submittedBidNegotiations = new Set(
    bidsSnapshot.docs.map((doc) => doc.data().negotiationId)
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
    if (clientById[trade.id] && !submittedBidNegotiations.has(trade.id)) {
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
