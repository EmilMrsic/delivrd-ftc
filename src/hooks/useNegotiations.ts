"use client";
import { backendRequest } from "@/lib/request";
import { useNegotiationStore } from "@/lib/state/negotiation";
import { getUserData } from "@/lib/user";
import { useQuery } from "@tanstack/react-query";
import { isEqual } from "lodash";
import { useEffect, useMemo, useRef, useState } from "react";

import crypto from "crypto";

export const hashJson = (obj: unknown) => {
  const json = JSON.stringify(obj);
  return crypto.createHash("sha256").update(json).digest("hex");
};

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
  const hashRef = useRef<string | null>(null);
  const cachedNegotiations = useNegotiationStore((state) => state.negotiations);
  const refreshedAt = useNegotiationStore((state) => state.refreshedAt);
  const setRefreshedAt = useNegotiationStore((state) => state.setRefreshedAt);
  const mergeInNegotiations = useNegotiationStore(
    (state) => state.mergeInNegotiations
  );
  const pruneNegotiations = useNegotiationStore(
    (state) => state.pruneNegotiations
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
    enabled: false, //refreshedAt === null,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });

  // useEffect(() => {
  //   negotiationsQuery.refetch();
  //   setRefreshedAt(Date.now());
  // }, []);

  useEffect(() => {
    if (negotiationsQuery.data?.negotiations) {
      const byId: Record<string, any> = {};
      negotiationsQuery.data?.negotiations.forEach((negotiation: any) => {
        negotiation.cachedAt = new Date().toISOString();
        byId[negotiation.id] = negotiation;
      });

      mergeInNegotiations(
        byId,
        (config.all && Object.keys(filters).length === 0) || false
      );
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
    const potentialNewHash = hashJson([
      id,
      config.filter ?? {},
      config.archive,
      config.all,
    ]);
    // console.log("comparing", "new", potentialNewHash, "old", hashRef.current);
    if (potentialNewHash !== hashRef.current) {
      hashRef.current = potentialNewHash;
      negotiationsQuery.refetch();
    }
    // console.log("running the effect", id, filters, config.archive);
    // negotiationsQuery.refetch();
  }, [id, filters, config.archive, config.all]);

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
