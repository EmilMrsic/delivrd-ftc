import { useState, useEffect, useMemo } from "react";
import {
  collection,
  doc,
  query,
  where,
  getDocs,
  getDoc,
} from "firebase/firestore";
import { chunk } from "lodash";
import { db } from "@/firebase/config";
import { DealNegotiator, InternalNotes, NegotiationData } from "@/types";
import {
  pruneNegotiations,
  sortNegotiationsByStatus,
} from "@/lib/helpers/negotiation";
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
  loading: boolean;
  refetch: (id?: string, filters?: any, reset?: boolean) => void;
  searchAll: boolean;
  setSearchAll: (searchAll: boolean) => void;
} => {
  const [searchAll, setSearchAll] = useState(false);
  const [userFilters, allFilters] = useMemo(() => {
    const userFilters = { ...config };
    const allFilters = searchAll ? { ...config } : {};
    if (searchAll) {
      delete allFilters.id;
    }

    return [userFilters, allFilters];
  }, [config, searchAll]);
  const { negotiations, refetch, team } = useNegotiations({
    ...userFilters,
  });

  const { negotiations: allNegotiations } = useNegotiations({
    all: true,
    ...allFilters,
  });

  // const [filteredDeals, setFilteredDeals] = useState<NegotiationDataType[]>([]);
  // const [allInternalNotes, setAllInternalNotes] = useState<
  //   Record<string, InternalNotes[]>
  // >({});
  // const [originalDeals, setOriginalDeals] = useState<NegotiationDataType[]>([]);
  // const [itemsPerPage, setItemsPerPage] = useState(100);
  // const [currentPage, setCurrentPage] = useState(1);
  // const [currentDeals, setCurrentDeals] = useState<NegotiationDataType[]>([]);

  // const fetchBidNotes = async () => {
  //   try {
  //     const bidNotesRef = collection(db, "internal notes");
  //     const bidNotesByNegotiation: Record<string, InternalNotes[]> = {};

  //     const negotiationIds = filteredDeals.map((bid) => bid.id);

  //     if (negotiationIds.length === 0) {
  //       console.log("No filtered deals to fetch notes for.");
  //       setAllInternalNotes({});
  //       return;
  //     }

  //     const chunkedIds = chunk(negotiationIds, 10);

  //     for (const idChunk of chunkedIds) {
  //       const bidNotesQuery = query(
  //         bidNotesRef,
  //         where("negotiation_id", "in", idChunk)
  //       );
  //       const bidNotesSnap = await getDocs(bidNotesQuery);

  //       bidNotesSnap.forEach((doc) => {
  //         const notesData = doc.data() as InternalNotes;
  //         const negotiation_id = notesData.negotiation_id;

  //         if (!bidNotesByNegotiation[negotiation_id]) {
  //           bidNotesByNegotiation[negotiation_id] = [];
  //         }
  //         bidNotesByNegotiation[negotiation_id].push(notesData);
  //       });
  //     }

  //     console.log(bidNotesByNegotiation);
  //     setAllInternalNotes(bidNotesByNegotiation);
  //   } catch (error) {
  //     console.error("Error fetching bid notes:", error);
  //   }
  // };

  // useEffect(() => {
  //   if (negotiations) {
  //     const prunedDeals = pruneNegotiations(negotiations);
  //     setOriginalDeals(prunedDeals as NegotiationDataType[]);
  //     const filteredDeals = sortNegotiationsByStatus(prunedDeals);
  //     setFilteredDeals(filteredDeals as NegotiationDataType[]);
  //   }
  // }, [negotiations]);

  // useEffect(() => {
  //   fetchBidNotes();
  //   setCurrentDeals(
  //     filteredDeals?.slice(
  //       (currentPage - 1) * itemsPerPage,
  //       currentPage * itemsPerPage
  //     )
  //   );
  // }, [filteredDeals]);

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

  useEffect(() => {
    console.log("searchAll:", searchAll);
  }, [searchAll]);

  return {
    allNegotiations: allNegotiations,
    negotiations: negotiations,
    team: team,
    setAllDealNegotiator,
    allDealNegotiator,
    // @ts-ignore
    negotiatorData: negotiatorData,
    setNegotiatorData,
    loading,
    setLoading,
    refetch: refetch,
    searchAll,
    setSearchAll,
    // setFilteredDeals,
    // filteredDeals,
    // setAllInternalNotes,
    // allInternalNotes,
    // originalDeals,
    // setOriginalDeals,
    // currentDeals,
    // setCurrentDeals,
    // setItemsPerPage,
    // itemsPerPage,
    // currentPage,
    // setCurrentPage,
  };
};

export default useTeamDashboard;
