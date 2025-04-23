import { TailwindPlusCard } from "@/components/tailwind-plus/card";
import { DealNegotiatorType } from "@/lib/models/team";
import { BidComments, DealerData, IncomingBid } from "@/types";
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
  setIncomingBids,
  setDealers,
  editingBidId,
  editedBid,
  setEditedBid,
  clientMode,
  handleBidFileUpload,
  handleDeleteFile,
}: {
  incomingBids: IncomingBid[];
  setIncomingBids: (item: IncomingBid[]) => void;
  negotiationId: string;
  dealers: DealerData[];
  setDealers?: (item: DealerData[]) => void;
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
  editingBidId: string | null;
  editedBid: any | null;
  setEditedBid: (editedBid: any | null) => void;
  clientMode?: boolean;
  handleBidFileUpload: (files: FileList, bidId: string) => void;
  handleDeleteFile: (file: string, bidId: string) => void;
}) => {
  return (
    <TailwindPlusCard
      title="Incoming Bids"
      icon={FileText}
      actions={() => {
        if (noUserActions || clientMode) return null;
        return (
          <ManualBidUpload
            dealers={dealers}
            setDealers={setDealers}
            setIncomingBids={setIncomingBids}
            incomingBids={incomingBids}
            id={negotiationId}
          />
        );
      }}
    >
      <div className="space-y-8">
        {incomingBids.length ? (
          incomingBids
            ?.filter((bid) => !bid?.delete)
            .sort((a, b) => {
              if (a.client_offer === "accepted") return -1;
              if (b.client_offer === "accepted") return 1;
              if (a.accept_offer) return -1;
              if (b.accept_offer) return 1;
              const dateA = new Date(a?.timestamp || 0).getTime();
              const dateB = new Date(b?.timestamp || 0).getTime();
              return dateB - dateA; // Newest bids first
            })
            .map((bidDetails, index) => (
              <IncomingBidCard
                negotiationId={negotiationId}
                noUserActions={noUserActions}
                setIncomingBids={setIncomingBids}
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
                editingBidId={editingBidId}
                editedBid={editedBid}
                setEditedBid={setEditedBid}
                clientMode={clientMode}
                handleBidFileUpload={handleBidFileUpload}
                handleDeleteFile={handleDeleteFile}
              />
            ))
        ) : (
          <p>No incoming bids available</p>
        )}
      </div>
    </TailwindPlusCard>
  );
};
