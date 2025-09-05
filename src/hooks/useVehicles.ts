import { ClientDataType } from "@/lib/models/client";
import { backendRequest } from "@/lib/request";
import { useVehiclesStore } from "@/lib/state/vehicles";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export const useVehicles = () => {
  const vehiclesFromStore = useVehiclesStore((state) => state.vehicles);
  const mergeInVehicles = useVehiclesStore((state) => state.mergeInVehicles);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const result = await backendRequest("vehicles");

      if (result.clients) {
        mergeInVehicles(result.clients);
      }

      result.clients;
      return result;
    },
  });

  const vehicles = useMemo(() => {
    return {
      clients:
        Object.entries(vehiclesFromStore).map(([id, client]) => {
          const typedClient: ClientDataType & {
            bidNum: number;
            trade: boolean;
          } = client;

          return { ...client };
        }) ||
        data?.clients ||
        [],
    };
  }, [vehiclesFromStore]);

  return {
    data: vehicles,
    isLoading,
    error,
    refetch,
  };
};
