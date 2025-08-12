import { backendRequest } from "@/lib/request";
import { useQuery } from "@tanstack/react-query";

export const useNegotiationBids = ({
  negotiationId,
}: {
  negotiationId: string;
}) => {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["client-bids"],
    queryFn: async () => {
      const response = await backendRequest(
        `negotiation/${negotiationId}/bids`,
        "GET"
      );
      return response;
    },
  });

  return { data, isLoading, error, refetch };
};
