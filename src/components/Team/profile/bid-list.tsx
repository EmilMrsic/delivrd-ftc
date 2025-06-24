import { ModalForm } from "@/components/tailwind-plus/modal-form";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { db } from "@/firebase/config";
import { toast } from "@/hooks/use-toast";
import { IncomingBidType } from "@/lib/models/bids";
import { DealerDataType } from "@/lib/models/dealer";
import { NegotiationDataType } from "@/lib/models/team";
import { backendRequest, callZapierWebhook } from "@/lib/request";
import { cn, formatDate } from "@/lib/utils";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { Plus, ThumbsDown, ThumbsUp, Trash } from "lucide-react";
import { useMemo, useState } from "react";

/** replacement for <IncomingBids /> without being tightly coupled to the client profile and standard incoming bid type */
export const BidList = ({
  bids,
  noUserActions,
  clientMode,
  negotiation,
}: {
  bids: (IncomingBidType & { bidDealer: DealerDataType })[];
  noUserActions: boolean;
  clientMode: boolean;
  negotiation: NegotiationDataType;
}) => {
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
  const hasAcceptedOffer = bids.find(
    (bid: IncomingBidType) => bid.client_offer === "accepted"
  );
  const hasAcceptedBid = bids.some(
    (bid: IncomingBidType) => bid.accept_offer === true
  );

  return (
    <div className="space-y-8">
      {bids.map((bid, idx) => (
        <BidCard
          negotiation={negotiation}
          bid={bid}
          hasAcceptedBid={hasAcceptedBid}
          hasAcceptedOffer={!!hasAcceptedOffer}
          key={idx}
          noUserActions={noUserActions}
          clientMode={clientMode}
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
}: {
  bid: IncomingBidType & { bidDealer: DealerDataType };
  hasAcceptedBid: boolean;
  hasAcceptedOffer: boolean;
  noUserActions: boolean;
  clientMode: boolean;
  negotiation: NegotiationDataType;
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

      if (result.success) {
        toast({ title: "Offer accepted", variant: "default" });
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

  console.log("got bid:", bid);

  return (
    <>
      <div
        id={`bid_${bid.bid_id}`}
        key={bid.bid_id}
        className={`border-l-4 pl-4 pb-6 pt-2 pr-2 
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
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-[#202125]">
            {bid.dealerName ? `${bid.dealerName} Offer` : "No Dealership"}

            <span
              className={cn(
                `px-2 py-1 text-sm font-medium text-white rounded-full ml-2`,
                bidVerified ? "bg-green-600" : "bg-red-500"
              )}
            >
              {!bidVerified
                ? "Under Review By The Delivrd Team"
                : "Verified By The Delivrd Team"}
            </span>
          </h3>
          <div className="items-center gap-3">
            <div className="flex">
              {!(noUserActions || clientMode) && (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent opening the dialog
                      handleDeleteBid(bidDetails.bid_id);
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
        <div className="flex space-x-2 mb-4">
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
        {commentForm && <BidCommentForm />}
        <BidComments bid={bid} />
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

            await callZapierWebhook(
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

export const BidCommentForm = ({}) => {
  const [comment, setComment] = useState<string>("");
  return (
    <div className="mb-4">
      <Textarea
        placeholder="Add a comment..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="mb-2"
      />
      <Button onClick={() => {}}>Submit Comment</Button>
    </div>
  );
};

export const BidComments = ({ bid }: { bid: IncomingBidType }) => {
  return (
    <>
      {bid.bidComments?.length && bid.bidComments.length > 0 ? (
        <></>
      ) : (
        <p className="text-sm text-gray-500">
          No comments available for this bid.
        </p>
      )}
    </>
  );
};

export const BidVoteCard = ({
  clientMode,
  bid,
  setBid,
}: {
  clientMode: boolean;
  bid: IncomingBidType;
  setBid: (bid: IncomingBidType) => void;
}) => {
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
    <div className="flex space-x-2">
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
