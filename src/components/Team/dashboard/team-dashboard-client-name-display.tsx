import { TailwindPlusModal } from "@/components/tailwind-plus/modal";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";
import { CircleDollarSign, Logs, Notebook } from "lucide-react";
import { useEffect, useState } from "react";
import AddNoteSection from "../add-note-section";
import { useLoggedInUser } from "@/hooks/useLoggedInUser";
import { ActivityLog, DealerData, IncomingBid } from "@/types";
import { getActivityLogsByNegotiationId } from "@/lib/utils";
import ActivityLogSection from "../activity-log";
import { fetchDealers, getIncomingBids } from "@/lib/helpers/bids";
import { IncomingBidCommentType, IncomingBidType } from "@/lib/models/bids";
import { IncomingBids } from "../profile/incoming-bids";
import { DashboardTableActions } from "../dashboard-table-actions";
import { ShippingInfoModule } from "../shipping-info-dialog";
import { TailwindPlusCard } from "@/components/tailwind-plus/card";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { toast } from "@/hooks/use-toast";
import WorkLogSection from "../work-log-section";

export const TeamDashboardClientNameDisplay = ({
  deal,
  allDealNegotiator,
  refetch,
  setStopPropagation,
  currentDeals,
  handleAskForReview,
  negotiatorData,
}: {
  deal: NegotiationDataType;
  allDealNegotiator: DealNegotiatorType[];
  refetch: (id?: string, filters?: any, reset?: boolean) => void;
  setStopPropagation: (item: boolean) => void;
  currentDeals: NegotiationDataType[];
  handleAskForReview: (id: string) => void;
  negotiatorData: DealNegotiatorType;
}) => {
  const user = useLoggedInUser();
  const [negotiation, setNegotiation] = useState<NegotiationDataType>(deal);
  const [showModal, setShowModal] = useState<
    "notes" | "logs" | "bids" | "shipping" | null
  >(null);
  const [activityLog, setActivityLog] = useState<ActivityLog | null>(null);
  const [incomingBids, setIncomingBids] = useState<IncomingBidType[] | null>(
    null
  );
  const [bidCommentsById, setBidCommentsById] = useState<
    Record<string, IncomingBidCommentType[]>
  >({});
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const [dealers, setDealers] = useState<DealerData[]>([]);

  const handleShippingInfoChange = async (newInfo: string) => {
    try {
      if (newInfo) {
        const docRef = doc(db, "delivrd_negotiations", deal.id);
        const updatedDeal = { ...deal, shipping_info: newInfo };

        await updateDoc(docRef, { shippingInfo: newInfo });
        console.log("Shipping info updated!");
        toast({ title: "Shipping info updated" });
        refetch();
      } else {
        toast({ title: "Kindly add new info" });
      }
    } catch (error) {
      console.error("Error updating shipping info:", error);
    }
  };

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
          fetchDealers(bids as IncomingBidType[]).then((result) => {
            setDealers(result as DealerData[]);
          });
          setIncomingBids(bids);
          setBidCommentsById(commentsById);
        });
      }
    }
  }, [showModal]);

  useEffect(() => {
    setNegotiation(deal);
  }, [deal]);

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
          <DashboardTableActions
            id={negotiation.id}
            refetch={refetch}
            setStopPropagation={setStopPropagation}
            deal={deal}
            negotiatorData={negotiatorData}
            // setCurrentDeals={setCurrentDeals}
            currentDeals={currentDeals}
            handleAskForReview={handleAskForReview}
            setShowModal={setShowModal}
            incomingBids={incomingBids}
            setIncomingBids={setIncomingBids}
            dealers={allDealNegotiator}
          />
        </div>
      </div>
      {showModal && (
        <TailwindPlusModal
          close={() => {
            setShowModal(null);
            refetch();
          }}
          transparent={true}
          width={60}
          noClose={showModal === "shipping"}
        >
          {showModal === "notes" && (
            <AddNoteSection
              noUserActions={true}
              user={user}
              negotiation={negotiation}
              setNegotiation={setNegotiation}
              allDealNegotiator={allDealNegotiator}
            />
          )}
          {showModal === "logs" && activityLog && (
            <WorkLogSection
              negotiationId={negotiation.id}
              user={user}
              noActions={true}
            />
            // <ActivityLogSection activityLog={activityLog} />
          )}
          {showModal === "bids" && incomingBids && (
            <IncomingBids
              noUserActions={true}
              incomingBids={incomingBids as IncomingBid[]}
              negotiationId={negotiation.id}
              dealers={dealers}
              setOpenDialog={setOpenDialog}
              openDialog={openDialog}
              handleDeleteBid={() => {}}
              handleEdit={() => {}}
              // @ts-ignore
              bidCommentsByBidId={bidCommentsById}
              parseComment={(c: string) => c}
              handleSendComment={() => {}}
              setEditingBidId={() => {}}
              setCommentingBidId={() => {}}
              commentingBidId={""}
              // newComment={""}
              setNewComment={() => {}}
              addComment={() => {}}
              handleSave={() => {}}
              newComment={{}}
              setIncomingBids={setIncomingBids}
              editingBidId={null}
              editedBid={null}
              setEditedBid={() => {}}
              handleBidFileUpload={() => {}}
              handleDeleteFile={() => {}}
            />
          )}
          {showModal === "shipping" && (
            <ShippingInfoModule
              deal={negotiation}
              handleChange={({ key, newValue }) => {
                setNegotiation({ ...negotiation, [key]: newValue });
              }}
              close={() => {
                setShowModal(null);
                refetch();
              }}
              onBlur={() => {
                handleShippingInfoChange(negotiation.shippingInfo);
              }}
            />
          )}
        </TailwindPlusModal>
      )}
    </>
  );
};
