import { backendRequest } from "@/lib/request";
import { useQuery } from "@tanstack/react-query";

export const useNegotiationBids = ({
  negotiationId,
}: {
  negotiationId: string;
}) => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["client-bids"],
    queryFn: async () => {
      const response = await backendRequest(
        `negotiation/${negotiationId}/bids`,
        "GET"
      );
      console.log("response:", negotiationId, response);
      return response;
    },
  });

  return { data, isLoading, error };
};
