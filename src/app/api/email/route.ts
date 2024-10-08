import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { to } = await req.json();
  const subject = "Magic Link";
  const text =
    "It looks like you’re not on our First To Call List. Please follow this link (https://formless.ai/c/HdovmWUnYjN7) to register to have 24-hour access to see all the deals we have live + submit your bids. Thank you, The Delivered Team.";
  const html = "";
  try {
    const emailData = new URLSearchParams();
    emailData.append(
      "from",
      `Delivrd <postmaster@${process.env.NEXT_PUBLIC_MAILGUN_DOMAIN_NAME}>`,
    );
    emailData.append("to", to);
    emailData.append("subject", subject);
    emailData.append("text", text);
    emailData.append("html", html);

    const response = await axios.post(
      `https://api.mailgun.net/v3/${process.env.NEXT_PUBLIC_MAILGUN_DOMAIN_NAME}/messages`,
      emailData,
      {
        auth: {
          username: "api",
          password: process.env.NEXT_PUBLIC_MAILGUN_API_KEY || "",
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    console.log(response.data);
    return NextResponse.json({ message: "Email sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({ message: "Error sending email" });
  }
}
