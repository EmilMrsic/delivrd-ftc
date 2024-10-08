import { auth } from "@/firebase/config";
import { sendSignInLinkToEmail } from "firebase/auth";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { to } = await req.json();
  try {
    const actionCodeSettings = {
      url: `http:localhost:3000/complete-signin`,
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
