import { backendRequest } from "@/lib/request";
import { useQuery } from "@tanstack/react-query";

export const useDealers = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: ["dealers"],
    queryFn: () => {
      const request = backendRequest("dealers", "POST", {});
      return request;
    },
  });

  console.log("dealer data:", data);

  return {};
};
