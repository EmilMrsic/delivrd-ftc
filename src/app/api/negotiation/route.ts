import { db } from "@/firebase/config";
import { getActiveDealDocuments } from "@/lib/helpers/negotiation";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";
import { collection, getDocs } from "firebase/firestore";
import { existsSync, readFileSync, writeFileSync } from "fs";
import { NextResponse } from "next/server";
import * as crypto from "crypto";
import { ostring } from "zod";
import { tmpdir } from "os";

export const POST = async (request: Request) => {
  const teamQuery = collection(db, "team delivrd");
  const teamSnapshot = await getDocs(teamQuery);
  const teamData: DealNegotiatorType[] = [];
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

  const { filter, archive, mode, profile } = await request.json();
  const ts1 = Date.now();
  let deals: NegotiationDataType[] = [];
  if (
    process.env.DEV_MODE_CACHE === "true" &&
    existsSync(
      `${tmpdir()}/${getNodeSHA256Hash(
        JSON.stringify({ filter, archive, mode, profile })
      )}.json`
    )
  ) {
    deals = JSON.parse(
      readFileSync(
        `${tmpdir()}/${getNodeSHA256Hash(
          JSON.stringify({ filter, archive, mode, profile })
        )}.json`
      ).toString()
    );
  } else {
    deals = await getActiveDealDocuments({
      filter,
      archive,
      mode,
      profile,
    });

    if (process.env.DEV_MODE_CACHE === "true") {
      writeFileSync(
        `${tmpdir()}/${getNodeSHA256Hash(
          JSON.stringify({ filter, archive, mode, profile })
        )}.json`,
        JSON.stringify(deals, null, 2)
      );
    }
  }

  if (deals) {
    output.negotiations = deals;
  }

  return NextResponse.json(output);
};

function getNodeSHA256Hash(str: string): string {
  const hash = crypto.createHash("sha256");
  hash.update(str);
  return hash.digest("hex");
}
