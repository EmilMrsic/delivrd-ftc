import { NextRequest, NextResponse } from "next/server";
import { MAILGUN_API_KEY, MAILGUN_DOMAIN_NAME } from "@/lib/constants/keys";
import axios from "axios";
import { getUserDataFromDb } from "./user";

export const withErrorLogging = (
  routeFn: (request: NextRequest) => Promise<NextResponse>
) => {
  return async (request: NextRequest) => {
    try {
      return await routeFn(request);
    } catch (error) {
      console.error("Error in API route:", error);
      let user = null;
      try {
        const headers = request.headers;
        user = await getUserDataFromDb(headers.get("auth") as string);
      } catch (e) {
        console.error("Error fetching user data:", e);
      }

      if (!process.env.NO_ERROR_EMAILS) {
        await sendErrorEmail(request, error as Error, user);
      }
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  };
};

export const sendErrorEmail = async (
  request: NextRequest,
  error: Error,
  user: null | any
) => {
  console.log("request:", user);
  const userString = user
    ? `Name: ${user.name}, Email: ${user.email}, Privilege: ${user.privilege}`
    : "No user recognized";

  const to = ["dylaneholland@gmail.com", "salinson1138@gmail.com"];
  const receiverEmail = to;
  const subject = "Sign up for Delivrd";
  const html = `<!DOCTYPE html>
  <html>
  <body>
    Delivrd got an error at ${request.url} with method ${request.method}
    <br />
    User info: ${userString}
    <br />

    Got error message: <b>${error.message}</b>
    Trace:
    <pre>
        ${error.stack}
    </pre>
  </body>
  </html>`;
  try {
    const emailData = new URLSearchParams();
    emailData.append("from", `Delivrd <postmaster@${MAILGUN_DOMAIN_NAME}>`);

    emailData.append("to", to.join(", "));
    emailData.append("subject", subject);
    emailData.append("html", html);

    // console.log("Would send email:", html);

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
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
