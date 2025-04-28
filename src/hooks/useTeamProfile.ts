import { setNotificationCount } from "@/app/redux/Slice/notificationSlice";
import { useAppSelector } from "@/app/redux/store";
import { db } from "@/firebase/config";
import { mapNegotiationData } from "@/lib/utils";
import {
  BidComments,
  DealerData,
  DealNegotiator,
  EditNegotiationData,
  IncomingBid,
} from "@/types";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNegotiations } from "./useNegotiations";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";
import { useLoggedInUser } from "./useLoggedInUser";

type GroupedBidComments = {
  [bid_id: string]: BidComments[];
};

const useTeamProfile = ({ negotiationId }: { negotiationId: string }) => {
  const user = useLoggedInUser();
  const [bidCommentsByBidId, setBidCommentsByBidId] =
    useState<GroupedBidComments>({});
  const [dealNegotiator, setDealNegotiator] = useState<DealNegotiator>();

  const [incomingBids, setIncomingBids] = useState<IncomingBid[]>([]);
  const [dealers, setDealers] = useState<DealerData[]>([]);
  const [allDealNegotiator, setAllDealNegotiator] = useState<
    DealNegotiatorType[]
  >([]);
  const [negotiation, setNegotiation] = useState<NegotiationDataType | null>(
    null
  );

  const { negotiations: negotiationsFromUseNegotiations, isLoading } =
    useNegotiations({
      all: true,
      profile: true,
      filter: {
        id: negotiationId,
      },
    });

  console.log(
    "negotiationsFromUseNegotiations:",
    negotiationsFromUseNegotiations
  );
  useEffect(() => {
    if (negotiationsFromUseNegotiations) {
      setNegotiation(negotiationsFromUseNegotiations[0]);
    }
  }, [negotiationsFromUseNegotiations]);

  const fetchDealers = async () => {
    const dealersData = [];

    for (const bid of incomingBids) {
      const id = bid.dealerId;
      if (id !== "N/A" && id)
        try {
          const dealerRef = doc(db, "Dealers", id);
          const dealerSnap = await getDoc(dealerRef);

          if (dealerSnap.exists()) {
            dealersData.push(dealerSnap.data());
          } else {
            console.warn(`Dealer with ID ${id} not found`);
          }
        } catch (error) {
          console.error(`Error fetching dealer data for ID ${id}:`, error);
        }
    }

    return dealersData;
  };

  const fetchBidComments = async () => {
    const groupedBidComments: GroupedBidComments = {};
    const bidCommentsRef = collection(db, "bid comment");

    for (const bid of incomingBids) {
      const bid_id = bid.bid_id;

      try {
        const bidCommentQuery = query(
          bidCommentsRef,
          where("bid_id", "==", bid_id)
        );

        const bidCommentSnap = await getDocs(bidCommentQuery);

        if (!bidCommentSnap.empty) {
          bidCommentSnap.forEach((doc) => {
            const bidCommentData = doc.data() as BidComments;

            if (!groupedBidComments[bid_id]) {
              groupedBidComments[bid_id] = [];
            }

            groupedBidComments[bid_id].push(bidCommentData);
          });
        } else {
          console.warn(`No comments found for bid ID ${bid_id}`);
        }
      } catch (error) {
        console.error(`Error fetching bid comment for ID ${bid_id}:`, error);
      }
    }

    setBidCommentsByBidId(groupedBidComments);
  };

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
    fetchDealers().then((res) => setDealers(res as DealerData[]));
    fetchBidComments();
    getAllDealNegotiator().then((res) =>
      setAllDealNegotiator(res as DealNegotiatorType[])
    );
  }, [incomingBids]);

  useEffect(() => {
    const getBidsByIds = async (bidIds: string[]) => {
      if (!bidIds || bidIds.length === 0) {
        return;
      }

      try {
        const incomingBidsCollection = collection(db, "Incoming Bids");

        const bidsPromises = bidIds.map(async (bidId: string) => {
          const bidsQuery = query(
            incomingBidsCollection,
            where("bid_id", "==", bidId)
          );

          const querySnapshot = await getDocs(bidsQuery);

          if (!querySnapshot.empty) {
            return querySnapshot.docs[0].data();
          } else {
            return null;
          }
        });

        const bidsData = await Promise.all(bidsPromises);

        const validBids: IncomingBid[] = bidsData.filter(
          (bid) => bid !== null
        ) as IncomingBid[];

        setIncomingBids(validBids);
      } catch (error) {
        console.error("Error fetching incoming bids:", error);
      }
    };

    getBidsByIds(negotiation?.incomingBids ?? []);
  }, [negotiation]);

  useEffect(() => {
    const getDealNegotiatorData = async () => {
      if (!negotiation?.dealCoordinatorId) return;

      try {
        const teamDocRef = query(
          collection(db, "team delivrd"),
          where("id", "==", negotiation?.dealCoordinatorId)
        );

        const querySnapshot = await getDocs(teamDocRef);

        if (!querySnapshot.empty) {
          const firstDoc = querySnapshot.docs[0];
          setDealNegotiator(firstDoc.data() as DealNegotiator);
        } else {
          console.log("No deal negotiator!");
        }
      } catch (error) {
        console.error("Error fetching negotiation:", error);
      }
    };

    getDealNegotiatorData();
  }, [negotiation]);

  return {
    dealNegotiator,
    setDealNegotiator,
    setDealers,
    dealers,
    user,
    allDealNegotiator,
    setAllDealNegotiator,
    negotiation,
    setNegotiation,
    negotiationId,
    incomingBids,
    setIncomingBids,
    bidCommentsByBidId,
    setBidCommentsByBidId,
    isLoading,
  };
};

export default useTeamProfile;
