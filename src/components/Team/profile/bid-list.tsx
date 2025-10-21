import { ModalForm } from "@/components/tailwind-plus/modal-form";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/firebase/config";
import { toast } from "@/hooks/use-toast";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useLoggedInUser } from "@/hooks/useLoggedInUser";
import { ArchivedStatuses } from "@/lib/constants/negotiations";
import { cacheBidTypeCounts } from "@/lib/helpers/bids";
import { handleSendComment } from "@/lib/helpers/comments";
import { logClientEvent } from "@/lib/helpers/events";
import { uploadFile } from "@/lib/helpers/files";
import { createNotification } from "@/lib/helpers/notifications";
import { IncomingBidCommentType, IncomingBidType } from "@/lib/models/bids";
import { DealerDataType } from "@/lib/models/dealer";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";
import { backendRequest, callZapier, callZapierWebhook } from "@/lib/request";
import {
  cn,
  formatDate,
  getCurrentTimestamp,
  updateBidInFirebase,
} from "@/lib/utils";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import {
  FileText,
  Pencil,
  Plus,
  Save,
  ThumbsDown,
  ThumbsUp,
  Trash,
  Upload,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

/** replacement for <IncomingBids /> without being tightly coupled to the client profile and standard incoming bid type */
export const BidList = ({
  bids,
  noUserActions,
  clientMode,
  negotiation,
  dealCoordinator,
  mode,
  offersInfo,
  refetch,
}: {
  bids: (IncomingBidType & { bidDealer: DealerDataType })[];
  noUserActions: boolean;
  clientMode: boolean;
  negotiation: NegotiationDataType;
  dealCoordinator: DealNegotiatorType;
  mode: "bids" | "tradeIns";
  offersInfo: {
    hasAcceptedOffer: boolean;
    hasAcceptedBid: boolean;
  };
  refetch: () => void;
}) => {
  const user = useLoggedInUser();
  const sortedBids = [...bids]
    ?.filter((bid) => !bid?.delete)
    .sort((a, b) => {
      if (a.client_offer === "accepted") return -1;
      if (b.client_offer === "accepted") return 1;
      if (a.accept_offer) return -1;
      if (b.accept_offer) return 1;
      // @ts-ignore
      const dateA = new Date(a?.timestamp || 0).getTime();
      // @ts-ignore
      const dateB = new Date(b?.timestamp || 0).getTime();
      return dateB - dateA; // Newest bids first
    });
  const { hasAcceptedOffer, hasAcceptedBid } = offersInfo;

  return (
    <div className="space-y-8">
      {sortedBids.map((bid, idx) => (
        <BidCard
          negotiation={negotiation}
          bid={bid}
          hasAcceptedBid={hasAcceptedBid}
          hasAcceptedOffer={!!hasAcceptedOffer}
          key={idx}
          noUserActions={noUserActions}
          clientMode={clientMode}
          dealCoordinator={dealCoordinator}
          user={user}
          mode={mode}
          refetch={refetch}
        />
      ))}
    </div>
  );
};

export const BidCard = ({
  bid: incomingBid,
  hasAcceptedBid,
  hasAcceptedOffer,
  noUserActions,
  clientMode,
  negotiation,
  dealCoordinator,
  user,
  mode,
  refetch,
}: {
  bid: IncomingBidType & { bidDealer: DealerDataType };
  hasAcceptedBid: boolean;
  hasAcceptedOffer: boolean;
  noUserActions: boolean;
  clientMode: boolean;
  negotiation: NegotiationDataType;
  dealCoordinator: DealNegotiatorType;
  user: any;
  mode: "bids" | "tradeIns";
  refetch: () => void;
}) => {
  const [bid, setBid] = useState<
    IncomingBidType & { bidDealer: DealerDataType }
  >(incomingBid);
  const [connectClientAndDealer, setConnectClientAndDealer] = useState(false);
  const [notifyFTC, setNotifyFTC] = useState(false);
  const [commentForm, setCommenForm] = useState<boolean>(false);
  const isManualBid = bid.bid_source === "Manual";
  const bidVerified = isManualBid || bid.verified;
  const isAcceptedBid = bid.accept_offer === true;
  const isDisabled = hasAcceptedBid && !isAcceptedBid;
  const isMobile = useIsMobile();

  const defaultValues = useMemo(() => {
    return {
      name: negotiation?.clientNamefull,
      email: negotiation?.clientEmail,
      phone: negotiation?.clientPhone,
      address: `${negotiation?.address}, ${negotiation?.city}, ${negotiation?.state} ${negotiation?.zip}`,
    };
  }, [negotiation]);

  const handleAcceptOffer = async () => {
    try {
      const bidCollectionRef = collection(db, "Incoming Bids");
      const q = query(bidCollectionRef, where("bid_id", "==", bid.bid_id));
      const querySnapshot = await getDocs(q);
      const bidRef = querySnapshot.docs[0].ref;
      await updateDoc(bidRef, { accept_offer: true, vote: "like" });

      const updatedBid = {
        ...bid,
        accept_offer: true,
      };
      setBid(updatedBid);
      const response = await fetch(
        process.env.NEXT_PUBLIC_ACCEPT_OFFER_URL ?? "",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedBid),
        }
      );

      const result = await response.json();
      await logClientEvent<{
        bidId: string;
        dealer: string;
      }>("bid_accepted", negotiation.id, {
        bidId: bid.bid_id as string,
        dealer: bid.bidDealer?.Dealership || "Unknown Dealer",
      });
      if (result.success) {
        toast({ title: "Offer accepted", variant: "default" });
        refetch?.();
      } else {
        console.error("Failed to accept offer:", result.error);
        toast({
          title: "Failed to accept offer",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error accepting offer:", error);
    }
  };

  const handleCancelOffer = async () => {
    try {
      const bidRef = doc(db, "Incoming Bids", bid.bid_id as string);
      await updateDoc(bidRef, { accept_offer: false, vote: "neutral" });
      setBid({ ...bid, accept_offer: false, vote: "neutral" });
      await logClientEvent<{
        bidId: string;
        dealer: string;
      }>("bid_cancelled", negotiation.id, {
        bidId: bid.bid_id as string,
        dealer: bid?.bidDealer?.Dealership || "Unknown Dealer",
      });

      refetch?.();

      toast({ title: "Offer canceled" });
    } catch (error) {
      console.error("Error accepting offer:", error);
    }
  };

  const handleVerifyBid = async () => {
    const q = query(
      collection(db, "Incoming Bids"),
      where("bid_id", "==", bid.bid_id)
    );
    const querySnapshot = await getDocs(q);
    const bidRef = querySnapshot.docs[0].ref;
    await updateDoc(bidRef, { verified: !bid.verified });
    setBid({ ...bid, verified: !bid.verified });

    toast({ title: "Bid verified" });
  };

  return (
    <>
      <div
        id={`bid_${bid.bid_id}`}
        key={bid.bid_id}
        className={`border-l-4 pl-4 pr-2 pb-6 pt-2 
        ${isDisabled ? "opacity-45 pointer-events-none" : ""}

    ${
      hasAcceptedOffer && bid.client_offer !== "accepted" ? "opacity-45" : ""
    } ${
          bid.vote && bid.vote === "like"
            ? "bg-green-100 border-green-600 "
            : bid.vote === "dislike"
            ? "bg-orange-100 border-orange-600"
            : "bg-white border-blue-600"
        }`}
      >
        <div
          className={cn(
            `justify-between items-center mb-2`,
            !isMobile && "flex"
          )}
        >
          <h3
            className={cn(
              `text-lg font-semibold text-[#202125]`,
              isMobile && "text-center mb-2"
            )}
          >
            {bid.dealerName ? `${bid.dealerName} Offer` : "No Dealership"}

            <span
              className={cn(
                `px-2 py-1 text-sm font-medium text-white rounded-full ml-2`,
                bidVerified ? "bg-green-600" : "bg-red-500",
                isMobile && "block text-center"
              )}
            >
              {!bidVerified
                ? "Under Review By The Delivrd Team"
                : "Verified By The Delivrd Team"}
            </span>
          </h3>
          <div className={cn(`items-center gap-3`, isMobile && "mt-4")}>
            <div className="flex">
              {!(noUserActions || clientMode) && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent opening the dialog
                      //handleDeleteBid(bid.bid_id);
                    }}
                    className="text-black rounded-full p-2"
                  >
                    <Trash className="w-5 h-5" />
                  </button>
                  <BidVoteCard
                    clientMode={clientMode}
                    bid={bid}
                    setBid={setBid}
                  />
                  {bid.accept_offer ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCancelOffer()}
                      className={
                        "bg-red-700 text-white hover:text-white hover:bg-red-700 hover:opacity-80"
                      }
                    >
                      Cancel Offer
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleAcceptOffer()}
                      className={"bg-white text-black"}
                    >
                      Accept Offer
                    </Button>
                  )}
                </>
              )}
              {clientMode && (
                <BidVoteCard
                  clientMode={clientMode}
                  bid={bid}
                  setBid={setBid}
                />
              )}
              {/* {allowUndelete && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => restoreBid()}
                >
                  Restore
                </Button>
              )} */}
            </div>
            {bid.bid_source === "FTC" && (
              <div className="w-fit mr-0 ml-auto mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  className={cn(
                    bid.verified
                      ? `bg-white text-black`
                      : `bg-green-500 text-white`
                  )}
                  onClick={() => handleVerifyBid()}
                >
                  {bid.verified ? "Remove Verification" : "Verify Bid"}
                </Button>
              </div>
            )}
          </div>
        </div>
        <time className="block mb-2 text-sm text-[#202125]">
          {formatDate(bid?.timestamp as string)}
        </time>
        <p className="text-[#202125] mb-4">
          Price: ${bid?.price ? bid?.price : "No price available"}
        </p>
        <div className={cn(`flex space-x-2 mb-4`, isMobile && "flex-wrap")}>
          {/* <BidDetailsDialog
          openDialog={openDialog}
          setEditingBidId={setEditingBidId}
          setOpenDialog={setOpenDialog}
          bidDetails={bidDetails}
          matchingDealer={matchingDealer}
          editingBidId={editingBidId}
          handleSave={handleSave}
          handleEdit={handleEdit}
          handleDeleteFile={handleDeleteFile}
          handleBidFileUpload={handleBidFileUpload}
          editedBid={editedBid}
          setEditedBid={setEditedBid}
          parseComment={parseComment}
          clientMode={clientMode}
        /> */}
          <ViewOfferDialog
            bid={bid}
            clientMode={clientMode}
            setBid={setBid}
            negotiation={negotiation}
            mode={mode}
          />
          {clientMode && (
            <>
              {bid.accept_offer ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancelOffer()}
                  className={
                    "bg-red-700 text-white hover:text-white hover:bg-red-700 hover:opacity-80"
                  }
                >
                  Cancel Offer
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleAcceptOffer()}
                  className={"bg-transparent text-black"}
                >
                  Accept Offer
                </Button>
              )}
            </>
          )}
          {!noUserActions && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCommenForm(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Comment
              </Button>
              {!clientMode && bid.accept_offer && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setConnectClientAndDealer(true);
                    }}
                  >
                    Connect Client + Dealer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setNotifyFTC(true);
                    }}
                  >
                    Notify FTC
                  </Button>
                </>
              )}
            </>
          )}
        </div>
        {commentForm && (
          <BidCommentForm
            bid={bid}
            negotiation={negotiation}
            dealCoordinator={dealCoordinator}
            setBid={setBid}
            user={user}
          />
        )}
        <BidComments
          bid={bid}
          clientMode={clientMode}
          noUserActions={noUserActions}
          user={user}
        />
      </div>
      {connectClientAndDealer && (
        <ModalForm
          height={60}
          onClose={() => {
            setConnectClientAndDealer(false);
          }}
          title="🤝 Connect Client & Dealer"
          submitButtonLabel="Connect Dealer & Client"
          onSubmit={async (values) => {
            const webhookData = {
              event: "connect_client_and_dealer",
              client: {
                id: negotiation?.userId,
                name: values.name,
                email: values.email,
                phone: values.phone,
                address: values.address,
              },
              dealer: {
                id: bid.bidDealer?.id,
                name: bid.bidDealer?.SalesPersonName,
                dealership: bid.bidDealer?.Dealership,
                email: values.dealerEmail,
                phone: values.dealerPhone,
              },
              custom_message: values.message || "",
            };

            await callZapier(
              process.env.NEXT_PUBLIC_CONNECT_CLIENT_DEALER_FUNC_URL ?? "",
              webhookData
            );

            setConnectClientAndDealer(false);

            toast({
              title: "Dealer & Client Connected",
              description: "Dealer & Client Connected",
            });
          }}
          fields={[
            [
              {
                label: "Name",
                name: "name",
                defaultValue: defaultValues.name,
              },
              {
                label: "Email",
                name: "email",
                defaultValue: defaultValues.email,
              },
            ],
            [
              {
                label: "Phone",
                name: "phone",
                defaultValue: defaultValues.phone,
              },
              {
                name: "address",
                label: "Address",
                defaultValue: defaultValues.address,
              },
            ],
            [
              {
                label: "Dealers Phone Number",
                name: "dealerPhone",
                defaultValue: bid.bidDealer?.SalesPersonPhone,
              },
              {
                label: "Dealers Email",
                name: "dealerEmail",
                defaultValue: bid.bidDealer?.YourEmail,
              },
            ],
            {
              name: "message",
              type: "textarea",
              defaultValue: `Hi ${negotiation?.clientFirstName}, this is ${bid.bidDealer?.SalesPersonName} with ${bid.bidDealer?.Dealership} wanted to connect you two. `,
            },
          ]}
        />
      )}
      {notifyFTC && (
        <ModalForm
          title="Winning Bid Details for FTC Dealers"
          onClose={() => {
            setNotifyFTC(false);
          }}
          fields={[
            [
              { label: "Price", name: "price", defaultValue: bid.price },
              {
                label: "Discount",
                name: "discount",
                defaultValue: bid.discountPrice,
              },
            ],
            [{ label: "Comments", name: "comments", type: "textarea" }],
          ]}
          onSubmit={async (values) => {
            const request = await backendRequest(
              "/email/notifyFTCOfBidClosure",
              "POST",
              {
                ...values,
                negotiationId: negotiation.id,
                dealerName: bid.bidDealer?.SalesPersonName,
                make: negotiation?.brand,
                model: negotiation?.model,
                bidId: bid.bid_id,
              }
            );
            setNotifyFTC(false);
          }}
          submitButtonLabel="Notify FTC List"
        />
      )}
    </>
  );
};

