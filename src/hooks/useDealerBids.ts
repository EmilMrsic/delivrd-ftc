import { useQuery } from "@tanstack/react-query";
import { useLoggedInUser } from "./useLoggedInUser";

export const useDealerBids = ({ dealerId }: { dealerId: string }) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dealer-bids"],
    queryFn: async () => {
      const res = await fetch(`/api/dealers/${dealerId}/bids`);
      return res.json();
    },
  });

  return {
    bids: data?.bids,
    isLoading,
    error,
  };
};
