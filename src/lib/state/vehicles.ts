import { Vehicle } from "@/types";
import { DealerVehiclesState } from "@/types/state";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useVehiclesStore = create<DealerVehiclesState>()(
  persist(
    (set, get) => ({
      vehicles: {},
      setVehicle: (id, data) =>
        set((state) => ({
          vehicles: {
            ...state.vehicles,
            [id]: data,
          },
        })),
      getVehicle: (id) => get().vehicles[id],
      mergeInVehicles: (byId) => {
        // only merge in if we have new vehicles
        const newVehicles: Record<string, Vehicle> = {};
        let hasNewVehicles = false;
        for (const [id, data] of Object.entries(byId)) {
          if (!get().vehicles[id]) {
            newVehicles[id] = data;
            hasNewVehicles = true;
          }
        }

        if (hasNewVehicles) {
          set((state) => ({
            vehicles: {
              ...state.vehicles,
              ...byId,
            },
          }));
        }
      },
      hasVehicle: (id) => !!get().vehicles[id],
    }),
    {
      name: "vehicles",
    }
  )
);
