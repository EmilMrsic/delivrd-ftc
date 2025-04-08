import { setAllNotifications } from "@/app/redux/Slice/notificationSlice";
import { db, messaging } from "@/firebase/config";
import { toast } from "@/hooks/use-toast";
import useTeamProfile from "@/hooks/useTeamProfile";
import {
  generateRandomId,
  getActivityLogsByNegotiationId,
  getCurrentTimestamp,
  updateBidInFirebase,
  uploadFile,
} from "@/lib/utils";
import { ActivityLog, BidComments } from "@/types";
import { addDoc, collection, doc, updateDoc } from "firebase/firestore";
import { onMessage } from "firebase/messaging";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import ClientDetails from "../Client-details";
import { IncomingBids } from "./incoming-bids";
import { DealNegotiatorType } from "@/lib/models/team";
import DeleteBidSection from "../delete-bid-section";
import AddNoteSection from "../add-note-section";
import ActivityLogSection from "../activity-log";
import FeatureDetails from "../Feature-details";
import TradeCard from "../trade-card";
import { TailwindPlusCard } from "@/components/tailwind-plus/card";
import EditableTextArea from "@/components/base/editable-textarea";
import { Loader } from "@/components/base/loader";
import WorkLogSection from "../work-log-section";

export const ClientProfile = ({ negotiationId }: { negotiationId: string }) => {
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const {
    dealNegotiator,
    dealers,
    user,
    allDealNegotiator,
    negotiation,
    setNegotiation,
    incomingBids,
    setIncomingBids,
    bidCommentsByBidId,
    setBidCommentsByBidId,
    isLoading,
    setDealers,
  } = useTeamProfile({ negotiationId });

  const dispatch = useDispatch();

  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [commentingBidId, setCommentingBidId] = useState<string | null>(null);
  const [editingBidId, setEditingBidId] = useState<string | null>(null);
  const [showDeletedBids, setShowDeletedBids] = useState<boolean>(false);
  const [editedBid, setEditedBid] = useState({
    price: "",
    discountPrice: "",
    inventoryStatus: "In Stock",
    files: [""],
  });

  const [activityLog, setActivityLog] = useState<ActivityLog>();

  const addComment = async (bid_id: string) => {
    if (!newComment[bid_id]?.trim()) return;

    const newCommentData: BidComments = {
      client_phone_number: negotiation?.clientPhone ?? "",
      bid_id,
      client_name: negotiation?.clientNamefull ?? "",
      client: negotiation?.clientNamefull ?? "",
      comment: newComment[bid_id],
      deal_coordinator: dealNegotiator?.id ?? "",
      deal_coordinator_name: dealNegotiator?.name ?? "",
      link_status: "Active",
      negotiation_id: negotiationId ?? "",
      time: getCurrentTimestamp(),
      client_id: "N/A",
      comment_source: "Team",
    };

    setBidCommentsByBidId((prev) => ({
      ...prev,
      [bid_id]: [...(prev[bid_id] || []), newCommentData],
    }));

    setNewComment((prev) => ({
      ...prev,
      [bid_id]: "",
    }));
    const commentRef = collection(db, "bid comment");
    await addDoc(commentRef, newCommentData);
    toast({ title: "Comment added successfully" });
  };

  const handleChange = (updateObject: {
    key: string;
    newValue: string;
    parentKey?: string;
  }) => {
    setNegotiation((prevState: any) => {
      const { key, newValue, parentKey } = updateObject;

      let value = newValue;
      let keyName = parentKey ? parentKey : key;
      if (parentKey) {
        value = {
          ...prevState[parentKey],
          [key]: newValue,
        };
      }

      return {
        ...prevState,
        [keyName]: value,
      };
    });
  };

  const parseComment = (comment: string) => {
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

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      onMessage(messaging, (data: any) => {
        const newData = { ...data.notification, ...data.data };
        if (newData) dispatch(setAllNotifications(newData));
      });

      console.log("Notification listener initialized");
    }, 3000);

    return () => clearTimeout(timeoutId);
  }, [dispatch]);

  const handleEdit = (bid: any) => {
    setEditingBidId(bid.bid_id);
    setEditedBid({
      price: bid.price.toString(),
      discountPrice: bid.discountPrice.toString(),
      inventoryStatus: bid.inventoryStatus,
      files: bid.files,
    });
  };

  const handleSave = (bidId: string) => {
    setIncomingBids(
      incomingBids.map((bid) =>
        bid.bid_id === bidId
          ? {
              ...bid,
              ...editedBid,
              price: Number(editedBid.price),
              discountPrice: String(editedBid.discountPrice),
            }
          : bid
      )
    );
    updateBidInFirebase(bidId, {
      discountPrice: editedBid.discountPrice,
      inventoryStatus: editedBid.inventoryStatus,
      price: Number(editedBid.price),
      files: editedBid.files,
    });
    setOpenDialog(null);
    setEditingBidId(null);
    toast({ title: "Bid Updated successfully" });
  };

  const handleDeleteBid = async (bidId: string) => {
    const bid_id = bidId;
    const updatedBids = incomingBids.map((bid) =>
      bid.bid_id === bidId ? { ...bid, delete: true } : bid
    );
    setIncomingBids(updatedBids);

    const bidDocRef = doc(db, "Incoming Bids", bid_id);

    try {
      await updateDoc(bidDocRef, { delete: true });
      console.log("Bid marked as deleted in Firebase");
      toast({ title: "Bid marked as deleted" });
    } catch (error) {
      console.error("Error updating bid in Firebase: ", error);
    }
    logActivity(user.name, "A bid has been deleted");
  };

  const handleBidFileUpload = async (
    changeFiles: FileList | null,
    bidId: string
  ) => {
    if (!changeFiles) return;

    let fileUrls: string[] = [];
    const fileArray = Array.from(changeFiles);

    const uploadPromises = fileArray.map((file) => uploadFile(file)); // Upload files
    fileUrls = (await Promise.all(uploadPromises)).filter(Boolean) as string[];

    setEditedBid({
      ...editedBid,
      files: [...editedBid.files, ...fileUrls],
    });

    setIncomingBids((incomingBids) => {
      return incomingBids.map((bid) => {
        if (bid.bid_id === bidId) {
          // Add the new files to the correct bid in the incomingBids state
          return {
            ...bid,
            files: [...bid.files, ...fileUrls],
          };
        }
        return bid;
      });
    });
  };

  const logActivity = async (name: string, actionDescription: string) => {
    const today = new Date();
    const day = today.toLocaleString("en-US", { weekday: "long" });
    const time = today.toISOString().split("T")[0];

    const newActivityLog = {
      id: generateRandomId(),
      day,
      time,
      description: actionDescription,
      user: name,
      negotiationId,
    };

    const useableActivityLog = activityLog ?? [];

    setActivityLog([...useableActivityLog, newActivityLog]);
    console.log(activityLog);
    await addDoc(collection(db, "activity log"), newActivityLog);
  };

  const handleDeleteFile = (fileToDelete: string, bidId: string) => {
    setEditedBid((prevEditedBid) => ({
      ...prevEditedBid,
      files: prevEditedBid.files.filter((file) => file !== fileToDelete),
    }));

    setIncomingBids((incomingBids) => {
      return incomingBids.map((bid) => {
        if (bid.bid_id === bidId) {
          return {
            ...bid,
            files: bid.files.filter((file) => file !== fileToDelete),
          };
        }
        return bid;
      });
    });
  };

  const handleSendComment = async (data: BidComments) => {
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_COMMENT_FUNC_URL ?? "",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        }
      );

      const result = await response.json();
      if (result.success) {
        toast({ title: "Comment sent to client" });
      } else {
        console.error("Failed to send comment:", result.error);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    getActivityLogsByNegotiationId(negotiationId ?? "").then((log) => {
      setActivityLog(log as ActivityLog);
    });
  }, [negotiationId]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader className="w-10 h-10 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-12 w-[98%] mx-auto">
      <div className="md:col-span-2">
        <div className="md:sticky md:top-4 space-y-6">
          {/* <div className="md:hidden">
                <FeatureDetails
                  setShowStickyHeader={setShowStickyHeader}
                  negotiation={negotiation}
                  negotiationId={negotiationId}
                  handleChange={handleChange}
                />
              </div> */}

          <ClientDetails
            handleChange={handleChange}
            negotiation={negotiation}
            dealNegotiator={dealNegotiator}
            negotiationId={negotiationId}
          />

          <IncomingBids
            setIncomingBids={setIncomingBids}
            incomingBids={incomingBids}
            negotiationId={negotiationId ?? ""}
            dealers={dealers}
            setDealers={setDealers}
            handleDeleteBid={handleDeleteBid}
            handleEdit={handleEdit}
            handleSave={handleSave}
            openDialog={openDialog}
            setOpenDialog={setOpenDialog}
            setEditingBidId={setEditingBidId}
            setCommentingBidId={setCommentingBidId}
            commentingBidId={commentingBidId}
            newComment={newComment}
            setNewComment={setNewComment}
            addComment={addComment}
            bidCommentsByBidId={bidCommentsByBidId}
            parseComment={parseComment}
            handleSendComment={handleSendComment}
          />

          <div className="banner bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 rounded-lg shadow-xl flex justify-between items-center max-w-4xl mx-auto my-4">
            <div>
              <p className="text-xl font-bold">Delivrd</p>
              <p className="text-sm mt-1 opacity-75">
                Click on the button to show or hide deleted bids
              </p>
            </div>
            <button
              onClick={() => setShowDeletedBids(!showDeletedBids)}
              className="px-6 py-3 bg-white text-black hover:bg-black hover:text-white  rounded-full shadow-lg transition duration-300 transform hover:scale-105"
            >
              {showDeletedBids ? "Hide Deleted Bids" : "Show Deleted Bids"}
            </button>
          </div>
          {showDeletedBids && (
            <DeleteBidSection
              incomingBids={incomingBids}
              negotiationId={negotiationId}
              dealers={dealers}
              setCommentingBidId={setCommentingBidId}
              setEditedBid={setEditedBid}
              setEditingBidId={setEditingBidId}
              editedBid={editedBid}
              editingBidId={editingBidId}
              commentingBidId={commentingBidId}
              setNewComment={setNewComment}
              newComment={newComment}
              addComment={addComment}
              handleBidFileUpload={handleBidFileUpload}
              handleDeleteFile={handleDeleteFile}
              handleEdit={handleEdit}
              handleSave={handleSave}
              setOpenDialog={setOpenDialog}
              openDialog={openDialog}
              setIncomingBids={setIncomingBids}
            />
          )}
          <WorkLogSection negotiationId={negotiationId} user={user} />

          <AddNoteSection
            user={user}
            setNegotiation={setNegotiation}
            negotiation={negotiation}
            incomingBids={incomingBids}
            allDealNegotiator={allDealNegotiator}
            dealNegotiator={dealNegotiator}
          />

          <ActivityLogSection activityLog={activityLog ?? []} />
        </div>
      </div>

      <div className="md:col-span-1">
        <div className="md:sticky md:top-4 space-y-6">
          <FeatureDetails
            negotiation={negotiation}
            negotiationId={negotiationId}
            handleChange={handleChange}
          />
          <TradeCard
            negotiation={negotiation}
            handleChange={handleChange}
            setNegotiation={setNegotiation}
          />

          <TailwindPlusCard title="Shipping Info">
            <EditableTextArea
              value={
                negotiation?.shippingInfo ?? "No shipping info at the moment"
              }
              negotiationId={negotiationId ?? ""}
              field="shippingInfo"
              onChange={(newValue) =>
                handleChange({
                  key: "shippingInfo",
                  newValue: newValue,
                })
              }
            />
          </TailwindPlusCard>
        </div>
      </div>
    </div>
  );
};
