import { getDealerBids } from "@/lib/helpers/bids";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  request: NextRequest,
  { params }: { params: { did: string } }
) => {
  const { did } = params;
  const bids = await getDealerBids(did);

  return NextResponse.json({ bids });
};
