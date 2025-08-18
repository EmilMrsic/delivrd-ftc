import { db } from "@/firebase/config";
import { DealNegotiatorType } from "@/lib/models/team";
import { useDealNeogiatorStore } from "@/lib/state/deal-negotiatior";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, onSnapshot } from "firebase/firestore";
import { useMemo } from "react";

export const useDealNegotiators = () => {
  const dealNegotiators = useDealNeogiatorStore(
    (state) => state.dealNegotiators
  );
  const setDealNegotiators = useDealNeogiatorStore(
    (state) => state.setDealNegotiators
  );

  const getDealNegotiators = useDealNeogiatorStore(
    (state) => state.getDealNegotiators
  );

  const data = useQuery({
    queryKey: ["dealNegotiators"],
    queryFn: async () => {
      const snapshot = await getDocs(collection(db, "team delivrd"));
      const dealNegotiators: Record<string, DealNegotiatorType> = {};
      snapshot.forEach((doc) => {
        dealNegotiators[doc.id] = doc.data() as DealNegotiatorType;
      });

      setDealNegotiators(dealNegotiators);

      return dealNegotiators;
    },
    refetchOnWindowFocus: false,
  });

  const listedDealNegotiations = useMemo(() => {
    return getDealNegotiators();
  }, [data.data]);

  return {
    dealNegotiators: listedDealNegotiations,
  };
};
