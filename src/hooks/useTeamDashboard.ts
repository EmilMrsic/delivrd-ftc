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
import { NegotiationDataType } from "@/lib/models/team";

const useTeamDashboard = (
  config: {
    all?: boolean;
    id?: string;
    filter?: {
      [key: string]: string | string[];
    };
  } = {}
) => {
  const { negotiations, refetch, team } = useNegotiations(config);
  const [filteredDeals, setFilteredDeals] = useState<NegotiationDataType[]>([]);
  const [allInternalNotes, setAllInternalNotes] = useState<
    Record<string, InternalNotes[]>
  >({});
  const [originalDeals, setOriginalDeals] = useState<NegotiationDataType[]>([]);
  const [negotiatorData, setNegotiatorData] = useState<DealNegotiator>();
  const [allDealNegotiator, setAllDealNegotiator] = useState<DealNegotiator[]>(
    []
  );

  const [itemsPerPage, setItemsPerPage] = useState(100);

  const [currentPage, setCurrentPage] = useState(1);

  const [currentDeals, setCurrentDeals] = useState<NegotiationDataType[]>([]);

  const [loading, setLoading] = useState(true);
  const getAllDealNegotiator = async () => {
    try {
      const teamCollection = collection(db, "team delivrd");

      const querySnapshot = await getDocs(teamCollection);

      const negotiatiatorData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return negotiatiatorData as DealNegotiator[];
    } catch (error) {
      console.log(error);
    }
  };

  const fetchBidNotes = async () => {
    try {
      const bidNotesRef = collection(db, "internal notes");
      const bidNotesByNegotiation: Record<string, InternalNotes[]> = {};

      const negotiationIds = filteredDeals.map((bid) => bid.id);

      if (negotiationIds.length === 0) {
        console.log("No filtered deals to fetch notes for.");
        setAllInternalNotes({});
        return;
      }

      const chunkedIds = chunk(negotiationIds, 10);

      for (const idChunk of chunkedIds) {
        const bidNotesQuery = query(
          bidNotesRef,
          where("negotiation_id", "in", idChunk)
        );
        const bidNotesSnap = await getDocs(bidNotesQuery);

        bidNotesSnap.forEach((doc) => {
          const notesData = doc.data() as InternalNotes;
          const negotiation_id = notesData.negotiation_id;

          if (!bidNotesByNegotiation[negotiation_id]) {
            bidNotesByNegotiation[negotiation_id] = [];
          }
          bidNotesByNegotiation[negotiation_id].push(notesData);
        });
      }

      console.log(bidNotesByNegotiation);
      setAllInternalNotes(bidNotesByNegotiation);
    } catch (error) {
      console.error("Error fetching bid notes:", error);
    }
  };

  useEffect(() => {
    if (negotiations) {
      const prunedDeals = pruneNegotiations(negotiations);
      setOriginalDeals(prunedDeals as NegotiationDataType[]);
      const filteredDeals = sortNegotiationsByStatus(prunedDeals);
      setFilteredDeals(filteredDeals as NegotiationDataType[]);
    }
  }, [negotiations]);

  useEffect(() => {
    getAllDealNegotiator().then((res) => setAllDealNegotiator(res ?? []));
  }, []);

  useEffect(() => {
    fetchBidNotes();
    setCurrentDeals(
      filteredDeals?.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
      )
    );
  }, [filteredDeals]);

  return {
    negotiations: negotiations,
    team: team,
    setFilteredDeals,
    filteredDeals,
    setAllDealNegotiator,
    allDealNegotiator,
    setAllInternalNotes,
    allInternalNotes,
    originalDeals,
    setOriginalDeals,
    negotiatorData,
    setNegotiatorData,
    loading,
    setLoading,
    currentDeals,
    setCurrentDeals,
    setItemsPerPage,
    itemsPerPage,
    currentPage,
    setCurrentPage,
    refetch: refetch,
  };
};

export default useTeamDashboard;
