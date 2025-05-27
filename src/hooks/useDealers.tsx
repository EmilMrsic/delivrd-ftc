import { DealerDataType } from "@/lib/models/dealer";
import { backendRequest } from "@/lib/request";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";

export const useDealers = ({ all }: { all: boolean } = { all: false }) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dealers"],
    queryFn: () => {
      const request = backendRequest("dealers", "POST", {
        all: false, //all,
      });
      return request;
    },
    refetchOnMount: true,
  });

  return {
    dealers: data?.dealers,
    isLoading,
    error,
  };
};
