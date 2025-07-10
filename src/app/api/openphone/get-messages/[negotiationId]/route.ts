import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (
  request: NextRequest,
  { params }: { params: { negotiationId: string } }
) => {
  const { negotiationId } = params;
  console.log("negotiationId:", negotiationId);

  //   ?maxResults=10&phoneNumberId=PNAKWj49U6&participants=%2B16187516231

  const response = await axios.get(
    "https://api.openphone.com/v1/messages?maxResults=100&phoneNumberId=PNAKWj49U6&participants=%2B16187516231",

    {
      headers: {
        Authorization: `${process.env.OPENPHONE_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  return NextResponse.json({
    messages: response.data.data.reverse(),
  });
};
