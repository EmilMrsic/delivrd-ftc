import { backendRequest } from "@/lib/request";
import { useQuery } from "@tanstack/react-query";

export const useVehicles = () => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["vehicles"],
    queryFn: async () => {
      const result = await backendRequest("vehicles");
      return result;
    },
  });

  return { data, isLoading, error, refetch };
};