export const BidCommentForm = ({
  bid,
  negotiation,
  dealCoordinator,
  setBid,
  user,
}: {
  bid: IncomingBidType & { bidDealer: DealerDataType };
  negotiation: NegotiationDataType;
  dealCoordinator: DealNegotiatorType;
  setBid: (bid: IncomingBidType & { bidDealer: DealerDataType }) => void;
  user: any;
}) => {
  const [comment, setComment] = useState<string>("");

  const handleAddComment = async () => {
    const useableComment = comment.trim();
    if (!bid.bid_id || !useableComment) return;
    const bidComments = bid.bidComments ?? [];

    const newCommentData: IncomingBidCommentType = {
      author: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        profile_pic: user.profile_pic,
      },
      client_phone_number: negotiation?.clientPhone ?? "",
      bid_id: bid.bid_id,
      client: negotiation?.clientNamefull ?? "",
      client_id: negotiation?.userId ?? "",
      client_name: negotiation?.clientNamefull ?? "",
      comment: useableComment,
      source: user.privilege === "Client" ? "Client" : "Team",
      deal_coordinator: negotiation?.dealCoordinatorId ?? "",
      deal_coordinator_name: dealCoordinator?.name,
      link_status: "Active",
      negotiation_id: negotiation.id,
      time: getCurrentTimestamp(),
    };

    bidComments.push(newCommentData);
    setBid({ ...bid, bidComments });

    const commentRef = collection(db, "bid comment");
    await addDoc(commentRef, newCommentData);

    if (user.privilege === "Client") {
      handleSendComment(user, newCommentData);
    }

    if (dealCoordinator?.id) {
      await createNotification(dealCoordinator?.id, "bid_comment", {
        bidId: bid.bid_id,
        negotiationId: negotiation.id,
        author: user.id,
      });
    }

    toast({ title: "Comment added successfully" });
  };

  return (
    <div className="mb-4">
      <Textarea
        placeholder="Add a comment..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="mb-2"
      />
      <Button onClick={handleAddComment}>Submit Comment</Button>
    </div>
  );
};

