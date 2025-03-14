import { getActiveDealDocuments } from "@/lib/helpers/negotiation";
import { NegotiationDataType } from "@/lib/models/team";
import { NextResponse } from "next/server";

export const GET = async (
  _request: Request,
  { params }: { params: { nid: string } }
) => {
  const output: {
    negotiations: NegotiationDataType[];
  } = {
    negotiations: [],
  };
  const { nid } = params;

  const deals = await getActiveDealDocuments({
    dealNegotiatorId: nid,
  });
  if (deals.length > 0) {
    output.negotiations = deals;
  }

  return NextResponse.json(output);
};
