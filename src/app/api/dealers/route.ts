import { getDealerDocuments } from "@/lib/helpers/dealer";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  const { all } = await req.json();
  const dealers = await getDealerDocuments({ all: all });
  // const orderedDealers = dealers.sort((a: any, b: any) => {
  //   const aTime = a.lastBid ?? 0;
  //   const bTime = b.lastBid ?? 0;

  //   // If both are 0, maintain their relative order
  //   if (aTime === 0 && bTime === 0) return 0;
  //   // If only a is 0, move it to the bottom
  //   if (aTime === 0) return 1;
  //   // If only b is 0, move it to the bottom
  //   if (bTime === 0) return -1;
  //   // Normal comparison for non-zero values
  //   return bTime - aTime;
  // });

  return NextResponse.json({
    dealers: dealers, //orderedDealers,
  });
};