export const BidComments = ({
  bid,
  clientMode,
  noUserActions,
  user,
}: {
  bid: IncomingBidType & { bidDealer: DealerDataType };
  clientMode: boolean;
  noUserActions: boolean;
  user: any;
}) => {
  return (
    <>
      {bid.bidComments?.length && bid.bidComments.length > 0 ? (
        <>
          {bid.bidComments.map((comment, idx) => (
            <BidComment
              key={idx}
              comment={comment}
              clientMode={clientMode}
              noUserActions={noUserActions}
              user={user}
            />
          ))}
        </>
      ) : (
        <p className="text-sm text-gray-500">
          No comments available for this bid.
        </p>
      )}
    </>
  );
};

export const BidComment = ({
  comment,
  clientMode,
  noUserActions,
  user,
}: {
  comment: IncomingBidCommentType;
  clientMode: boolean;
  noUserActions: boolean;
  user: any;
}) => {
  const isMobile = useIsMobile();

  return (
    <div
      className={cn(
        "bg-gray-100 mb-2 rounded pr-2 items-center justify-between",
        !isMobile && "flex "
      )}
    >
      <div className="p-2 flex flex-col  mt-1">
        <p>
          <strong className={cn(isMobile && "block")}>
            {comment?.author?.name
              ? comment?.author?.name
              : comment.deal_coordinator_name === "N/A"
              ? comment.client_name
              : comment.deal_coordinator_name}
            :
          </strong>{" "}
          {parseComment(comment.comment)}
        </p>
        <p className="text-sm text-gray-500">{comment.time}</p>
      </div>
      {!clientMode && (
        <>
          {comment.deal_coordinator_name === "N/A" ? (
            <p className="pr-2">From Client</p>
          ) : (
            !noUserActions && (
              <Button
                variant="outline"
                className={cn("border-black", isMobile && "w-fit mr-0 ml-auto")}
                onClick={() => handleSendComment(user, comment)}
              >
                Send To Client
              </Button>
            )
          )}
        </>
      )}
    </div>
  );
};

