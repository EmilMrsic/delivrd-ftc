import { setNotificationCount } from "@/app/redux/Slice/notificationSlice";
import { useAppSelector } from "@/app/redux/store";
import { useDispatch } from "react-redux";

export const useNotifications = () => {
  const { notification } = useAppSelector((state) => state.notification);
  const { notificationCount } = useAppSelector((state) => state.notification);
  const dispatch = useDispatch();

  const handleBellClick = () => {
    dispatch(setNotificationCount(0));
  };

  return { notification, notificationCount, handleBellClick };
};
