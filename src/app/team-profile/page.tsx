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

import TradeCard from "@/components/Team/trade-card";
import DeleteBidSection from "@/components/Team/delete-bid-section";
import WorkLogSection from "@/components/Team/work-log-section";

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
      client_phone_number: negotiation?.clientInfo.negotiations_Phone ?? "",
      bid_id,
      client_name: negotiation?.clientInfo.negotiations_Client ?? "",
      client: negotiation?.clientInfo.negotiations_Client ?? "",
      comment: newComment[bid_id],
      deal_coordinator: user?.deal_coordinator_id ?? "",
      deal_coordinator_name: user?.name ?? "",
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

  const handleChange = (
    parentKey: string,
    childKey: string,
    newValue: string
  ) => {
    setNegotiation((prevState: any) => {
      let updatedParent: any = {};

      if (
        parentKey === "otherData" &&
        childKey.startsWith("negotiations_Color_Options")
      ) {
        updatedParent = { ...prevState[parentKey] };
        const field = childKey.split(".")[1]; // get the field name (e.g., 'interior_preferred')

        if (updatedParent.negotiations_Color_Options) {
          updatedParent.negotiations_Color_Options = {
            ...updatedParent.negotiations_Color_Options,
            [field]: newValue,
          };
        }
      } else {
        updatedParent = {
          ...prevState[parentKey],
          [childKey]: newValue,
        };
      }

      return {
        ...prevState,
        [parentKey]: updatedParent,
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
            className="text-blue-600 underline w-[450px] text-wrap break-words"
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

  const handleReaddBid = async (bidId: string) => {
    const bid_id = bidId;
    const updatedBids = incomingBids.map((bid) =>
      bid.bid_id === bidId ? { ...bid, delete: false } : bid
    );
    setIncomingBids(updatedBids);

    const bidDocRef = doc(db, "Incoming Bids", bid_id);

    try {
      await updateDoc(bidDocRef, { delete: false });
      console.log("Bid marked as deleted in Firebase");
      toast({ title: "Bid has been Re-Added" });
    } catch (error) {
      console.error("Error updating bid in Firebase: ", error);
    }
    logActivity(user.name, "A bid has been Re-Added");
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

  const handleAcceptOffer = async (acceptedBid: IncomingBid) => {
    try {
      const bidRef = doc(db, "Incoming Bids", acceptedBid.bid_id);

      await updateDoc(bidRef, { accept_offer: true, vote: "like" });

      setIncomingBids((prevBids) =>
        prevBids.map((bid) => ({
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

      setIncomingBids((prevBids) =>
        prevBids.map((bid) => ({
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

  console.log({ incomingBids });

  return (
    <div className="container mx-auto p-4 space-y-6 bg-[#E4E5E9] min-h-screen">
      <div className="flex justify-between items-center bg-[#202125] p-6 rounded-lg shadow-lg">
        <div
          onClick={() => router.push("/team-dashboard")}
          className="flex flex-col items-start cursor-pointer"
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-JoIhMlHLZk8imAGedndft4tH9e057R.png"
            alt="DELIVRD Logo"
            className="h-8 mb-2"
          />
          <p className="text-white text-sm">Putting Dreams In Driveways</p>
        </div>
        <div className="text-right flex items-center gap-3">
          <DropdownMenu onOpenChange={handleBellClick}>
            <DropdownMenuTrigger>
              <div className="relative">
                <BellIcon className="w-6 h-6" color="#fff" />
                {notificationCount > 0 && (
                  <div className="absolute top-[-5px] right-[-5px] flex justify-center items-center w-4 h-4 bg-red-500 text-white text-xs rounded-full">
                    {notificationCount}
                  </div>
                )}
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="z-50 ">
              <div
                className={`bg-white flex flex-col ${
                  notification.length ? "max-h-[300px]" : "h-auto"
                }  overflow-y-scroll gap-3 p-2 z-10 rounded-xl`}
              >
                {notification.length ? (
                  notification.map((item, index) => (
                    <Link
                      key={index}
                      target="_blank"
                      href={item.link ?? "/"}
                      className="flex flex-col gap-1 p-3 rounded-[8px] items-start hover:bg-gray-200"
                    >
                      <p className="font-bold text-lg">{item.title}</p>
                      <p className="font-normal text-gray-500 text-sm">
                        {item.body}
                      </p>
                    </Link>
                  ))
                ) : (
                  <p>No notifications available</p>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#0989E5] to-[#E4E5E9] text-transparent bg-clip-text">
            {negotiation?.clientInfo?.negotiations_First_Name +
              " " +
              negotiation?.clientInfo?.negotiations_Last_Name}
          </h1>
        </div>
      </div>

      {showStickyHeader && <StickyHeader negotiation={negotiation} />}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="md:hidden">
            <FeatureDetails
              setShowStickyHeader={setShowStickyHeader}
              negotiation={negotiation}
              negotiationId={negotiationId}
              handleChange={handleChange}
            />
          </div>

          <ClientDetails
            handleChange={handleChange}
            negotiation={negotiation}
            dealNegotiator={dealNegotiator}
            negotiationId={negotiationId}
          />

          <Card className="bg-white shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#0989E5] to-[#202125] text-white">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <FileText className="mr-2" />
                  Incoming Bids
                </div>
                <div className="flex items-center">
                  <ManualBidUpload id={negotiationId} />
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
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
                    .map((bidDetails, index) => {
                      const matchingDealer = dealers.find(
                        (dealer) => dealer.id === bidDetails.dealerId
                      );
                      const hasAcceptedOffer = incomingBids.find(
                        (bid) => bid.client_offer === "accepted"
                      );
                      const hasAcceptedBid = incomingBids.some(
                        (bid) => bid.accept_offer === true
                      );
                      const isAcceptedBid = bidDetails.accept_offer === true;
                      const isDisabled = hasAcceptedBid && !isAcceptedBid;

                      return (
                        <div
                          key={index}
                          className={`border-l-4 pl-4 pb-6 pt-2 pr-2 

                            ${
                              isDisabled ? "opacity-45 pointer-events-none" : ""
                            }
                            ${
                              hasAcceptedOffer &&
                              bidDetails.client_offer !== "accepted"
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
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent opening the dialog
                                  handleDeleteBid(bidDetails.bid_id);
                                }}
                                className="bg-red-600 text-white rounded-full p-2 hover:bg-red-700"
                              >
                                <Trash className="w-5 h-5" />
                              </button>
                              <VoteSection
                                bidDetails={bidDetails}
                                setIncomingBids={setIncomingBids}
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
                            </div>
                          </div>
                          <time className="block mb-2 text-sm text-[#202125]">
                            {formatDate(bidDetails?.timestamp)}
                          </time>
                          <p className="text-[#202125] mb-4">
                            Price: $
                            {bidDetails?.price
                              ? bidDetails?.price
                              : "No price available"}
                          </p>
                          <div className="flex space-x-2 mb-4">
                            <Dialog
                              open={openDialog === bidDetails.bid_id}
                              onOpenChange={(isOpen) => {
                                if (!isOpen) {
                                  setEditingBidId(null); // Reset editedBid when closing
                                }
                                setOpenDialog(
                                  isOpen ? bidDetails.bid_id ?? "" : null
                                );
                              }}
                            >
                              <DialogTrigger asChild>
                                <Button variant="outline" size="sm">
                                  <FileText className="mr-2 h-4 w-4" />
                                  View Offer
                                </Button>
                              </DialogTrigger>
                              <DialogContent style={{ background: "white" }}>
                                <div className="text-[#202125] space-y-4">
                                  <div className="flex items-center gap-3">
                                    <p className="text-2xl font-bold">
                                      {matchingDealer?.Dealership} Detail
                                    </p>
                                    {editingBidId === bidDetails.bid_id ? (
                                      <Button
                                        size="sm"
                                        onClick={() =>
                                          handleSave(bidDetails.bid_id)
                                        }
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
                                  </div>

                                  {/* Files Section */}
                                  <div className="flex flex-wrap h-[150px] overflow-y-scroll gap-4 mt-4">
                                    {bidDetails.files.map((file, index) => {
                                      const isImage = [
                                        "jpg",
                                        "jpeg",
                                        "png",
                                        "gif",
                                        "bmp",
                                        "webp",
                                      ].some((ext) =>
                                        file.toLowerCase().includes(ext)
                                      );

                                      return (
                                        <div
                                          key={index}
                                          onClick={() =>
                                            window.open(file, "_blank")
                                          }
                                          className="relative cursor-pointer w-20 h-20 flex items-center justify-center rounded-md "
                                        >
                                          <div className="absolute top-0 right-0 z-[99]">
                                            {editingBidId ===
                                              bidDetails.bid_id && (
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation(); // Prevent opening file when clicking the cross
                                                  handleDeleteFile(
                                                    file,
                                                    bidDetails.bid_id
                                                  );
                                                }}
                                                className="absolute top-0 right-0 bg-black  text-white rounded-full p-1 m-1 hover:bg-red-700"
                                              >
                                                <X size={16} />
                                              </button>
                                            )}
                                          </div>
                                          {isImage ? (
                                            <img
                                              onClick={() =>
                                                window.open(file, "_blank")
                                              }
                                              src={file}
                                              alt="Uploaded file"
                                              className="object-cover w-full h-full"
                                            />
                                          ) : (
                                            <embed
                                              onClick={() =>
                                                window.open(file, "_blank")
                                              }
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
                                                e.target.files,
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
                                              checked={
                                                editedBid.inventoryStatus ===
                                                "In Stock"
                                              }
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
                                              checked={
                                                editedBid.inventoryStatus ===
                                                "In Transit"
                                              }
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
                                            bidDetails.inventoryStatus ===
                                            "In Stock"
                                              ? "bg-green-100"
                                              : "bg-yellow-100"
                                          }`}
                                        >
                                          {bidDetails?.inventoryStatus}
                                        </p>
                                      )}
                                    </span>
                                  </div>

                                  <div className="flex justify-between mt-4 border-t pt-4">
                                    <div>
                                      <p className="text-gray-500">
                                        Date Submitted
                                      </p>
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
                                              price: e.target.value,
                                            })
                                          }
                                        />
                                      ) : (
                                        <p className="text-2xl font-semibold">
                                          ${bidDetails.price}
                                        </p>
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

                                  <div className="border-t pt-4 flex flex-col ">
                                    <p className="font-semibold">
                                      Additional Comments
                                    </p>
                                    {parseComment(bidDetails.comments)}
                                  </div>
                                </div>
                              </DialogContent>
                            </Dialog>

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
                          </div>
                          {commentingBidId === bidDetails.bid_id && (
                            <div className="mb-4">
                              <Textarea
                                placeholder="Add a comment..."
                                value={newComment[bidDetails.bid_id] || ""}
                                onChange={(e) =>
                                  setNewComment((prev) => ({
                                    ...prev,
                                    [bidDetails.bid_id]: e.target.value,
                                  }))
                                }
                                className="mb-2"
                              />
                              <Button
                                onClick={() => addComment(bidDetails.bid_id)}
                              >
                                Submit Comment
                              </Button>
                            </div>
                          )}

                          {bidCommentsByBidId[bidDetails.bid_id] &&
                          bidCommentsByBidId[bidDetails.bid_id].length > 0 ? (
                            bidCommentsByBidId[bidDetails.bid_id].map(
                              (comment, index) => (
                                <div className="flex bg-gray-100 mb-2 rounded pr-2 items-center justify-between">
                                  <div
                                    key={index}
                                    className="p-2 flex flex-col  mt-1"
                                  >
                                    <p>
                                      <strong>
                                        {comment.deal_coordinator_name === "N/A"
                                          ? comment.client_name
                                          : comment.deal_coordinator_name}
                                        :
                                      </strong>{" "}
                                      {parseComment(comment.comment)}
                                    </p>
                                    <p className="text-sm text-gray-500">
                                      {comment.time}
                                    </p>
                                  </div>
                                  {comment.deal_coordinator_name === "N/A" ? (
                                    <p className="pr-2">From Client</p>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      className="border-black"
                                      onClick={() => handleSendComment(comment)}
                                    >
                                      Send To Client
                                    </Button>
                                  )}
                                </div>
                              )
                            )
                          ) : (
                            <p className="text-sm text-gray-500">
                              No comments available for this bid.
                            </p>
                          )}
                        </div>
                      );
                    })
                ) : (
                  <p>No incoming bids available</p>
                )}
              </div>
            </CardContent>
          </Card>
          <div className="banner bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-5 rounded-lg shadow-xl flex justify-between items-center max-w-4xl mx-auto my-4">
            <div>
              <p className="text-xl font-bold">Delivrd</p>
              <p className="text-sm mt-1 opacity-75">
                Click on the button to show or hide deleted bids
              </p>
            </div>
            <button
              onClick={() => setShowDeletedBids(!showDeletedBids)}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full shadow-lg transition duration-300 transform hover:scale-105"
            >
              {showDeletedBids ? "Hide Deleted Bids" : "Show Deleted Bids"}
            </button>
          </div>
          {showDeletedBids && (
            <DeleteBidSection
              handleReaddBid={handleReaddBid}
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
          <WorkLogSection user={user} negotiationId={negotiationId} />

          <AddNoteSection
            user={user}
            negotiationId={negotiationId ?? ""}
            negotiation={negotiation}
            incomingBids={incomingBids}
            allDealNegotiator={allDealNegotiator}
            dealNegotiator={dealNegotiator}
          />
          <ActivityLogSection activityLog={activityLog} />
        </div>

        <div className="md:col-span-1">
          <div className="md:sticky md:top-4">
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

            <Card className="bg-white shadow-lg mb-5">
              <CardHeader className="bg-gradient-to-r from-[#202125] to-[#0989E5] text-white">
                <CardTitle className="flex items-center">
                  <Car className="mr-2" /> Shipping Info
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center mt-2">
                <EditableTextArea
                  value={
                    negotiation?.dealInfo.shipping_info ??
                    "No shipping info at the moment"
                  }
                  negotiationId={negotiationId ?? ""}
                  field="shipping_info"
                  onChange={(newValue) =>
                    handleChange("dealInfo", "shipping_info", newValue)
                  }
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function Profile() {
  return (
    <Suspense fallback={"Loading"}>
      <ProjectProfile />
    </Suspense>
  );
}

export default Profile;
