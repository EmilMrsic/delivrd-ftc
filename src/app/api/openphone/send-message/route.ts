import axios from "axios";
import { NextRequest, NextResponse } from "next/server";

export const POST = async (request: NextRequest) => {
  const { message } = await request.json();
  console.log("message:", message);

  const response = await axios.post(
    "https://api.openphone.com/v1/messages",
    {
      content: message,
      phoneNumberId: process.env.OPENPHONE_PHONE_NUMBER_ID,
      from: process.env.OPENPHONE_PHONE_NUMBER,
      to: ["+16187516231"],
    },
    {
      headers: {
        Authorization: `${process.env.OPENPHONE_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  console.log("response:", response.data);

  return NextResponse.json({ message: "Message sent" });
};
