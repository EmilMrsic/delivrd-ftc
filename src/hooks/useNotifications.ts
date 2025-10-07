import {
  setAllNotifications,
  setNotificationCount,
} from "@/app/redux/Slice/notificationSlice";
import { useAppSelector } from "@/app/redux/store";
import { useDispatch } from "react-redux";
import { useLoggedInUser } from "./useLoggedInUser";
import { useQuery } from "@tanstack/react-query";
import { use, useEffect } from "react";
import { useNotificationsState } from "@/lib/state/notifications";

export const useNotifications = () => {
  const lastPolledTime = useNotificationsState((state) => state.lastPolledTime);
  const setLastPolledTime = useNotificationsState(
    (state) => state.setLastPolledTime
  );
  const setNotifications = useNotificationsState(
    (state) => state.setNotifications
  );
  const notifications = useNotificationsState((state) => state.notifications);
  const setNotificationCount = useNotificationsState(
    (state) => state.setNotificationCount
  );
  const pruneNotifications = useNotificationsState(
    (state) => state.pruneNotifications
  );

  // const { notification } = useAppSelector((state) => state.notification);
  // const { notificationCount } = useAppSelector((state) => state.notification);
  const dispatch = useDispatch();
  const user = useLoggedInUser();

  const { data, isLoading } = useQuery({
    queryKey: ["notifications", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const request = await fetch("/api/notifications", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          auth: user?.id as string,
        },
        body: JSON.stringify({ lastPolledTime }),
      });

      const result = await request.json();
      setLastPolledTime(Date.now());
      return result;
    },
    refetchInterval: 5000,
  });

  const handleBellClick = () => {
    setNotificationCount(0);
  };

  useEffect(() => {
    if (data?.notificationData) {
      if (!data?.notificationData.length) {
        pruneNotifications();
      } else {
        const finalNotificationsList = notifications.concat(
          data.notificationData
        );
        setNotifications(finalNotificationsList);
        const count = finalNotificationsList.filter(
          (notification: any) => !notification.read
        ).length;
        setNotificationCount(count);
      }
    }
  }, [data?.notificationData]);

  return {
    handleBellClick,
  };
};
