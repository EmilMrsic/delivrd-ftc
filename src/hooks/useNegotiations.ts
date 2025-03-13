import { backendRequest } from "@/lib/request";
import { getUserData } from "@/lib/user";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

export const useNegotiations = (config: { all?: boolean } = {}) => {
  const [id, setId] = useState<string>(getUserData().deal_coordinator_id);

  const negotiationsQuery = useQuery({
    queryKey: ["negotiations"],
    queryFn: async () => {
      const request = await backendRequest(
        config.all ? `negotiation` : `negotiation/${id}`
      );

      return request;
    },
  });

  const handleIdChange = (newId: string) => {
    setId(newId);
  };

  useEffect(() => {
    negotiationsQuery.refetch();
  }, [id]);

  return {
    negotiations: negotiationsQuery.data?.negotiations,
    team: negotiationsQuery.data?.team,
    isLoading: negotiationsQuery.isLoading,
    refetch: handleIdChange,
  };
};
