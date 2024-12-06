import { initAdmin } from "@/firebaseAdmin";
import axios from "axios";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { to } = await req.json();
  // const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const protocol = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("host");
  const baseUrl = `${protocol}://${host}`;

  try {
    const actionCodeSettings = {
      url: `${baseUrl}/complete-signin?email=${to}`,
      handleCodeInApp: true, // Important for email link sign-in
    };

    const admin = await initAdmin();
    const auth = admin.auth();
    const link = await auth.generateSignInWithEmailLink(to, actionCodeSettings);

    const subject = "Delivrd Login Link";
    const html = `<!DOCTYPE html>
  <html>
  <body>
  <p>Hey 👋,</p>
  <p>
    Use <a href="${link}">this</a> link to Log in.
  </p>
  <p>Do not reply to this email, it is an automated system that does not receive emails.</p>
  </body>
  </html>`;

    const emailData = new URLSearchParams();
    emailData.append(
      "from",
      `Delivrd <postmaster@${process.env.NEXT_PUBLIC_MAILGUN_DOMAIN_NAME}>`
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
      }
    );
    console.log(response.data);
    return NextResponse.json({ message: "Email sent successfully!" });
  } catch (error: any) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { message: "Error sending email", error },
      { status: error?.status || 500 }
    );
  }
}
