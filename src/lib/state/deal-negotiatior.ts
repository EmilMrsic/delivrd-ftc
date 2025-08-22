import { DealNegotiatorsState } from "@/types/state";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useDealNeogiatorStore = create<DealNegotiatorsState>()(
  persist(
    (set, get) => ({
      dealNegotiators: {},
      setDealNegotiators: (dealNegotiators) =>
        set((state) => {
          const merged = { ...state.dealNegotiators, ...dealNegotiators };
          if (JSON.stringify(state.dealNegotiators) !== JSON.stringify(merged)) {
            return { dealNegotiators: merged };
          }
          return state;
        }),
      getDealNegotiators: () => Object.values(get().dealNegotiators),
    }),
    {
      name: "deal-negotiators-storage",
    }
  )
);
