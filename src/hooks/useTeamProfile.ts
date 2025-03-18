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
import { useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { useNegotiations } from "./useNegotiations";

type GroupedBidComments = {
  [bid_id: string]: BidComments[];
};

const useTeamProfile = () => {
  const dispatch = useDispatch();
  const [hasLoaded, setHasLoaded] = useState(false);
  const { notificationCount } = useAppSelector((state) => state.notification);
  const [bidCommentsByBidId, setBidCommentsByBidId] =
    useState<GroupedBidComments>({});
  const params = useSearchParams();
  const [user, setUser] = useState<any>();
  const [dealNegotiator, setDealNegotiator] = useState<DealNegotiator>();

  const [incomingBids, setIncomingBids] = useState<IncomingBid[]>([]);
  const { notification } = useAppSelector((state) => state.notification);
  const [dealers, setDealers] = useState<DealerData[]>([]);
  const [allDealNegotiator, setAllDealNegotiator] = useState<DealNegotiator[]>(
    []
  );
  // const [negotiation, setNegotiation] = useState<EditNegotiationData | null>(
  //   null
  // );
  const negotiationId = params.get("id");
  const { negotiations } = useNegotiations({
    all: true,
    filter: {
      id: negotiationId ?? "",
    },
  });
  const negotiation = negotiations?.[0];

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

      return negotiatiatorData as DealNegotiator[];
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    if (!hasLoaded) {
      setHasLoaded(true);
    } else {
      dispatch(setNotificationCount(notificationCount + 1));
    }
  }, [notification]);

  useEffect(() => {
    fetchDealers().then((res) => setDealers(res as DealerData[]));
    fetchBidComments();
    getAllDealNegotiator().then((res) =>
      setAllDealNegotiator(res as DealNegotiator[])
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

    getBidsByIds(negotiation?.otherData?.incoming_bids ?? []);
  }, [negotiation]);

  useEffect(() => {
    const user = localStorage.getItem("user");
    setUser(JSON.parse(user ?? ""));
  }, []);

  useEffect(() => {
    const getDealNegotiatorData = async () => {
      if (!negotiation?.clientInfo?.negotiations_deal_coordinator) return;

      try {
        const teamDocRef = query(
          collection(db, "team delivrd"),
          where(
            "id",
            "==",
            negotiation?.clientInfo?.negotiations_deal_coordinator
          )
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
    setUser,
    allDealNegotiator,
    setAllDealNegotiator,
    negotiation,
    // setNegotiation,
    negotiationId,
    notification,
    notificationCount,
    incomingBids,
    setIncomingBids,
    bidCommentsByBidId,
    setBidCommentsByBidId,
  };
};

export default useTeamProfile;
