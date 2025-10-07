import { NotificationsState } from "@/types/state";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { NotificationDataType } from "../models/notification";
import { idbStorage } from "../helpers/state";

export const useNotificationsState = create<NotificationsState>()(
  persist(
    (set, get) => ({
      lastPolledTime: null,
      setLastPolledTime: (time: number) => set({ lastPolledTime: time }),
      notifications: [],
      setNotifications: (notifications: NotificationDataType[]) =>
        set({ notifications }),
      notificationCount: 0,
      setNotificationCount: (count: number) =>
        set({ notificationCount: count }),
    }),
    { name: "notifications", storage: createJSONStorage(() => idbStorage) }
  )
);
