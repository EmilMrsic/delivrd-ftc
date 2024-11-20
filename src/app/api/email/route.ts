import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { to } = await req.json();
  const subject = "Sign up for Delivrd";
  const html =
    `<!DOCTYPE html>
  <html>
  <body>
  <p>Hey 👋,</p>
  <p>Your email (<strong>${to}</strong>) is not in our system. Don't worry, here's how to sign up:</p>
  <p>
    Dealers doing the first to call list click <a href="https://formless.ai/c/HdovmWUnYjN7">here</a>
  </p>
  <p>
    Looking to retain our service for your next car? Hire us or book a consultation session first  <a href="https://www.delivrdto.me/schedule">here</a>
  </p>
  <p>Do not reply to this email, it is an automated system that does not receive emails.</p>
  </body>
  </html>`;
  try {
    const emailData = new URLSearchParams();
    emailData.append(
      "from",
      `Delivrd <postmaster@${process.env.NEXT_PUBLIC_MAILGUN_DOMAIN_NAME}>`,
    );
    emailData.append("to", to);
    emailData.append("subject", subject);
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
