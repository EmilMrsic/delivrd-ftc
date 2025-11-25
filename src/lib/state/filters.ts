import { FiltersState } from "@/types/state";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useFiltersStore = create<FiltersState>()(
  persist(
    (set, get) => ({
      supportAgent: null,
      setSupportAgent: (agent) => set({ supportAgent: agent }),
    }),
    { name: "filters-state" }
  )
);
