import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { path, postData } = await req.json();
  if (!path || !postData) {
    return NextResponse.json(
      { success: false, error: "Missing path or postData" },
      { status: 400 }
    );
  }

  const url = `https://hooks.zapier.com/hooks/catch/${path}`;
  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(postData),
    headers: {
      "Content-Type": "application/json",
    },
  });
  console.log("got path:", response);
  return NextResponse.json({ success: true });
}
