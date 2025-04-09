import { useState, useEffect, useMemo } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useNegotiations } from "./useNegotiations";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";

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
  const { negotiations, refetch, team, isLoading } = useNegotiations({
    archive: archive,
    ...userFilters,
  });

  const {
    negotiations: allNegotiations,
    refetch: refetchAll,
    isLoading: isLoadingAll,
  } = useNegotiations({
    archive: archive,
    all: true,
    ...allFilters,
  });

  const [negotiatorData, setNegotiatorData] = useState<DealNegotiatorType>();
  const [allDealNegotiator, setAllDealNegotiator] = useState<
    DealNegotiatorType[]
  >([]);
  const [loading, setLoading] = useState(true);

  const getAllDealNegotiator = async () => {
    try {
      const teamCollection = collection(db, "team delivrd");

      const querySnapshot = await getDocs(teamCollection);

      const negotiatiatorData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return negotiatiatorData as DealNegotiatorType[];
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getAllDealNegotiator().then((res) => setAllDealNegotiator(res ?? []));
  }, []);

  return {
    allNegotiations: allNegotiations,
    negotiations: negotiations,
    team: team,
    setAllDealNegotiator,
    allDealNegotiator,
    // @ts-ignore
    negotiatorData: negotiatorData,
    setNegotiatorData,
    loading: isLoading,
    loadingAll: isLoadingAll,
    refetch: refetch,
    searchAll,
    setSearchAll,
    refetchAll,
    archive,
    setArchive,
  };
};

export default useTeamDashboard;
