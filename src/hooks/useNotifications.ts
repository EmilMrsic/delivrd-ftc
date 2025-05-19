import {
  setAllNotifications,
  setNotificationCount,
} from "@/app/redux/Slice/notificationSlice";
import { useAppSelector } from "@/app/redux/store";
import { useDispatch } from "react-redux";
import { useLoggedInUser } from "./useLoggedInUser";
import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

export const useNotifications = () => {
  const { notification } = useAppSelector((state) => state.notification);
  const { notificationCount } = useAppSelector((state) => state.notification);
  const dispatch = useDispatch();
  const user = useLoggedInUser();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const request = await fetch("/api/notifications", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          auth: user?.id as string,
        },
      });

      const result = await request.json();
      return result;
    },
  });

  const handleBellClick = () => {
    dispatch(setNotificationCount(0));
  };

  useEffect(() => {
    if (data?.notificationData) {
      const count = data.notificationData.filter(
        (notification: any) => !notification.read
      ).length;

      dispatch(setAllNotifications(data.notificationData));
      dispatch(setNotificationCount(count));
    }
  }, [data?.notificationData]);

  return { notification, notificationCount, handleBellClick };
};
