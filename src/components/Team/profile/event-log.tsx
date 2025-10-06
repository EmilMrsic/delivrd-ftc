import { TailwindPlusCard } from "@/components/tailwind-plus/card";
import { db } from "@/firebase/config";
import { useQuery } from "@tanstack/react-query";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { FileText } from "lucide-react";

const eventTypeToVerbiage: { [key: string]: string } = {
  incoming_bid: "placed a bid",
  bid_accepted: "accepted a bid",
  bid_cancelled: "cancelled a bid",
  bid_deleted: "deleted a bid",
  work_log: "added to the work log",
  bid_comment: "added a bid comment",
  message_sent: "sent a message",
};

export const EventLog = ({ negotiationId }: { negotiationId: string }) => {
  const { data, isLoading } = useQuery({
    queryKey: ["event-log", negotiationId],
    queryFn: async () => {
      const activityTable = collection(
        db,
        `delivrd_negotiations/${negotiationId}/activity`
      );
      const result = await getDocs(query(activityTable, orderBy("at", "desc")));
      return result.docs.map((doc) => doc.data());
    },
  });

  if (isLoading) return <></>;

  return (
    <TailwindPlusCard title="Event Log" icon={FileText}>
      {data && data.length > 0 && (
        <ul className="space-y-4 h-[250px] overflow-y-auto pr-2">
          {data.map((event, idx) => {
            return (
              <li key={idx}>
                {event.at.toDate().toLocaleString()}{" "}
                <b>{event.actor_name || "unknown"} </b>
                {eventTypeToVerbiage[event.type] ||
                  `performed an action ${event.type}`}{" "}
              </li>
            );
          })}
        </ul>
      )}
    </TailwindPlusCard>
  );
};
