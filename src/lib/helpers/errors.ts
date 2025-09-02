import { NextRequest, NextResponse } from "next/server";
import { MAILGUN_API_KEY, MAILGUN_DOMAIN_NAME } from "@/lib/constants/keys";
import axios from "axios";

export const withErrorLogging = (
  routeFn: (request: NextRequest) => Promise<NextResponse>
) => {
  return async (request: NextRequest) => {
    try {
      return await routeFn(request);
    } catch (error) {
      console.error("Error in API route:", error);
      await sendErrorEmail(request, error);
      return NextResponse.json(
        { error: "Internal Server Error" },
        { status: 500 }
      );
    }
  };
};

export const sendErrorEmail = async (request: NextRequest, error: Error) => {
  console.log("request:", request.url, request.method);
  const to = "dylaneholland@gmail.com";
  const receiverEmail = to;
  const subject = "Sign up for Delivrd";
  const html = `<!DOCTYPE html>
  <html>
  <body>
    Delivrd got an error at ${request.url} with method ${request.method}
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
  } catch (error) {
    console.error("Error sending email:", error);
  }
};
