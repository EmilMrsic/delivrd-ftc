import { DealNegotiatorsState } from "@/types/state";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useDealNeogiatorStore = create<DealNegotiatorsState>()(
  persist(
    (set, get) => ({
      dealNegotiators: {},
      setDealNegotiators: (dealNegotiators) =>
        set(() => ({
          dealNegotiators: {
            ...get().dealNegotiators,
            ...dealNegotiators,
          },
        })),
      getDealNegotiators: () => Object.values(get().dealNegotiators),
    }),
    {
      name: "deal-negotiators-storage",
    }
  )
);
