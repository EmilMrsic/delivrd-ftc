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

const useTeamDashboard = (config: { all?: boolean } = {}) => {
  const negotiations = useNegotiations(config);
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
  // TODO: Deprecated, use useNegotiations instead (not in use just saving in case)
  // const fetchAllNegotiation = async () => {
  //   setLoading(true);
  //   try {
  //     const userData = localStorage.getItem("user");
  //     if (!userData) {
  //       console.error("No user data found in localStorage");
  //       return;
  //     }

  //     const parseUserData = JSON.parse(userData);
  //     const id = Array.isArray(parseUserData.deal_coordinator_id)
  //       ? parseUserData.deal_coordinator_id[0]
  //       : parseUserData.deal_coordinator_id;

  //     if (!id || typeof id !== "string") {
  //       console.error(
  //         "Invalid deal_coordinator_id:",
  //         parseUserData.deal_coordinator_id
  //       );
  //       return;
  //     }

  //     const teamDocRef = doc(db, "team delivrd", id);
  //     const teamSnapshot = await getDoc(teamDocRef);

  //     if (!teamSnapshot.exists()) {
  //       console.log("Team document not found");
  //       return;
  //     }

  //     const teamData = teamSnapshot.data();
  //     setNegotiatorData(teamData as DealNegotiator);

  //     const activeDeals = teamData.active_deals;
  //     if (!Array.isArray(activeDeals) || activeDeals.length === 0) {
  //       console.log("No active deals found");
  //       setOriginalDeals([]);
  //       setFilteredDeals([]);
  //       return;
  //     }

  //     const negotiationsCollectionRef = collection(db, "negotiations");
  //     const chunkedIds = chunk(activeDeals, 10);
  //     const negotiationsData: NegotiationData[] = [];

  //     for (const idChunk of chunkedIds) {
  //       const negotiationsQuery = query(
  //         negotiationsCollectionRef,
  //         where("__name__", "in", idChunk)
  //       );
  //       const negotiationsSnapshot = await getDocs(negotiationsQuery);

  //       negotiationsSnapshot.forEach((doc) => {
  //         const data = doc.data();
  //         negotiationsData.push(data as NegotiationData);
  //       });
  //     }

  //     setOriginalDeals(negotiationsData as NegotiationData[]);
  //     const defaultFilteredDeals = negotiationsData.filter((deal) =>
  //       allowedStatuses.includes(deal.negotiations_Status ?? "")
  //     );
  //     setFilteredDeals(defaultFilteredDeals as NegotiationData[]);
  //   } catch (error) {
  //     console.error("Error fetching negotiations:", error);
  //   } finally {
  //     setLoading(false); // Stop loading
  //   }
  // };

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
    if (negotiations.negotiations) {
      const prunedDeals = pruneNegotiations(negotiations.negotiations);
      setOriginalDeals(prunedDeals as NegotiationDataType[]);
      const filteredDeals = sortNegotiationsByStatus(prunedDeals);
      setFilteredDeals(filteredDeals as NegotiationDataType[]);
    }
  }, [negotiations.negotiations]);

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

  // TODO: remove this
  // useEffect(() => {
  //   if (
  //     "serviceWorker" in navigator &&
  //     typeof window !== "undefined" &&
  //     navigator
  //   ) {
  //     window.navigator.serviceWorker
  //       .getRegistrations()
  //       .then((registrations) => {
  //         if (registrations.length === 0) {
  //           window.navigator.serviceWorker
  //             .register("../../../firebase-messaging-sw.js")
  //             .then((registration) => {
  //               console.log(
  //                 "Service Worker registered successfully:",
  //                 registration
  //               );
  //             })
  //             .catch((error) => {
  //               console.error("Service Worker registration failed:", error);
  //             });
  //         } else {
  //           console.log("Service Worker is already registered");
  //         }
  //       });
  //   } else {
  //     console.log("Service Workers are not supported in this browser.");
  //   }
  // }, []);

  return {
    negotiations: negotiations.negotiations,
    team: negotiations.team,
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
  };
};

export default useTeamDashboard;
