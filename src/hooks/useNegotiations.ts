import { backendRequest } from "@/lib/request";
import { getUserData } from "@/lib/user";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export const useNegotiations = (config: { all?: boolean } = {}) => {
  const id = useMemo(() => {
    const incomingId = getUserData().deal_coordinator_id;

    if (!incomingId || typeof incomingId !== "string") {
      console.error("Invalid deal_coordinator_id:", incomingId);
      return;
    }

    return incomingId;
  }, []);

  const negotiationsQuery = useQuery({
    queryKey: ["negotiations"],
    queryFn: () =>
      backendRequest(config.all ? `negotiation` : `negotiation/${id}`),
  });

  return {
    negotiations: negotiationsQuery.data?.negotiations,
    team: negotiationsQuery.data?.team,
    isLoading: negotiationsQuery.isLoading,
  };
};
