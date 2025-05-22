import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { formatDate } from "@/lib/utils";
import { FileText, Pencil, Plus, Save, Trash, Upload, X } from "lucide-react";
import VoteSection from "../vote-section";
import { Textarea } from "@/components/ui/textarea";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";
import { BidComments, DealerData, IncomingBid } from "@/types";
import {
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { toast } from "@/hooks/use-toast";
import { IncomingBidCommentType } from "@/lib/models/bids";
import { ModalForm } from "@/components/tailwind-plus/modal-form";
import { useMemo, useState } from "react";
import { backendRequest, callZapierWebhook } from "@/lib/request";

export const IncomingBidCard = ({
  setEditedBid,
  editedBid,
  bidDetails,
  dealers,
  incomingBids,
  setIncomingBids,
  setEditingBidId,
  setOpenDialog,
  setCommentingBidId,
  index,
  handleDeleteBid,
  handleDeleteFile,
  handleBidFileUpload,
  handleSendComment,
  addComment,
  parseComment,
  editingBidId,
  openDialog,
  commentingBidId,
  newComment,
  setNewComment,
  bidCommentsByBidId,
  handleSave,
  handleEdit,
  noUserActions,
  negotiationId,
  allowUndelete,
  clientMode,
  negotiation,
}: any & {
  noUserActions?: boolean;
  allowUndelete?: boolean;
  clientMode?: boolean;
  negotiation?: NegotiationDataType;
}) => {
  const [connectClientAndDealer, setConnectClientAndDealer] = useState(false);
  const [notifyFTC, setNotifyFTC] = useState(false);
  const matchingDealer = dealers.find((dealer: DealNegotiatorType) => {
    return dealer.id === bidDetails.dealerId;
  });

  const hasAcceptedOffer = incomingBids.find(
    (bid: IncomingBid) => bid.client_offer === "accepted"
  );
  const hasAcceptedBid = incomingBids.some(
    (bid: IncomingBid) => bid.accept_offer === true
  );
  const isAcceptedBid = bidDetails.accept_offer === true;
  const isDisabled = hasAcceptedBid && !isAcceptedBid;

  const handleAcceptOffer = async (acceptedBid: IncomingBid) => {
    try {
      const bidCollectionRef = collection(db, "Incoming Bids");
      const q = query(
        bidCollectionRef,
        where("bid_id", "==", acceptedBid.bid_id)
      );
      const querySnapshot = await getDocs(q);
      const bidRef = querySnapshot.docs[0].ref;

      await updateDoc(bidRef, { accept_offer: true, vote: "like" });

      setIncomingBids(
        incomingBids.map((bid: IncomingBid) => ({
          ...bid,
          accept_offer: bid.bid_id === acceptedBid.bid_id,
          vote: bid.bid_id === acceptedBid.bid_id ? "like" : bid.vote,
        }))
      );

      const updatedBid = {
        ...acceptedBid,
        accept_offer: true,
      };
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

  const handleCancelOffer = async (acceptedBid: IncomingBid) => {
    try {
      const bidRef = doc(db, "Incoming Bids", acceptedBid.bid_id);

      await updateDoc(bidRef, { accept_offer: false, vote: "neutral" });

      setIncomingBids(
        incomingBids.map((bid: IncomingBid) => ({
          ...bid,
          accept_offer: bid.bid_id === acceptedBid.bid_id && false,
          vote: bid.bid_id === acceptedBid.bid_id ? "neutral" : bid.vote,
        }))
      );

      toast({ title: "Offer canceled" });
    } catch (error) {
      console.error("Error accepting offer:", error);
    }
  };

  const restoreBid = async () => {
    console.log("restoreBid");
    try {
      const bidRef = doc(db, "Incoming Bids", bidDetails.bid_id);
      await updateDoc(bidRef, { delete: false });
      setIncomingBids(
        incomingBids.map((bid: IncomingBid) => ({
          ...bid,
          delete: bid.bid_id === bidDetails.bid_id && false,
        }))
      );
      toast({ title: "Bid restored" });
    } catch (error) {
      console.error("Error restoring bid:", error);
    }
  };

  const defaultValues = useMemo(() => {
    return {
      name: negotiation?.clientNamefull,
      email: negotiation?.clientEmail,
      phone: negotiation?.clientPhone,
      address: `${negotiation?.address}, ${negotiation?.city}, ${negotiation?.state} ${negotiation?.zip}`,
    };
  }, [negotiation]);

  return (
    <>
      <div
        id={`bid_${bidDetails.bid_id}`}
        key={index}
        className={`border-l-4 pl-4 pb-6 pt-2 pr-2 
          ${isDisabled ? "opacity-45 pointer-events-none" : ""}
      
        ${
          hasAcceptedOffer && bidDetails.client_offer !== "accepted"
            ? "opacity-45"
            : ""
        } ${
          bidDetails.vote && bidDetails.vote === "like"
            ? "bg-green-100 border-green-600 "
            : bidDetails.vote === "dislike"
            ? "bg-orange-100 border-orange-600"
            : "bg-white border-blue-600"
        }`}
      >
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-lg font-semibold text-[#202125]">
            {matchingDealer?.Dealership
              ? `${matchingDealer.Dealership} Offer`
              : "No Dealership"}
          </h3>
          <div className="flex items-center gap-3">
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
                <VoteSection
                  incomingBid={incomingBids}
                  setIncomingBid={setIncomingBids}
                  bidDetails={bidDetails}
                />
                {bidDetails.accept_offer ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCancelOffer(bidDetails)}
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
                    onClick={() => handleAcceptOffer(bidDetails)}
                    className={"bg-white text-black"}
                  >
                    Accept Offer
                  </Button>
                )}
              </>
            )}
            {clientMode && (
              <VoteSection
                incomingBid={incomingBids}
                setIncomingBid={setIncomingBids}
                bidDetails={bidDetails}
                clientMode={clientMode}
              />
            )}
            {allowUndelete && (
              <Button variant="outline" size="sm" onClick={() => restoreBid()}>
                Restore
              </Button>
            )}
          </div>
        </div>
        <time className="block mb-2 text-sm text-[#202125]">
          {formatDate(bidDetails?.timestamp)}
        </time>
        <p className="text-[#202125] mb-4">
          Price: ${bidDetails?.price ? bidDetails?.price : "No price available"}
        </p>
        <div className="flex space-x-2 mb-4">
          <BidDetailsDialog
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
          />
          {clientMode && (
            <>
              {bidDetails.accept_offer ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleCancelOffer(bidDetails)}
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
                  onClick={() => handleAcceptOffer(bidDetails)}
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
                onClick={() =>
                  setCommentingBidId(
                    commentingBidId === bidDetails.bid_id
                      ? null
                      : bidDetails.bid_id
                  )
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Comment
              </Button>
              {!clientMode && bidDetails.accept_offer && (
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
        {commentingBidId === bidDetails.bid_id && (
          <div className="mb-4">
            <Textarea
              placeholder="Add a comment..."
              value={newComment[bidDetails.bid_id] || ""}
              onChange={(e) =>
                setNewComment((prev: { [key: string]: string }) => ({
                  ...prev,
                  [bidDetails.bid_id]: e.target.value,
                }))
              }
              className="mb-2"
            />
            <Button onClick={() => addComment(bidDetails.bid_id)}>
              Submit Comment
            </Button>
          </div>
        )}

        {bidCommentsByBidId[bidDetails.bid_id] &&
        bidCommentsByBidId[bidDetails.bid_id].length > 0 ? (
          bidCommentsByBidId[bidDetails.bid_id].map(
            (comment: IncomingBidCommentType, index: number) => {
              return (
                <div
                  key={index}
                  className="flex bg-gray-100 mb-2 rounded pr-2 items-center justify-between"
                >
                  <div className="p-2 flex flex-col  mt-1">
                    <p>
                      <strong>
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
                            className="border-black"
                            onClick={() => handleSendComment(comment)}
                          >
                            Send To Client
                          </Button>
                        )
                      )}
                    </>
                  )}
                </div>
              );
            }
          )
        ) : (
          <p className="text-sm text-gray-500">
            No comments available for this bid.
          </p>
        )}
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
                id: matchingDealer?.id,
                name: matchingDealer?.SalesPersonName,
                dealership: matchingDealer?.Dealership,
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
                defaultValue: matchingDealer?.SalesPersonPhone,
              },
              {
                label: "Dealers Email",
                name: "dealerEmail",
                defaultValue: matchingDealer?.YourEmail,
              },
            ],
            {
              name: "message",
              type: "textarea",
              defaultValue: `Hi ${negotiation?.clientFirstName}, this is ${matchingDealer?.SalesPersonName} with ${matchingDealer?.Dealership} wanted to connect you two. `,
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
              { label: "Price", name: "price", defaultValue: bidDetails.price },
              {
                label: "Discount",
                name: "discount",
                defaultValue: bidDetails.discountPrice,
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
                negotiationId: negotiationId,
                dealerName: matchingDealer?.SalesPersonName,
                make: negotiation?.brand,
                model: negotiation?.model,
                bidId: bidDetails.bid_id,
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

export const BidDetailsDialog = ({
  openDialog,
  setEditingBidId,
  setOpenDialog,
  bidDetails,
  matchingDealer,
  editingBidId,
  handleSave,
  handleEdit,
  handleDeleteFile,
  handleBidFileUpload,
  editedBid,
  setEditedBid,
  parseComment,
  clientMode,
}: {
  openDialog: string;
  setEditingBidId: (id: string | null) => void;
  setOpenDialog: (id: string | null) => void;
  bidDetails: IncomingBid;
  matchingDealer: DealerData;
  editedBid: IncomingBid;
  editingBidId: string | null;
  setEditedBid: (bid: IncomingBid) => void;
  handleSave: (bidId: string) => void;
  handleEdit: (bid: IncomingBid) => void;
  handleDeleteFile: (file: string, bidId: string) => void;
  handleBidFileUpload: (files: FileList, bidId: string) => void;
  parseComment: (comment: string) => React.ReactNode;
  clientMode?: boolean;
}) => {
  return (
    <Dialog
      open={openDialog === bidDetails.bid_id}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          setEditingBidId(null); // Reset editedBid when closing
        }
        setOpenDialog(isOpen ? bidDetails.bid_id ?? "" : null);
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <FileText className="mr-2 h-4 w-4" />
          View Offer
        </Button>
      </DialogTrigger>
      <DialogContent style={{ background: "white" }}>
        <div className="text-[#202125] space-y-4 w-[95%]">
          <div className="flex items-center gap-3">
            <p className="text-2xl font-bold">
              {matchingDealer?.Dealership} Detail
            </p>
            {!clientMode && (
              <>
                {editingBidId === bidDetails.bid_id ? (
                  <Button
                    size="sm"
                    onClick={() => handleSave(bidDetails.bid_id)}
                  >
                    <Save className="h-4 w-4 mr-2" /> Save
                  </Button>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(bidDetails)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Files Section */}
          <div className="flex flex-wrap h-[150px] overflow-y-scroll gap-4 mt-4">
            {bidDetails.files.map((file: string, index: number) => {
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
                    {editingBidId === bidDetails.bid_id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation(); // Prevent opening file when clicking the cross
                          handleDeleteFile(file, bidDetails.bid_id);
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
            {editingBidId === bidDetails.bid_id && (
              <div className="flex items-center justify-center w-20 h-20 bg-gray-200 rounded-md cursor-pointer">
                <label
                  htmlFor="file-upload"
                  className="text-center flex flex-col items-center text-gray-600"
                >
                  <input
                    type="file"
                    id="file-upload"
                    onChange={(e) =>
                      handleBidFileUpload(
                        e.target.files ?? new FileList(),
                        bidDetails.bid_id
                      )
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
              {matchingDealer?.SalesPersonName}
            </p>
            <p>
              {matchingDealer?.City}
              <br />
              {matchingDealer?.State}
            </p>
            <span className="inline-flex items-center px-2 py-1 text-sm font-medium text-green-700 rounded-full">
              {editingBidId === bidDetails.bid_id ? (
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
                    bidDetails.inventoryStatus === "In Stock"
                      ? "bg-green-100"
                      : "bg-yellow-100"
                  }`}
                >
                  {bidDetails?.inventoryStatus}
                </p>
              )}
            </span>
          </div>

          <div className="flex mt-4 border-t pt-4 justify-between">
            <div>
              <p className="text-gray-500">Date Submitted</p>
              <p>{formatDate(bidDetails.timestamp)}</p>
            </div>
            <div>
              <p className="text-gray-500">Price</p>
              {editingBidId === bidDetails.bid_id ? (
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
                <p className="text-2xl font-semibold">${bidDetails.price}</p>
              )}
              <p className="text-gray-500">
                Total Discount: $
                {editingBidId === bidDetails.bid_id ? (
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
                  bidDetails.discountPrice
                )}
              </p>
            </div>
          </div>

          <div className="border-t pt-4 flex flex-col">
            <p className="font-semibold">Additional Comments</p>
            <div className="break-words overflow-wrap break-words [overflow-wrap:anywhere]">
              {parseComment(bidDetails.comments)}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
