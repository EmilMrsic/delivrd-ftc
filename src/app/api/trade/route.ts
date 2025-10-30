import { db } from "@/firebase/config";
import { fetchBulkQuery } from "@/lib/helpers/firebase";
import { getUserDataFromDb } from "@/lib/helpers/user";
import { ClientDataType } from "@/lib/models/client";
import { NegotiationDataType } from "@/lib/models/team";
import { collection, getDocs, query, where } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  const headers = req.headers;
  let userData;
  if (headers.get("auth")) {
    userData = await getUserDataFromDb(headers.get("auth") as string);
  }

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

  // console.log(tradeIns.filter((trade) => trade.id === "recH85js7w4MRVDru"));

  const promises: any[] = [
    fetchBulkQuery(
      "Clients",
      "negotiation_Id",
      tradeIns.map((trade) => trade.id)
    ),
  ];

  if (dealerId) {
    promises.push(getDocs(query(bidsTable, where("dealerId", "==", dealerId))));
  }

  const [clients, bidsSnapshot] = await Promise.all(promises);
  let submittedBidNegotiations = null;

  if (bidsSnapshot) {
    submittedBidNegotiations = new Set(
      bidsSnapshot.docs.map((doc: any) => doc.data().negotiationId)
    );
  }
  const clientById: Record<string, ClientDataType> = {};

  const clientToNegotiation: (NegotiationDataType & {
    client: ClientDataType;
  })[] = [];

  clients.forEach((client: ClientDataType) => {
    clientById[client.id] = client;
  });

  // @ts-ignore
  tradeIns.forEach((trade: NegotiationDataType) => {
    if (clientById[trade.id]) {
      if (
        process.env.IGNORE_SUBMITTED_BIDS ||
        !submittedBidNegotiations ||
        !submittedBidNegotiations.has(trade.id)
      ) {
        const outputRow = {
          ...trade,
          client: clientById[trade.id],
        };

        clientToNegotiation.push(outputRow);
      }
    }
  });

  return NextResponse.json({
    tradeIns: clientToNegotiation,
  });
};
