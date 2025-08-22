import { NegotiationState } from "@/types/state";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { NegotiationDataType } from "../models/team";
import { isEqual } from "lodash";

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
      mergeInNegotiations: (byId: Record<string, NegotiationDataType>) => {
        set((state => {
          const updatedNegotiations = {...state.negotiations};
          let changed = false;

          Object.entries(byId).forEach(([id, negotiation]) => {
            if(!isEqual(updatedNegotiations[id], negotiation)) {
              updatedNegotiations[id] = negotiation;
              changed = true;
            }
          })

          if(changed) {
            return { negotiations: updatedNegotiations };
          }

          return {}
        }))
        // set((state) => ({
        //   negotiations: {
        //     ...state.negotiations,
        //     ...byId,
        //   },
        // }));
      },
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
