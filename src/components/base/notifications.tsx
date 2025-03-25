import { BellIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import Link from "next/link";
import { useNotifications } from "@/hooks/useNotifications";

export const Notifications = () => {
  const { notification, notificationCount, handleBellClick } =
    useNotifications();

  return (
    <DropdownMenu onOpenChange={handleBellClick}>
      <DropdownMenuTrigger>
        <div className="relative">
          <BellIcon className="w-6 h-6" color="#fff" />
          {notificationCount > 0 && (
            <div className="absolute top-[-5px] right-[-5px] flex justify-center items-center w-4 h-4 bg-red-500 text-white text-xs rounded-full">
              {notificationCount}
            </div>
          )}
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent className="z-50 ">
        <div
          className={`bg-white flex flex-col ${
            notification.length ? "max-h-[300px]" : "h-auto"
          }  overflow-y-scroll gap-3 p-2 z-10 rounded-xl`}
        >
          {notification.length ? (
            notification.map((item, index) => (
              <Link
                key={index}
                target="_blank"
                href={item.link ?? "/"}
                className="flex flex-col gap-1 p-3 rounded-[8px] items-start hover:bg-gray-200"
              >
                <p className="font-bold text-lg">{item.title}</p>
                <p className="font-normal text-gray-500 text-sm">{item.body}</p>
              </Link>
            ))
          ) : (
            <p>No notifications available</p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
