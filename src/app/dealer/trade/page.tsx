"use client";
import { useNegotiations } from "@/hooks/useNegotiations";
import { backendRequest } from "@/lib/request";
import { useQuery } from "@tanstack/react-query";

export default function TradePage() {
  const { data: tradeIns } = useQuery({
    queryKey: ["tradeIns"],
    queryFn: () => {
      const request = backendRequest("trade");
      return request;
    },
  });

  console.log("tradeIns: ", tradeIns);

  return <></>;
}
