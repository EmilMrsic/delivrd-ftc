import { TailwindPlusCard } from "@/components/tailwind-plus/card";
import { DealNegotiatorType } from "@/lib/models/team";
import { BidComments, IncomingBid } from "@/types";
import { FileText } from "lucide-react";
import ManualBidUpload from "../Manual-bid-upload-modal";
import { IncomingBidCard } from "./incoming-bid";

export const IncomingBids = ({
  incomingBids,
  negotiationId,
  dealers,
  handleDeleteBid,
  handleEdit,
  handleSave,
  openDialog,
  setOpenDialog,
  setEditingBidId,
  setCommentingBidId,
  commentingBidId,
  newComment,
  setNewComment,
  addComment,
  bidCommentsByBidId,
  parseComment,
  handleSendComment,
  noUserActions = false,
}: {
  incomingBids: IncomingBid[];
  negotiationId: string;
  dealers: DealNegotiatorType[];
  handleDeleteBid: (bidId: string) => void;
  handleEdit: (bid: any) => void;
  handleSave: (bidId: string) => void;
  openDialog: string | null;
  setOpenDialog: (openDialog: string | null) => void;
  setEditingBidId: (editingBidId: string | null) => void;
  setCommentingBidId: (commentingBidId: string | null) => void;
  commentingBidId: string | null;
  newComment: { [key: string]: string };
  setNewComment: (newComment: { [key: string]: string }) => void;
  addComment: (bidId: string) => void;
  bidCommentsByBidId: { [key: string]: BidComments[] };
  parseComment: (comment: string) => React.ReactNode;
  handleSendComment: (data: BidComments) => void;
  noUserActions?: boolean;
}) => {
  return (
    <TailwindPlusCard
      title="Incoming Bids"
      icon={FileText}
      actions={() => {
        if (noUserActions) return null;
        return <ManualBidUpload id={negotiationId} />;
      }}
    >
      <div className="space-y-8">
        {incomingBids.length ? (
          incomingBids
            ?.filter((bid) => !bid?.delete)
            .sort((a, b) => {
              if (a.client_offer === "accepted") return -1;
              if (b.client_offer === "accepted") return 1;
              const dateA = new Date(a?.timestamp || 0).getTime();
              const dateB = new Date(b?.timestamp || 0).getTime();
              return dateB - dateA; // Newest bids first
            })
            .map((bidDetails, index) => (
              <IncomingBidCard
                noUserActions={noUserActions}
                bidDetails={bidDetails}
                dealers={dealers}
                incomingBids={incomingBids}
                setEditingBidId={setEditingBidId}
                setOpenDialog={setOpenDialog}
                index={index}
                handleDeleteBid={handleDeleteBid}
                setCommentingBidId={setCommentingBidId}
                commentingBidId={commentingBidId}
                newComment={newComment}
                setNewComment={setNewComment}
                addComment={addComment}
                bidCommentsByBidId={bidCommentsByBidId}
                parseComment={parseComment}
                openDialog={openDialog}
                handleSendComment={handleSendComment}
                handleSave={handleSave}
                handleEdit={handleEdit}
              />
            ))
        ) : (
          <p>No incoming bids available</p>
        )}
      </div>
    </TailwindPlusCard>
  );
};
