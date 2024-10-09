import { auth } from "@/firebase/config";
import { sendSignInLinkToEmail } from "firebase/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { to } = await req.json();
  // const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  const protocol = req.headers.get("x-forwarded-proto") || "http";
  const host = req.headers.get("host");
  const baseUrl = `${protocol}://${host}`;
  try {
    const actionCodeSettings = {
      url: `${baseUrl}/complete-signin`,
      handleCodeInApp: true, // Important for email link sign-in
    };

    console.log({ actionCodeSettings });
    await sendSignInLinkToEmail(auth, to, actionCodeSettings);

    return NextResponse.json({ message: "Email sent successfully!" });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({ message: "Error sending email", error });
  }
}
