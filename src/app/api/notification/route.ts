import { initAdmin } from "@/firebaseAdmin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { deviceToken, notification, data } = body;

    if (!deviceToken || !notification) {
      return NextResponse.json(
        { error: "Missing deviceToken or notification payload" },
        { status: 400 }
      );
    }
    const message = {
      token: deviceToken,
      notification: {
        title: notification.title,
        body: notification.body,
      },
      data: {
        link: data.link,
      },
    };

    const admin = await initAdmin();

    // Send the notification
    const response = await admin.messaging().send(message);

    console.log("Successfully sent message:", response);
    return NextResponse.json({ success: true, response }, { status: 200 });
  } catch (error) {
    console.error("Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send notification", details: error },
      { status: 500 }
    );
  }
}
