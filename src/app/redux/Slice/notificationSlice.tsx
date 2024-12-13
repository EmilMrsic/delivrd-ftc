import { notificationType } from "@/types";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface InitialState {
  notification: notificationType[] | [];
  notificationCount: number;
}

const initialState: InitialState = {
  notification: [],
  notificationCount: 0,
};

export const allNotificationSlice = createSlice({
  name: "notification",
  initialState,
  reducers: {
    setAllNotifications: (state, action: PayloadAction<notificationType>) => {
      state.notification = [...state.notification, action.payload];
    },
    setNotificationCount: (state, action: PayloadAction<number>) => {
      state.notificationCount = action.payload;
    },
  },
});

export const { setAllNotifications, setNotificationCount } =
  allNotificationSlice.actions;

export default allNotificationSlice.reducer;
