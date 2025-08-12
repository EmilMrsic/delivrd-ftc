import { useQuery } from "@tanstack/react-query";
import { useLoggedInUser } from "./useLoggedInUser";
import { backendRequest } from "@/lib/request";

export const useDealerBids = ({ dealerId }: { dealerId: string }) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["dealer-bids", dealerId],
    queryFn: async () => {
      const res = await backendRequest(`dealers/${dealerId}/bids`);
      return res;
    },
  });

  return {
    bids: data?.bids,
    isLoading,
    error,
    refetch,
  };
};
