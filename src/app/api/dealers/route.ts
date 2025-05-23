import { getDealerDocuments } from "@/lib/helpers/dealer";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (req: NextRequest) => {
  const dealers = await getDealerDocuments();
  return NextResponse.json({});
};
