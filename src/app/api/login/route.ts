import { db } from "@/firebase/config";
import { initAdmin } from "@/firebaseAdmin";
import { MAILGUN_API_KEY, MAILGUN_DOMAIN_NAME } from "@/lib/constants/keys";
import axios from "axios";
import { doc, serverTimestamp, updateDoc } from "firebase/firestore";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { to, loginRowId } = await req.json();
  const loginInitiationRef = doc(db, "delivrd_user_logins", loginRowId);
  const receiverEmail = process.env.TESTING_EMAIL || to;
  // const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const protocol = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("host");
  const baseUrl = `${protocol}://${host}`;

  try {
    const actionCodeSettings = {
      url: `${baseUrl}/complete-signin?email=${to}&id=${loginRowId}`,
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
    Use <a href="${link}">this</a> link to log in.
  </p>
  <p>
    This link is **one-time use only**. If you've already used it and need to log in again, please go back to <a href="https://delivrdfor.me">Delivrd</a> and request a new link.
  </p>
  <p>Do not reply to this email; it is an automated system that does not receive emails.</p>
  </body>
  </html>`;

    const emailData = new URLSearchParams();
    emailData.append("from", `Delivrd <postmaster@${MAILGUN_DOMAIN_NAME}>`);
    emailData.append("to", receiverEmail);
    emailData.append("subject", subject);
    emailData.append("html", html);

    const response = await axios.post(
      `https://api.mailgun.net/v3/${MAILGUN_DOMAIN_NAME}/messages`,
      emailData,
      {
        auth: {
          username: "api",
          password: MAILGUN_API_KEY,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );
    await updateDoc(loginInitiationRef, {
      emailSent: true,
      emailSentTimestamp: serverTimestamp(),
    });
    return NextResponse.json({ message: "Email sent successfully!" });
  } catch (error: any) {
    console.error("Error sending email:", error);
    await updateDoc(loginInitiationRef, {
      emailSent: false,
      emailSentTimestamp: serverTimestamp(),
      emailSentError: error?.message,
    });
    return NextResponse.json(
      { message: "Error sending email", error },
      { status: error?.status || 500 }
    );
  }
}
