import { db } from "@/firebase/config";
import { getActiveDealObjects } from "@/lib/helpers/negotiation";
import { DealNegotiatorType, NegotationDataType } from "@/lib/models/team";
import { collection, getDocs } from "firebase/firestore";
import { NextResponse } from "next/server";

export const GET = async (_request: Request) => {
  const teamQuery = collection(db, "team delivrd");
  const teamSnapshot = await getDocs(teamQuery);
  const teamData: DealNegotiatorType[] = [];
  const allActiveDeals: string[] = [];
  teamSnapshot.docs.map((doc) => {
    const document = doc.data();
    allActiveDeals.push(
      ...document.active_deals.filter((deal: string) => deal !== null)
    );
    teamData.push(document as DealNegotiatorType);
  });

  const output: {
    negotiations: NegotationDataType[];
    team: DealNegotiatorType[];
  } = {
    negotiations: [],
    team: teamData,
  };

  if (allActiveDeals.length > 0) {
    output.negotiations = await getActiveDealObjects(allActiveDeals);
  }

  return NextResponse.json(output);
};
