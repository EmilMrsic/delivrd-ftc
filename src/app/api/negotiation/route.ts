import { db } from "@/firebase/config";
import { getActiveDealDocuments } from "@/lib/helpers/negotiation";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";
import { collection, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";

export const POST = async (request: Request) => {
  const teamQuery = collection(db, "team delivrd");
  const teamSnapshot = await getDocs(teamQuery);
  const teamData: DealNegotiatorType[] = [];
  const allActiveDeals: string[] = [];
  teamSnapshot.docs.map((doc) => {
    const document = doc.data();
    teamData.push(document as DealNegotiatorType);
  });

  const output: {
    negotiations: NegotiationDataType[];
    team: DealNegotiatorType[];
  } = {
    negotiations: [],
    team: teamData,
  };

  const { filter } = await request.json();

  const deals = await getActiveDealDocuments({
    filter,
  });

  if (deals) {
    output.negotiations = deals;
  }

  return NextResponse.json(output);
};
