import { getActiveDealDocuments } from "@/lib/helpers/negotiation";
import { NegotiationDataType } from "@/lib/models/team";
import { NextResponse } from "next/server";

export const POST = async (
  request: Request,
  { params }: { params: { nid: string } }
) => {
  const postData = await request.json();
  const { filter, archive } = postData;
  const output: {
    negotiations: NegotiationDataType[];
  } = {
    negotiations: [],
  };
  const { nid } = params;

  const deals = await getActiveDealDocuments({
    dealNegotiatorId: nid,
    filter: filter,
    archive: archive,
  });

  if (deals.length > 0) {
    output.negotiations = deals;
  }

  return NextResponse.json(output);
};
