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
      mergeInVehicles: (byId) =>
        set((state) => ({
          vehicles: {
            ...state.vehicles,
            ...byId,
          },
        })),
      hasVehicle: (id) => !!get().vehicles[id],
    }),
    {
      name: "vehicles",
    }
  )
);
