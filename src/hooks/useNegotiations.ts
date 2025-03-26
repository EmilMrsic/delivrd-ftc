import { backendRequest } from "@/lib/request";
import { getUserData } from "@/lib/user";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

export const useNegotiations = (
  config: {
    all?: boolean;
    filter?: { [key: string]: string | string[] };
    id?: string;
  } = {}
) => {
  const [id, setId] = useState<string>(
    config.id || getUserData().deal_coordinator_id
  );

  const [filters, setFilters] = useState<{ [key: string]: string | string[] }>(
    config.filter ?? {}
  );

  const cacheKey = config.all ? `negotiations` : `negotiation-${id}`;

  const negotiationsQuery = useQuery({
    queryKey: [cacheKey, filters],
    queryFn: async () => {
      const path = config.all
        ? `negotiation`
        : `negotiation/${id || getUserData().deal_coordinator_id}`;

      const request = await backendRequest(path, "POST", {
        filter: filters,
      });

      return request;
    },
  });

  const handleIdChange = (
    newId?: string,
    newFilters?: { [key: string]: string | string[] }
  ) => {
    if (newId) {
      setId(newId);
    }

    if (newFilters) {
      setFilters(newFilters);
    }
  };

  useEffect(() => {
    negotiationsQuery.refetch();
  }, [id, filters]);

  return {
    negotiations: negotiationsQuery.data?.negotiations,
    team: negotiationsQuery.data?.team,
    isLoading: negotiationsQuery.isLoading,
    refetch: handleIdChange,
  };
};
