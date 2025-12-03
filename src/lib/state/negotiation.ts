"use client";
import { NegotiationState } from "@/types/state";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { NegotiationDataType } from "../models/team";
import { isEqual } from "lodash";
import { idbStorage } from "../helpers/state";

export const useNegotiationStore = create<NegotiationState>()(
  persist(
    (set, get) => ({
      refreshedAt: null,
      setRefreshedAt: (time: number) => set({ refreshedAt: time }),
      negotiations: {},
      setNegotiation: (id, data) =>
        set((state) => ({
          negotiations: {
            ...state.negotiations,
            [id]: data,
          },
        })),
      mergeInNegotiations: (
        byId: Record<string, NegotiationDataType>,
        all: boolean
      ) => {
        set((state) => {
          const updatedNegotiations = { ...state.negotiations };
          let changed = false;

          Object.entries(byId).forEach(([id, negotiation]) => {
            if (!isEqual(updatedNegotiations[id], negotiation)) {
              updatedNegotiations[id] = negotiation;
              changed = true;
            }
          });

          if (all) {
            const incomingIds = new Set(Object.keys(byId));
            let foundOld = 0;
            for (const id of Object.keys(updatedNegotiations)) {
              if (!incomingIds.has(id)) {
                delete updatedNegotiations[id];
                changed = true;
                foundOld++;
              }
            }
          }

          if (changed) {
            return { negotiations: updatedNegotiations };
          }

          return {};
        });
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
      pruneNegotiations: () => {
        // console.log("pruning negotiations", );

        const newNegotiations = {};
        for (const negotiation of Object.values(get().negotiations)) {
          console.log(negotiation);
        }
      },
    }),
    {
      name: "negotiation-storage",
      storage: createJSONStorage(() => ({ ...idbStorage })),
    }
  )
);
