"use client";
import { useState, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Plus, BellIcon } from "lucide-react";
import { addDoc, collection } from "firebase/firestore";
import { db, messaging } from "@/firebase/config";
import { ActivityLog, BidComments } from "@/types";
import { formatDate, getCurrentTimestamp } from "@/lib/utils";
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

function ProjectProfile() {
  const [openDialog, setOpenDialog] = useState<string | null>(null);

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

  const [activityLog] = useState<ActivityLog>([
    {
      timestamp: "2023-07-15 09:30:00",
      action: "Deal created",
      user: "Troy Paul",
    },
    {
      timestamp: "2023-07-15 10:15:00",
      action: "Initial offer received from Honda World",
      user: "System",
    },
    {
      timestamp: "2023-07-14 11:00:00",
      action: "Comment added to Honda World offer",
      user: "Troy Paul",
    },
  ]);

  const [showStickyHeader, setShowStickyHeader] = useState(false);

  const addComment = async (bid_id: string) => {
    if (!newComment[bid_id]?.trim()) return;

    const newCommentData: BidComments = {
      client_phone_number: negotiation?.clientInfo.negotiations_Phone ?? "",
      bid_id,
      client: negotiation?.clientInfo.negotiations_Client ?? "",
      comment: newComment[bid_id],
      deal_coordinator: dealNegotiator?.id ?? "",
      deal_coordinator_name: dealNegotiator?.name ?? "",
      link_status: "Active",
      negotiation_id: negotiationId ?? "",
      time: getCurrentTimestamp(),
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
        const regex = /negotiations_Color_Options\[(\d+)\]\.(\w+)/;
        const match = childKey.match(regex);

        if (match) {
          const index = parseInt(match[1]);
          const field = match[2];

          if (
            Array.isArray(updatedParent.negotiations_Color_Options) &&
            updatedParent.negotiations_Color_Options[index]
          ) {
            updatedParent.negotiations_Color_Options[index] = {
              ...updatedParent.negotiations_Color_Options[index],
              [field]: newValue,
            };
          }
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
            className="text-blue-600 underline text-wrap break-words"
          >
            {part}
          </Link>
        );
      }
      return part;
    });
  };

  // onMessage(messaging, (data: any) => {
  //   const newData = { ...data.notification, ...data.data };
  //   if (newData) dispatch(setAllNotifications(newData));
  // });

  return (
    <div className="container mx-auto p-4 space-y-6 bg-[#E4E5E9] min-h-screen">
      <div className="flex justify-between items-center bg-[#202125] p-6 rounded-lg shadow-lg">
        <div className="flex flex-col items-start">
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
            {negotiation?.clientInfo?.negotiations_Client}
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
                    ?.slice()
                    .sort((a, b) => {
                      const dateA = new Date(a.timestamp).getTime() || 0;
                      const dateB = new Date(b.timestamp).getTime() || 0;
                      return dateB - dateA;
                    })
                    .map((bidDetails, index) => (
                      <div
                        key={index}
                        className={`border-l-4 pl-4 pb-6 pt-2 pr-2 ${
                          bidDetails.vote && bidDetails.vote === "like"
                            ? "bg-green-100 border-green-600 "
                            : bidDetails.vote === "dislike"
                            ? "bg-orange-100 border-orange-600"
                            : "bg-white border-blue-600"
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-lg font-semibold text-[#202125]">
                            {dealers[index]?.Dealership
                              ? dealers[index]?.Dealership + " Offer"
                              : "No Dealership"}
                          </h3>

                          <VoteSection
                            bidDetails={bidDetails}
                            setIncomingBids={setIncomingBids}
                          />
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
                            onOpenChange={(isOpen) =>
                              setOpenDialog(
                                isOpen ? bidDetails.bid_id ?? "" : null
                              )
                            }
                          >
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <FileText className="mr-2 h-4 w-4" />
                                View Offer
                              </Button>
                            </DialogTrigger>
                            <DialogContent style={{ background: "white" }}>
                              <div className="text-[#202125] space-y-4">
                                <p className="text-2xl font-bold">
                                  {dealers[index]?.Dealership} Detail
                                </p>
                                <div className="flex space-x-4">
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
                                        className="bg-transparent cursor-pointer w-20 h-20 flex items-center justify-center rounded-md relative overflow-hidden"
                                      >
                                        {isImage ? (
                                          <img
                                            src={file}
                                            alt="Uploaded file"
                                            className="object-cover w-full h-full"
                                          />
                                        ) : (
                                          <embed
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
                                </div>

                                <div className="space-y-1">
                                  <p className="font-semibold text-lg">
                                    {dealers[index]?.SalesPersonName}
                                  </p>
                                  <p>
                                    {dealers[index]?.City}
                                    <br /> {dealers[index]?.State}
                                  </p>
                                  <span className="inline-flex items-center px-2 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full">
                                    {bidDetails?.inventoryStatus}
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
                                    <p className="text-2xl font-semibold">
                                      ${bidDetails.price}
                                    </p>
                                    <p className="text-gray-500">
                                      Total Discount: $
                                      {bidDetails.discountPrice}
                                    </p>
                                  </div>
                                </div>

                                <div className="border-t pt-4">
                                  <p className="font-semibold mb-2">
                                    Additional Comments
                                  </p>
                                  <p>{parseComment(bidDetails.comments)}</p>
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
                              <div
                                key={index}
                                className="p-2 bg-gray-100 rounded mt-1"
                              >
                                <p>
                                  <strong>
                                    {comment.deal_coordinator_name}:
                                  </strong>{" "}
                                  {comment.comment}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {comment.time}
                                </p>
                              </div>
                            )
                          )
                        ) : (
                          <p className="text-sm text-gray-500">
                            No comments available for this bid.
                          </p>
                        )}
                      </div>
                    ))
                ) : (
                  <p>No incoming bids available</p>
                )}
              </div>
            </CardContent>
          </Card>

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
