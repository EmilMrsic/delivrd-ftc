import { getClients } from "@/lib/helpers/clients";
import { getDealerFromDb } from "@/lib/helpers/dealer";
import { getUserDataFromDb } from "@/lib/helpers/user";
import { NextRequest, NextResponse } from "next/server";

export const GET = async (request: NextRequest) => {
  const headers = request.headers;
  const userData = await getUserDataFromDb(headers.get("auth") as string);
  const dealer = await getDealerFromDb(userData?.dealer_id?.[0]);
  const allowedBrands = dealer?.Brand || [];
  const clients = await getClients();

  const finalClients = clients.filter((client: any) => {
    return allowedBrands.includes(client.Brand);
  });

  return NextResponse.json({ clients: finalClients });
};
