import { db } from "@/firebase/config";
import { getBidsByNegotiationId } from "@/lib/helpers/bids";
import { IncomingBidType } from "@/lib/models/bids";
import { collection, getDocs, query, where } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  req: NextRequest,
  { params }: { params: { nid: string } }
) => {
  const { nid } = params;
  console.log("nid:", nid);
  if (!nid) {
    return NextResponse.json(
      { error: "No negotiation ID provided" },
      { status: 400 }
    );
  }
  const bids = await getBidsByNegotiationId(nid);

  return NextResponse.json({ bids });
};
