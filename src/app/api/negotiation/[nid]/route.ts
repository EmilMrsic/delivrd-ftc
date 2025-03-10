import { db } from "@/firebase/config";
import {
  DealNegotiatorModel,
  DealNegotiatorType,
  NegotationDataModel,
  NegotationDataType,
} from "@/lib/models/team";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { chunk } from "lodash";
import { NextResponse } from "next/server";

export const GET = async (
  _request: Request,
  { params }: { params: { nid: string } }
) => {
  const output: {
    negotiations: NegotationDataType[];
  } = {
    negotiations: [],
  };
  const { nid } = params;
  const teamDocRef = doc(db, "team delivrd", nid);
  const teamSnapshot = await getDoc(teamDocRef);

  if (!teamSnapshot.exists()) {
    console.log("Team document not found");
    return;
  }

  const teamData = DealNegotiatorModel.parse(teamSnapshot.data());
  const activeDeals = teamData.active_deals;

  if (!Array.isArray(activeDeals) || activeDeals.length === 0) {
    console.log("No active deals found");
  } else {
    const negotiationsCollectionRef = collection(db, "negotiations");
    const chunkedIds = chunk(activeDeals, 30);
    const negotiationData = await Promise.all(
      chunkedIds.map(async (idChunk) => {
        const negotiationsQuery = query(
          negotiationsCollectionRef,
          where("__name__", "in", idChunk)
        );
        const negotiationsSnapshot = await getDocs(negotiationsQuery);
        return negotiationsSnapshot.docs.map((doc) => {
          const data = doc.data();
          return NegotationDataModel.parse(data);
        });
      })
    );

    output.negotiations = negotiationData.flat();
  }

  return NextResponse.json(output);
};
