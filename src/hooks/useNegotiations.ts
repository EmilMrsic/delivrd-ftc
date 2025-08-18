import { backendRequest } from "@/lib/request";
import { useNegotiationStore } from "@/lib/state/negotiation";
import { getUserData } from "@/lib/user";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

export const useNegotiations = (
  config: {
    all?: boolean;
    profile?: boolean;
    mode?: "consult" | "standard";
    filter?: { [key: string]: string | string[] };
    id?: string;
    archive?: boolean;
  } = {}
) => {
  const mergeInNegotiations = useNegotiationStore(
    (state) => state.mergeInNegotiations
  );
  const loggedInUserId = getUserData()?.deal_coordinator_id;
  const [id, setId] = useState<string>(config.id || loggedInUserId);

  const [filters, setFilters] = useState<{ [key: string]: string | string[] }>(
    config.filter ?? {}
  );

  const cacheKey = config.all ? `negotiations` : `negotiation-${id}`;

  const negotiationsQuery = useQuery<any>({
    queryKey: [cacheKey, filters],
    queryFn: async () => {
      const path = config.all
        ? `negotiation`
        : `negotiation/${id || loggedInUserId}`;

      const request = await backendRequest(path, "POST", {
        archive: config.archive,
        filter: filters,
        profile: config.profile,
        mode: config.mode,
      });

      return request;
    },
  });

  useEffect(() => {
    if (negotiationsQuery.data?.negotiations) {
      console.log("updating the store");
      const byId: Record<string, any> = {};
      negotiationsQuery.data?.negotiations.forEach((negotiation: any) => {
        byId[negotiation.id] = negotiation;
      });

      mergeInNegotiations(byId);
    }
  }, [negotiationsQuery.data]);

  const handleIdChange = (
    newId?: string,
    newFilters?: { [key: string]: string | string[] },
    reset?: boolean
  ) => {
    if (reset) {
      setId(loggedInUserId);
      setFilters({});
    }

    if (newId) {
      setId(newId);
    }

    if (newFilters) {
      setFilters(newFilters);
    }

    if (!newId && !newFilters && !reset) {
      negotiationsQuery.refetch();
    }
  };

  useEffect(() => {
    negotiationsQuery.refetch();
  }, [id, filters, config.archive]);

  useEffect(() => {
    setFilters(config.filter ?? {});
  }, [config.filter?.id]);

  return {
    negotiations: negotiationsQuery.data?.negotiations,
    team: negotiationsQuery.data?.team,
    isLoading: negotiationsQuery.isLoading,
    refetch: handleIdChange,
  };
};
