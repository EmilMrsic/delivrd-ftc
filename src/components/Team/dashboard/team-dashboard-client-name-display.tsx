import { TailwindPlusModal } from "@/components/tailwind-plus/modal";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";
import { CircleDollarSign, Logs, Notebook } from "lucide-react";
import { useEffect, useState } from "react";
import AddNoteSection from "../add-note-section";
import { useLoggedInUser } from "@/hooks/useLoggedInUser";
import { ActivityLog, IncomingBid } from "@/types";
import { getActivityLogsByNegotiationId } from "@/lib/utils";
import ActivityLogSection from "../activity-log";
import { getIncomingBids } from "@/lib/helpers/bids";
import { IncomingBidCommentType, IncomingBidType } from "@/lib/models/bids";
import { IncomingBids } from "../profile/incoming-bids";

export const TeamDashboardClientNameDisplay = ({
  deal,
  allDealNegotiator,
}: {
  deal: NegotiationDataType;
  allDealNegotiator: DealNegotiatorType[];
}) => {
  const user = useLoggedInUser();
  const [negotiation, setNegotiation] = useState<NegotiationDataType>(deal);
  const [showModal, setShowModal] = useState<"notes" | "logs" | "bids" | null>(
    null
  );
  const [activityLog, setActivityLog] = useState<ActivityLog | null>(null);
  const [incomingBids, setIncomingBids] = useState<IncomingBidType[] | null>(
    null
  );
  const [bidCommentsById, setBidCommentsById] = useState<
    Record<string, IncomingBidCommentType[]>
  >({});

  useEffect(() => {
    // TODO: this is hacky, would be better to refactor backend to include activity and incoming bids
    if (showModal) {
      if (showModal === "logs" && !activityLog) {
        getActivityLogsByNegotiationId(deal.id).then((log) => {
          setActivityLog(log as ActivityLog);
        });
      }

      if (showModal === "bids" && !incomingBids && deal.incomingBids) {
        getIncomingBids(deal.incomingBids).then((result) => {
          const { bids, commentsById } = result;
          setIncomingBids(bids);
          setBidCommentsById(commentsById);
        });
      }
    }
  }, [showModal]);

  return (
    <>
      <div>
        <div>{deal.clientNamefull}</div>
        <div className="flex gap-2">
          <Notebook
            className="w-4 h-4 text-gray-500 hover:text-black cursor-pointer"
            onClick={() => {
              setShowModal("notes");
            }}
          />
          <Logs
            className="w-4 h-4 text-gray-500 hover:text-black cursor-pointer"
            onClick={() => {
              setShowModal("logs");
            }}
          />
          <CircleDollarSign
            className="w-4 h-4 text-gray-500 hover:text-black cursor-pointer"
            onClick={() => {
              setShowModal("bids");
            }}
          />
        </div>
      </div>
      {showModal && (
        <TailwindPlusModal
          close={() => {
            setShowModal(null);
          }}
          transparent={true}
          width={60}
        >
          {showModal === "notes" && (
            <AddNoteSection
              user={user}
              negotiation={negotiation}
              setNegotiation={setNegotiation}
              allDealNegotiator={allDealNegotiator}
            />
          )}
          {showModal === "logs" && activityLog && (
            <ActivityLogSection activityLog={activityLog} />
          )}
          {showModal === "bids" && incomingBids && (
            <IncomingBids
              incomingBids={incomingBids as IncomingBid[]}
              negotiationId={negotiation.id}
              dealers={allDealNegotiator}
              handleDeleteBid={() => {}}
              handleEdit={() => {}}
              bidCommentsByBidId={bidCommentsById}
              parseComment={(c: string) => c}
              handleSendComment={() => {}}
              setOpenDialog={() => {}}
              setEditingBidId={() => {}}
              setCommentingBidId={() => {}}
              commentingBidId={""}
              // newComment={""}
              setNewComment={() => {}}
              addComment={() => {}}
              handleSave={() => {}}
              openDialog={""}
              newComment={{}}
            />
          )}
        </TailwindPlusModal>
      )}
    </>
  );
};
