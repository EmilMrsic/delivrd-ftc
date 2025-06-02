import { BellIcon } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import Link from "next/link";
import { useNotifications } from "@/hooks/useNotifications";
import { NotificationDataType } from "@/lib/models/notification";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

export const Notifications = () => {
  const { notification, notificationCount, handleBellClick } =
    useNotifications();

  console.log("notifications:", notification);

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
              <NotificationItem
                item={item as unknown as NotificationDataType}
                key={index}
              />
            ))
          ) : (
            <p>No notifications available</p>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const NotificationItem = ({ item }: { item: NotificationDataType }) => {
  const { data, read } = item;
  const { author, negotiation, bid } = data;
  console.log("notification item:", data);

  const markRead = async () => {
    // console.log("test:", item);
    await updateDoc(doc(db, "delivrd_notifications", item.id), {
      read: true,
    });
  };

  if (!negotiation) return null;

  let link = "";
  if (["bid_comment", "new_manual_bid", "new_dealer_bid"].includes(item.type)) {
    link = `/team-profile?id=${negotiation.id}&bid=${bid?.bid_id}`;
  } else if (item.type === "internal_note") {
    link = `/team-profile?id=${negotiation.id}&noteId=${item.data.noteId}`;
  }

  return (
    <Link
      href={link}
      onClickCapture={async () => {
        await markRead();
      }}
    >
      <div className="max-w-[300px] bg-gray-100 rounded-md p-2 cursor-pointer hover:bg-gray-200">
        {!read && (
          <div className="w-full h-full mb-2">
            <div className="w-2.5 h-2.5 bg-red-500 rounded-full mr-0 ml-auto"></div>
          </div>
        )}
        {item.type === "bid_comment" && (
          <>
            <b>{author.name}</b> commented on{" "}
            <>
              <b>{bid.salesPersonName}s</b> bid on the {negotiation.brand}{" "}
              {negotiation.model} for <b>{negotiation.clientNamefull}</b>
            </>
          </>
        )}
        {["new_manual_bid", "new_dealer_bid"].includes(item.type) && (
          <>
            <b>{author.name}</b> {item.type === "new_dealer_bid" && "(dealer)"}{" "}
            uploaded a new bid{" "}
            <>
              on the {negotiation.brand} {negotiation.model} for{" "}
              <b>{negotiation.clientNamefull}</b>
            </>
          </>
        )}
        {item.type === "internal_note" && (
          <>
            <b>{author.name}</b> mentioned you in a note on the{" "}
            {negotiation.brand} {negotiation.model} for{" "}
            <b>{negotiation.clientNamefull}</b>
          </>
        )}
      </div>
    </Link>
  );
};

// (
//   <Link
//     key={index}
//     target="_blank"
//     href={item.link ?? "/"}
//     className="flex flex-col gap-1 p-3 rounded-[8px] items-start hover:bg-gray-200"
//   >
//     <p className="font-bold text-lg">{item.title}</p>
//     <p className="font-normal text-gray-500 text-sm">{item.body}</p>
//   </Link>
// )
