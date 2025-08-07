import { TeamDashboardState } from "@/types/state";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useTeamDashboardStore = create<TeamDashboardState>()(
  persist(
    (set, get) => ({
      allNegotiations: [],
      setAllNegotiations: (negotiations) =>
        set({ allNegotiations: negotiations }),
      negotiations: [],
      setNegotiations: (negotiations: string[]) => set({ negotiations }),
    }),
    { name: "team-dashboard-storage" }
  )
);
