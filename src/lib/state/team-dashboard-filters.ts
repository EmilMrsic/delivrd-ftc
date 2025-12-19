import { TeamDashboardFiltersState } from "@/types/state";
import { create } from "zustand";

export const useTeamDashboardFiltersState = create<TeamDashboardFiltersState>(
  (set, get) => ({
    hasIncomingBids: false,
    hasTradeInBids: false,
    hasFastLane: false,
    updateFilter: (filter) => set((state) => ({ ...state, ...filter })),
    clearFilters: () =>
      set({
        hasIncomingBids: false,
        hasTradeInBids: false,
        hasFastLane: false,
      }),
  })
);
