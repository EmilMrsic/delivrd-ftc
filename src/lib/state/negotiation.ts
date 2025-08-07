import { NegotiationState } from "@/types/state";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useNegotiationStore = create<NegotiationState>()(
  persist(
    (set, get) => ({
      negotiations: {},
      setNegotiation: (id, data) =>
        set((state) => ({
          negotiations: {
            ...state.negotiations,
            [id]: data,
          },
        })),
      getNegotiation: (id) => get().negotiations[id],
      hasNegotiation: (id) =>
        Object.prototype.hasOwnProperty.call(get().negotiations, id),
      removeNegotiation: (id) =>
        set((state) => {
          const { [id]: _, ...rest } = state.negotiations;
          return { negotiations: rest };
        }),
      clearNegotiations: () => set({ negotiations: {} }),
    }),
    { name: "negotiation-storage" }
  )
);
