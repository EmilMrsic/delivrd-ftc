import { db } from "@/firebase/config";
import { getUserDataFromDb } from "@/lib/helpers/user";
import { collection, getDocs } from "firebase/firestore";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (req: NextRequest) => {
  const headers = req.headers;
  const userData = await getUserDataFromDb(headers.get("auth") as string);

  const negotiationsTable = collection(db, "delivrd_negotiations");
  const negotiationsSnapshot = await getDocs(negotiationsTable);
  const negotiations = negotiationsSnapshot.docs.map((doc) => doc.data());

  const tradeIns = negotiations.filter((negotiation) => {
    if (negotiation.tradeInInfo && negotiation.tradeDetails) {
      return negotiation;
    }
  });

  console.log("tradeIns: ", tradeIns);

  return NextResponse.json({
    tradeIns,
  });
};
