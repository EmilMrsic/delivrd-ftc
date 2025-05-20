import { useAppSelector } from "@/app/redux/store";
import { getUserData } from "@/lib/user";
import { useQuery } from "@tanstack/react-query";

export const useLoggedInUser = () => {
  const { data } = useQuery({
    queryKey: ["loggedInUser"],
    queryFn: async () => {
      const user = await getUserData();
      return user;
    },
  });

  console.log("user data:", data);

  return data;
};
