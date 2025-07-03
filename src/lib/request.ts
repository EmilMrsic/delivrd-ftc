import { getUserData } from "./user";

export const backendRequest = async <T = object>(
  path: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  postData?: T
) => {
  const headers: Record<string, string> = {};
  if (postData) {
    headers["Content-Type"] = "application/json";
  }

  headers["auth"] = getUserData().id;

  const response = await fetch(`/api/${path}`, {
    method: method,
    body: postData ? JSON.stringify(postData) : undefined,
    headers: headers,
  });
  const data = await response.json();
  return data;
};

export const callZapierWebhook = async (webhook: string, webhookData: any) => {
  const response = await fetch(`${webhook}`, {
    method: "POST",
    body: JSON.stringify(webhookData),
  });
  const data = await response.json();
  return data;
};
