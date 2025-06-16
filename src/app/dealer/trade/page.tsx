"use client";
import { Loader } from "@/components/base/loader";
import { TradeInTable } from "@/components/Dealer/trade-in-table";
import { useNegotiations } from "@/hooks/useNegotiations";
import { backendRequest } from "@/lib/request";
import { useQuery } from "@tanstack/react-query";

export default function TradePage() {
  const { data: tradeIns, isLoading } = useQuery({
    queryKey: ["tradeIns"],
    queryFn: () => {
      const request = backendRequest("trade");
      return request;
    },
  });

  if (isLoading) return <Loader />;

  console.log("tradeIns: ", tradeIns);

  return <TradeInTable negotiations={tradeIns.tradeIns} />;
}
