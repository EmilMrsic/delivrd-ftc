"use client";
import { Loader } from "@/components/base/loader";
import { TradeInTable } from "@/components/Dealer/trade-in-table";
import { useNegotiations } from "@/hooks/useNegotiations";
import { backendRequest } from "@/lib/request";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export default function TradePage() {
  const [selectedTradeIn, setSelectedTradeIn] = useState<string | null>(null);

  const {
    data: tradeIns,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["tradeIns"],
    queryFn: async () => {
      const request = await backendRequest("trade");
      return request;
    },
  });

  useEffect(() => {
    if (!isLoading && window.location.hash) {
      setSelectedTradeIn(window.location.hash);
      const el = document.querySelector(window.location.hash);
      if (el) el.scrollIntoView({ behavior: "smooth" });
      console.log(el);
    }
  }, [tradeIns, isLoading]);

  if (isLoading) return <Loader />;

  return (
    <TradeInTable
      negotiations={tradeIns.tradeIns}
      refetch={refetch}
      selectedTradeIn={selectedTradeIn}
    />
  );
}
