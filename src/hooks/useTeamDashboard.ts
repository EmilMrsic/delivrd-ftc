import { useState, useEffect, useMemo, use } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useNegotiations } from "./useNegotiations";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";
import { useNegotiationStore } from "@/lib/state/negotiation";
import { useTeamDashboardStore } from "@/lib/state/team-dashboard";
import { useDealNegotiators } from "./useDealNegotiators";
import { getUserData } from "@/lib/user";

const useTeamDashboard = (
  config: {
    all?: boolean;
    id?: string;
    filter?: {
      [key: string]: string | string[];
    };
  } = {}
): {
  negotiations: NegotiationDataType[];
  allNegotiations: NegotiationDataType[];
  team: DealNegotiatorType[];
  setAllDealNegotiator: (allDealNegotiator: DealNegotiatorType[]) => void;
  allDealNegotiator: DealNegotiatorType[];
  negotiatorData: DealNegotiatorType;
  setNegotiatorData: (negotiatorData: DealNegotiatorType) => void;
  refetch: (id?: string, filters?: any, reset?: boolean) => void;
  searchAll: boolean;
  setSearchAll: (searchAll: boolean) => void;
  refetchAll: (id?: string, filters?: any, reset?: boolean) => void;
  loading: boolean;
  loadingAll: boolean;
  archive: boolean;
  setArchive: (archive: boolean) => void;
} => {
  const { dealNegotiators } = useDealNegotiators();

  const allStoredNegotiations = useNegotiationStore(
    (state) => state.negotiations
  );
  const setStoredNegotiationIds = useTeamDashboardStore(
    (state) => state.setNegotiations
  );
  const storedNegotiationIds = useTeamDashboardStore(
    (state) => state.negotiations
  );
  const setAllStoredNegotiationIds = useTeamDashboardStore(
    (state) => state.setAllNegotiations
  );
  const storedAllNegotiationIds = useTeamDashboardStore(
    (state) => state.allNegotiations
  );

  const [archive, setArchive] = useState(false);
  const [searchAll, setSearchAll] = useState(false);
  const [userFilters, allFilters] = useMemo(() => {
    const userFilters = { ...config };
    const allFilters = searchAll ? { ...config } : {};
    if (searchAll) {
      delete allFilters.id;
    }

    return [userFilters, allFilters];
  }, [config, searchAll]);

  const {
    negotiations: fetchedNegotiations,
    refetch,
    // team,
    isLoading,
  } = useNegotiations({
    all: Object.keys(userFilters.filter || {}).length > 0,
    archive: archive,
    ...userFilters,
  });

  const {
    negotiations: fetchedAllNegotiations,
    refetch: refetchAll,
    isLoading: isLoadingAll,
  } = useNegotiations({
    archive: archive,
    all: true,
    ...allFilters,
  });

  useEffect(() => {
    if (fetchedNegotiations) {
      setStoredNegotiationIds(
        fetchedNegotiations.map((n: NegotiationDataType) => n.id)
      );
    }
  }, [fetchedNegotiations]);

  useEffect(() => {
    if (fetchedAllNegotiations) {
      setAllStoredNegotiationIds(
        fetchedAllNegotiations.map((n: NegotiationDataType) => n.id)
      );
    }
  }, [fetchedAllNegotiations]);

  const [negotiatorData, setNegotiatorData] = useState<DealNegotiatorType>();

  const allNegotiations = useMemo(() => {
    return storedAllNegotiationIds
      .map((id) => allStoredNegotiations[id])
      .filter((n) => n);
  }, [storedAllNegotiationIds, allStoredNegotiations]);

  const negotiations = useMemo(() => {
    return storedNegotiationIds
      .map((id) => allStoredNegotiations[id])
      .filter((n) => n);
  }, [storedNegotiationIds, allStoredNegotiations]);

  console.log(
    "total negotiations in store:",
    Object.keys(allStoredNegotiations).length
  );

  console.log("user negotiations in store:", storedNegotiationIds.length);

  return {
    allNegotiations: allNegotiations,
    negotiations: negotiations,
    team: dealNegotiators,
    setAllDealNegotiator: (allDealNegotiator: DealNegotiatorType[]) => {},
    allDealNegotiator: dealNegotiators,
    // @ts-ignore
    negotiatorData: negotiatorData,
    setNegotiatorData,
    loading: !negotiations && isLoading,
    loadingAll: isLoadingAll,
    refetch: refetch,
    searchAll,
    setSearchAll,
    refetchAll: refetchAll,
    archive,
    setArchive,
  };
};

export default useTeamDashboard;
