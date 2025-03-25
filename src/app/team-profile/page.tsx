"use client";
import { useState, Suspense, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  FileText,
  Plus,
  BellIcon,
  Car,
  Save,
  Pencil,
  X,
  Upload,
  Trash,
} from "lucide-react";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db, messaging } from "@/firebase/config";
import { ActivityLog, BidComments, IncomingBid } from "@/types";
import {
  formatDate,
  generateRandomId,
  getCurrentTimestamp,
  updateBidInFirebase,
  uploadFile,
} from "@/lib/utils";
import FeatureDetails from "@/components/Team/Feature-details";
import StickyHeader from "@/components/Team/Sticky-header";
import ClientDetails from "@/components/Team/Client-details";
import ManualBidUpload from "@/components/Team/Manual-bid-upload-modal";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { onMessage } from "firebase/messaging";
import { useDispatch } from "react-redux";
import {
  setAllNotifications,
  setNotificationCount,
} from "../redux/Slice/notificationSlice";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@radix-ui/react-dropdown-menu";
import ActivityLogSection from "@/components/Team/activity-log";
import AddNoteSection from "@/components/Team/add-note-section";
import useTeamProfile from "@/hooks/useTeamProfile";
import VoteSection from "@/components/Team/vote-section";
import { useRouter } from "next/navigation";
import EditableTextArea from "@/components/base/editable-textarea";
import { Input } from "@/components/ui/input";
import EditableInput from "@/components/base/input-field";
import axios from "axios";
import TradeCard from "@/components/Team/trade-card";
import DeleteBidSection from "@/components/Team/delete-bid-section";
import { TeamHeader } from "@/components/base/header";
import { DealNegotiatorType } from "@/lib/models/team";
import { TailwindPlusCard } from "@/components/tailwind-plus/card";
import { IncomingBidCard } from "@/components/Team/profile/incoming-bid";

function ProjectProfile() {
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const router = useRouter();

  const {
    dealNegotiator,
    dealers,
    user,
    allDealNegotiator,
    negotiation,
    setNegotiation,
    negotiationId,
    notification,
    notificationCount,
    incomingBids,
    setIncomingBids,
    bidCommentsByBidId,
    setBidCommentsByBidId,
  } = useTeamProfile();

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

  const [activityLog, setActivityLog] = useState<ActivityLog>([]);

  const [showStickyHeader, setShowStickyHeader] = useState(false);

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

  const handleBellClick = () => {
    dispatch(setNotificationCount(0));
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

    setActivityLog([...activityLog, newActivityLog]);
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
    const getActivityLogsByNegotiationId = async (negotiationId: string) => {
      try {
        const id = negotiationId;
        const logsRef = collection(db, "activity log");

        const q = query(logsRef, where("negotiationId", "==", id));

        // Get the query snapshot
        const querySnapshot = await getDocs(q);

        // Extract the documents (activity logs) from the snapshot
        const activityLogs = querySnapshot.docs.map((doc) => doc.data());

        if (activityLogs.length > 0) {
          console.log("Found Activity Logs:", activityLogs);
          return activityLogs;
        } else {
          console.log("No activity logs found for this negotiationId.");
          return [];
        }
      } catch (error) {
        console.error("Error getting activity logs:", error);
        return [];
      }
    };

    getActivityLogsByNegotiationId(negotiationId ?? "").then((log) => {
      setActivityLog(log as ActivityLog);
    });
  }, [negotiationId]);

  return (
    <div className="container mx-auto p-4 space-y-6 min-h-screen w-[90vw]">
      <TeamHeader
        handleBellClick={handleBellClick}
        notificationCount={notificationCount}
        notification={notification}
        negotiatorData={dealNegotiator as unknown as DealNegotiatorType}
      />

      {showStickyHeader && <StickyHeader negotiation={negotiation} />}

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
              incomingBids={incomingBids}
              negotiationId={negotiationId ?? ""}
              dealers={dealers as unknown as DealNegotiatorType[]}
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
                className="px-6 py-3 bg-white hover:bg-red-700 text-black rounded-full shadow-lg transition duration-300 transform hover:scale-105"
              >
                {showDeletedBids ? "Hide Deleted Bids" : "Show Deleted Bids"}
              </button>
            </div>
            {showDeletedBids && (
              <DeleteBidSection
                dealers={dealers}
                incomingBids={incomingBids}
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
              />
            )}

            <AddNoteSection
              user={user}
              setNegotiation={setNegotiation}
              negotiation={negotiation}
              incomingBids={incomingBids}
              allDealNegotiator={allDealNegotiator}
              dealNegotiator={dealNegotiator}
            />

            <ActivityLogSection activityLog={activityLog} />
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
              negotiationId={negotiationId}
              handleChange={handleChange}
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
    </div>
  );
}

const IncomingBids = ({
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
}) => {
  return (
    <TailwindPlusCard
      title="Incoming Bids"
      icon={FileText}
      actions={() => <ManualBidUpload id={negotiationId} />}
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
              />
            ))
        ) : (
          <p>No incoming bids available</p>
        )}
      </div>
    </TailwindPlusCard>
  );
};

function Profile() {
  return (
    <Suspense fallback={"Loading"}>
      <ProjectProfile />
    </Suspense>
  );
}

export default Profile;
