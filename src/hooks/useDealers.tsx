import { DealerDataType } from "@/lib/models/dealer";
import { backendRequest } from "@/lib/request";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export const useDealers = ({ all }: { all: boolean } = { all: false }) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dealers"],
    queryFn: async () => {
      const request = await backendRequest("dealers", "POST", {
        all: false, //all,
      });
      return request;
    },
    refetchOnMount: true,
    staleTime: 0,
    notifyOnChangeProps: ["data"],
  });

  return {
    dealers: data?.dealers,
    isLoading,
    error,
    refresh: refetch,
  };
};