export const BidVoteCard = ({
  clientMode,
  bid,
  setBid,
}: {
  clientMode: boolean;
  bid: IncomingBidType & { bidDealer: DealerDataType };
  setBid: (bid: IncomingBidType & { bidDealer: DealerDataType }) => void;
}) => {
  const isMobile = useIsMobile();
  const handleVote = async (direction: "like" | "dislike") => {
    try {
      let currentVote = bid.vote;
      const voteType = direction === currentVote ? "neutral" : direction;

      setBid({ ...bid, vote: voteType });

      const bidQuery = await getDocs(
        query(
          collection(db, "Incoming Bids"),
          where("bid_id", "==", bid.bid_id)
        )
      );
      const bidRef = bidQuery.docs[0].ref;

      await setDoc(
        bidRef,
        {
          vote: voteType,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      voteType === "like"
        ? toast({ title: "Bid liked successfully" })
        : voteType === "dislike"
        ? toast({ title: "Bid disliked successfully" })
        : toast({ title: "Reaction removed successfully" });
    } catch (error) {
      console.error("Error updating vote in database:", error);
    }
  };

  return (
    <div className={cn(`flex space-x-2`)}>
      {!(clientMode || (clientMode && bid.vote === "like")) && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (!clientMode) {
              handleVote("like");
            }
          }}
          className={
            bid.vote && bid.vote === "like" ? "bg-green-500 text-white" : ""
          }
          disabled={clientMode}
        >
          <ThumbsUp className="h-4 w-4" />
        </Button>
      )}
      {!clientMode && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleVote("dislike")}
          className={
            bid.vote && bid.vote === "dislike" ? "bg-yellow-500 text-white" : ""
          }
        >
          <ThumbsDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export const ViewOfferDialog = ({
  bid,
  clientMode,
  setBid,
  negotiation,
  mode,
}: {
  bid: IncomingBidType & { bidDealer: DealerDataType };
  clientMode: boolean;
  setBid: (bid: IncomingBidType & { bidDealer: DealerDataType }) => void;
  negotiation: NegotiationDataType;
  mode: "bids" | "tradeIns";
}) => {
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedBid, setEditedBid] = useState<
    IncomingBidType & { bidDealer: DealerDataType }
  >(bid);

  const handleSave = async () => {
    setBid({
      ...bid,
      ...editedBid,
      price: Number(editedBid.price),
      discountPrice: String(editedBid.discountPrice),
    });
    const useableUpdateObject: any = {};
    ["discountPrice", "inventoryStatus", "price", "files"].forEach((key) => {
      if (editedBid[key as keyof typeof editedBid]) {
        useableUpdateObject[key] = editedBid[key as keyof typeof editedBid];
      }
    });
    await updateBidInFirebase(bid.bid_id as string, useableUpdateObject as any);
    await cacheBidTypeCounts(
      negotiation?.id,
      ArchivedStatuses.includes(negotiation?.stage)
    );

    // {
    //   discountPrice: editedBid.discountPrice as string,
    //   inventoryStatus: editedBid.inventoryStatus,
    //   price: Number(editedBid.price),
    //   files: editedBid.files,
    // }
    setEditing(false);
    toast({ title: "Bid Updated successfully" });
  };

  const handleDeleteFile = (fileToDelete: string) => {
    setEditedBid((prevEditedBid) => ({
      ...prevEditedBid,
      files: prevEditedBid.files?.filter((file) => file !== fileToDelete),
    }));

    updateBidInFirebase(bid.bid_id as string, {
      files: editedBid.files?.filter((file) => file !== fileToDelete),
    }).then(() => {
      cacheBidTypeCounts(
        negotiation?.id,
        ArchivedStatuses.includes(negotiation?.stage)
      ).then(() => {});
    });

    setBid({
      ...bid,
      files: bid.files?.filter((file) => file !== fileToDelete),
    });
  };

  const handleBidFileUpload = async (changeFiles: FileList | null) => {
    if (!changeFiles) return;

    let fileUrls: string[] = [];
    const fileArray = Array.from(changeFiles);

    const uploadPromises = fileArray.map((file) => uploadFile(file)); // Upload files
    fileUrls = (await Promise.all(uploadPromises)).filter(Boolean) as string[];

    setEditedBid({
      ...editedBid,
      files: [...(editedBid?.files ?? []), ...fileUrls],
    });

    await updateBidInFirebase(bid.bid_id as string, {
      files: [...(editedBid?.files ?? []), ...fileUrls],
    });

    await cacheBidTypeCounts(
      negotiation?.id,
      ArchivedStatuses.includes(negotiation?.stage)
    );

    setBid({
      ...bid,
      files: [...(bid?.files ?? []), ...fileUrls],
    });
  };

  return (
    <Dialog
      // open={openDialog === bidDetails.bid_id}
      // onOpenChange={(isOpen) => {
      //   if (!isOpen) {
      //     setEditingBidId(null); // Reset editedBid when closing
      //   }
      //   setOpenDialog(isOpen ? bidDetails.bid_id ?? "" : null);
      // }}
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="mr-2 h-4 w-4" />
          View Offer
        </Button>
      </DialogTrigger>
      <DialogContent style={{ background: "white", zIndex: 9999 }}>
        <div className="text-[#202125] space-y-4 w-[95%]">
          <div className="flex items-center gap-3">
            <p className="text-2xl font-bold">
              {bid.bidDealer?.Dealership} Detail
            </p>
            {!clientMode && (
              <>
                {editing ? (
                  <Button size="sm" onClick={() => handleSave()}>
                    <Save className="h-4 w-4 mr-2" /> Save
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(true)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>

          <div className="flex flex-wrap h-[150px] overflow-y-scroll gap-4 mt-4">
            {bid.files?.map((file: string, index: number) => {
              const isImage = ["jpg", "jpeg", "png", "gif", "bmp", "webp"].some(
                (ext) => file.toLowerCase().includes(ext)
              );

              return (
                <div
                  key={index}
                  onClick={() => window.open(file, "_blank")}
                  className="relative cursor-pointer w-20 h-20 flex items-center justify-center rounded-md "
                >
                  <div className="absolute top-0 right-0 z-[99]">
                    {editing && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent opening file when clicking the cross
                          handleDeleteFile(file);
                        }}
                        className="absolute top-0 right-0 bg-black  text-white rounded-full p-1 m-1 hover:bg-red-700"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                  {isImage ? (
                    <img
                      onClick={() => window.open(file, "_blank")}
                      src={file}
                      alt="Uploaded file"
                      className="object-cover w-full h-full"
                    />
                  ) : (
                    <embed
                      onClick={() => window.open(file, "_blank")}
                      type="application/pdf"
                      width="100%"
                      height="100%"
                      src={file}
                      style={{ zIndex: -1 }}
                    />
                  )}
                </div>
              );
            })}
            {editing && (
              <div className="flex items-center justify-center w-20 h-20 bg-gray-200 rounded-md cursor-pointer">
                <label
                  htmlFor="file-upload"
                  className="text-center flex flex-col items-center text-gray-600"
                >
                  <input
                    type="file"
                    id="file-upload"
                    onChange={(e) =>
                      handleBidFileUpload(e.target.files ?? new FileList())
                    }
                    className="hidden cursor-pointer"
                    multiple
                  />
                  <Upload className="w-8 h-8 text-gray-600" />
                  <p>Upload</p>
                </label>
              </div>
            )}
          </div>

          <div className="space-y-1 mt-4">
            <p className="font-semibold text-lg">
              {bid.bidDealer?.SalesPersonName}
            </p>
            <p>
              {bid.bidDealer?.City}
              <br />
              {bid.bidDealer?.State}
            </p>
            {mode === "bids" && (
              <span className="inline-flex items-center px-2 py-1 text-sm font-medium text-green-700 rounded-full">
                {editing ? (
                  <div className="space-x-2 flex">
                    <label className="flex p-2 rounded-full bg-green-100 items-center space-x-2">
                      <input
                        type="radio"
                        name="inventoryStatus"
                        value="In Stock"
                        checked={editedBid.inventoryStatus === "In Stock"}
                        onChange={() =>
                          setEditedBid({
                            ...editedBid,
                            inventoryStatus: "In Stock",
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span>In Stock</span>
                    </label>

                    <label className="flex p-2 rounded-full bg-yellow-100 items-center space-x-2">
                      <input
                        type="radio"
                        name="inventoryStatus"
                        value="In Transit"
                        checked={editedBid.inventoryStatus === "In Transit"}
                        onChange={() =>
                          setEditedBid({
                            ...editedBid,
                            inventoryStatus: "In Transit",
                          })
                        }
                        className="w-4 h-4"
                      />
                      <span>In Transit</span>
                    </label>
                  </div>
                ) : (
                  <p
                    className={`p-2 rounded-full ${
                      bid.inventoryStatus === "In Stock"
                        ? "bg-green-100"
                        : "bg-yellow-100"
                    }`}
                  >
                    {bid.inventoryStatus}
                  </p>
                )}
              </span>
            )}
          </div>

          <div className="flex mt-4 border-t pt-4 justify-between">
            <div>
              <p className="text-gray-500">Date Submitted</p>
              {/* @ts-ignore */}
              <p>{formatDate(bid.timestamp)}</p>
            </div>
            <div>
              <p className="text-gray-500">Price</p>
              {editing ? (
                <Input
                  type="number"
                  value={editedBid.price}
                  onChange={(e) =>
                    setEditedBid({
                      ...editedBid,
                      price: parseFloat(e.target.value),
                    })
                  }
                />
              ) : (
                <p className="text-2xl font-semibold">${bid.price}</p>
              )}
              <p className="text-gray-500">
                Total Discount: $
                {editing ? (
                  <Input
                    type="number"
                    value={editedBid.discountPrice}
                    onChange={(e) =>
                      setEditedBid({
                        ...editedBid,
                        discountPrice: e.target.value,
                      })
                    }
                  />
                ) : (
                  // @ts-ignore
                  bid.discountPrice || bid.discountAmount
                )}
              </p>
            </div>
          </div>

          <div className="border-t pt-4 flex flex-col">
            <p className="font-semibold">Additional Comments</p>
            <div className="break-words overflow-wrap break-words [overflow-wrap:anywhere] overflow-hidden max-w-[450px]">
              {parseComment(bid?.comments ?? "")}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export const parseComment = (comment: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;

  return comment.split(urlRegex).map((part: string, index: number) => {
    if (urlRegex.test(part)) {
      return (
        <Link
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 underline text-wrap break-words"
        >
          {part}
        </Link>
      );
    }

    return part;
  });
};
