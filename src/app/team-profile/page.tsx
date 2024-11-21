"use client";
import { useState, useEffect, Suspense } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import {
  FileText,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Send,
  UploadIcon,
} from "lucide-react";

import { useSearchParams } from "next/navigation";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { DealNegotiator, EditNegotiationData, IncomingBid } from "@/types";
import { formatDate, mapNegotiationData } from "@/lib/utils";
import FeatureDetails from "@/components/Team/Feature-details";
import StickyHeader from "@/components/Team/Sticky-header";
import ClientDetails from "@/components/Team/Client-details";
import ManualBidUpload from "@/components/Team/Manual-bid-upload-modal";

interface VoteState {
  [key: string]: number;
}

interface CommentState {
  [key: string]: string[];
}

type ActivityLog = {
  timestamp: string;
  action: string;
  user: string;
}[];

type OfferDetails = {
  [key: string]: any;
};

function ProjectProfile() {
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const params = useSearchParams();
  const negotiationId = params.get("id");
  const [negotiation, setNegotiation] = useState<EditNegotiationData | null>(
    null
  );
  const [dealNegotiator, setDealNegotiator] = useState<DealNegotiator>();
  const [incomingBids, setIncomingBids] = useState<IncomingBid[]>([]);

  const [comments, setComments] = useState<CommentState>({
    "Honda World": [
      "This offer seems to be the best value for money.",
      "The warranty package is quite comprehensive.",
      "I like the free maintenance for the first year.",
    ],
    "AutoNation Honda": [
      "The higher trim level might be worth considering.",
      "The panoramic sunroof is a nice feature.",
    ],
    "Honda of Downtown": [],
  });
  const [votes, setVotes] = useState<VoteState>({
    "Honda World": 1,
    "AutoNation Honda": 1,
    "Honda of Downtown": 1,
  });
  const [newComment, setNewComment] = useState("");
  const [commentingDealership, setCommentingDealership] = useState<
    string | null
  >(null);
  const [activityLog, setActivityLog] = useState<ActivityLog>([
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
  const [internalNotes, setInternalNotes] = useState([
    {
      user: "Troy Paul",
      avatar: "/placeholder.svg?height=40&width=40",
      timestamp: "2023-07-15 11:30:00",
      message:
        "Let's focus on the Honda World offer. It seems the most promising.",
    },
    {
      user: "Sarah Johnson",
      avatar: "/placeholder.svg?height=40&width=40",
      timestamp: "2023-07-15 12:15:00",
      message: "Agreed. I'll prepare some additional negotiation points.",
    },
  ]);
  const [newInternalNote, setNewInternalNote] = useState("");

  const [showStickyHeader, setShowStickyHeader] = useState(false);

  const addComment = (dealership: string) => {
    if (newComment.trim()) {
      setComments((prevComments) => ({
        ...prevComments,
        [dealership]: [...(prevComments[dealership] || []), newComment],
      }));
      setActivityLog((prevLog) => [
        {
          timestamp: new Date().toLocaleString(),
          action: `Comment added to ${dealership} offer`,
          user: "Troy Paul",
        },
        ...prevLog,
      ]);
      setNewComment("");
      setCommentingDealership(null);
    }
  };

  const handleChange = (
    parentKey: string,
    childKey: string,
    newValue: string
  ) => {
    setNegotiation((prevState: any) => {
      const updatedParent = {
        ...prevState[parentKey],
        [childKey]: newValue,
      };
      return {
        ...prevState,
        [parentKey]: updatedParent,
      };
    });
  };

  const handleVote = (dealership: string, value: number) => {
    setVotes((prevVotes) => ({
      ...prevVotes,
      [dealership]: value,
    }));
    setActivityLog((prevLog) => [
      {
        timestamp: new Date().toLocaleString(),
        action: `${value > 0 ? "Liked" : "Disliked"} ${dealership} offer`,
        user: "Troy Paul",
      },
      ...prevLog,
    ]);
  };

  const sendUpdate = (dealership: string) => {
    setActivityLog((prevLog) => [
      {
        timestamp: new Date().toLocaleString(),
        action: `Update sent for ${dealership} offer`,
        user: "Troy Paul",
      },
      ...prevLog,
    ]);
  };

  const getCardBorderColor = (vote: number) => {
    if (vote === 1) return "border-l-green-500";
    if (vote === -1) return "border-l-yellow-500";
    return "border-l-blue-500";
  };

  const getCommentColor = (vote: number) => {
    if (vote === 1) return "bg-green-50";
    if (vote === -1) return "bg-yellow-50";
    return "bg-blue-50";
  };

  const addInternalNote = () => {
    if (newInternalNote.trim()) {
      setInternalNotes((prevNotes) => [
        ...prevNotes,
        {
          user: "Troy Paul",
          avatar: "/placeholder.svg?height=40&width=40",
          timestamp: new Date().toLocaleString(),
          message: newInternalNote,
        },
      ]);
      setNewInternalNote("");
    }
  };

  const offerDetails: OfferDetails = {
    "Honda World": {
      images: [
        "/placeholder.svg?height=200&width=300",
        "/placeholder.svg?height=200&width=300",
        "/placeholder.svg?height=200&width=300",
      ],
      details:
        "This Honda CR-V EX-L AWD is in excellent condition with low mileage. It comes with a comprehensive warranty package and free maintenance for the first year. The leather interior is well-maintained, and all safety features are up-to-date. This offer represents the best value for the client's budget.",
    },
    "AutoNation Honda": {
      images: [
        "/placeholder.svg?height=200&width=300",
        "/placeholder.svg?height=200&width=300",
      ],
      details:
        "The AutoNation Honda offer includes a slightly higher-trim CR-V with additional features like a panoramic sunroof and upgraded sound system. While it's slightly above budget, the extra features might justify the cost for some clients. The dealership is also offering an extended warranty at a discounted rate.",
    },
    "Honda of Downtown": {
      images: [
        "/placeholder.svg?height=200&width=300",
        "/placeholder.svg?height=200&width=300",
      ],
      details:
        "This offer from Honda of Downtown is for a brand new CR-V with all the latest features. While it's above the client's budget, they're including several premium add-ons like all-weather floor mats, a cargo cover, and a roof rack. The higher price also comes with a more comprehensive warranty package.",
    },
  };

  useEffect(() => {
    const getNegotiation = async () => {
      if (!negotiationId) return;

      try {
        const negotiationDocRef = doc(db, "negotiations", negotiationId);

        const docSnap = await getDoc(negotiationDocRef);

        if (docSnap.exists()) {
          setNegotiation(mapNegotiationData(docSnap.data()));
        } else {
          console.log("No such negotiation!");
        }
      } catch (error) {
        console.error("Error fetching negotiation:", error);
      }
    };

    getNegotiation();
  }, [negotiationId]);

  useEffect(() => {
    const getDealNegotiatorData = async () => {
      if (!negotiation?.clientInfo?.negotiations_deal_coordinator) return;

      try {
        const teamDocRef = query(
          collection(db, "team delivrd"),
          where(
            "id",
            "==",
            negotiation?.clientInfo?.negotiations_deal_coordinator
          )
        );

        const querySnapshot = await getDocs(teamDocRef);

        if (!querySnapshot.empty) {
          const firstDoc = querySnapshot.docs[0];
          setDealNegotiator(firstDoc.data() as DealNegotiator);
        } else {
          console.log("No deal negotiator!");
        }
      } catch (error) {
        console.error("Error fetching negotiation:", error);
      }
    };

    getDealNegotiatorData();
  }, [negotiation]);

  useEffect(() => {
    const getBidsByIds = async (bidIds: string[]) => {
      if (!bidIds || bidIds.length === 0) {
        console.log("No bids to fetch.");
        return;
      }

      try {
        const incomingBidsCollection = collection(db, "Incoming Bids");

        const bidsPromises = bidIds.map(async (bidId: string) => {
          const bidsQuery = query(
            incomingBidsCollection,
            where("bid_id", "==", bidId)
          );

          const querySnapshot = await getDocs(bidsQuery);

          if (!querySnapshot.empty) {
            return querySnapshot.docs[0].data();
          } else {
            console.log(`No bid found for bid_id: ${bidId}`);
            return null;
          }
        });

        const bidsData = await Promise.all(bidsPromises);

        const validBids: IncomingBid[] = bidsData.filter(
          (bid) => bid !== null
        ) as IncomingBid[];

        setIncomingBids(validBids);
        console.log("Found Incoming Bids:", validBids);
      } catch (error) {
        console.error("Error fetching incoming bids:", error);
      }
    };

    getBidsByIds(negotiation?.otherData?.incoming_bids ?? []);
  }, [negotiation]);

  const parseComment = (comment: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;

    return comment.split(urlRegex).map((part: string, index: number) => {
      if (urlRegex.test(part)) {
        return (
          <a
            key={index}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };
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
        <div className="text-right">
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
              <>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="mr-2" />
                    Incoming Bids
                  </div>
                  <div className="flex items-center">
                    <ManualBidUpload id={negotiationId} />
                  </div>
                </CardTitle>
              </>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-8">
                {incomingBids?.map((bidDetails, index) => (
                  <div
                    key={index}
                    className={`border-l-4 pl-4 pb-6 ${getCardBorderColor(5)}`}
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold text-[#202125]">
                        {Object.keys(offerDetails)[index]} Offer
                      </h3>
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleVote(Object.keys(offerDetails)[index], 1)
                          }
                          className={
                            votes[Object.keys(offerDetails)[index]] === 1
                              ? "bg-green-500 text-white"
                              : ""
                          }
                        >
                          <ThumbsUp className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            handleVote(Object.keys(offerDetails)[index], -1)
                          }
                          className={
                            votes[Object.keys(offerDetails)[index]] === -1
                              ? "bg-yellow-500 text-white"
                              : ""
                          }
                        >
                          <ThumbsDown className="h-4 w-4" />
                        </Button>
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
                        open={openDialog === Object.keys(offerDetails)[index]}
                        onOpenChange={(isOpen) =>
                          setOpenDialog(
                            isOpen ? Object.keys(offerDetails)[index] : null
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
                              {Object.keys(offerDetails)[index]} Detail
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
                                    onClick={() => window.open(file, "_blank")}
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
                                {dealNegotiator?.name}
                              </p>
                              <p>
                                City
                                <br /> State
                              </p>
                              <span className="inline-flex items-center px-2 py-1 text-sm font-medium text-green-700 bg-green-100 rounded-full">
                                {bidDetails?.inventoryStatus}
                              </span>
                            </div>

                            <div className="flex justify-between mt-4 border-t pt-4">
                              <div>
                                <p className="text-gray-500">Date Submitted</p>
                                <p>{formatDate(bidDetails.timestamp)}</p>
                              </div>
                              <div>
                                <p className="text-gray-500">Price</p>
                                <p className="text-2xl font-semibold">
                                  ${bidDetails.price}
                                </p>
                                <p className="text-gray-500">
                                  Total Discount: ${bidDetails.discountPrice}
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
                          setCommentingDealership(
                            Object.keys(offerDetails)[index]
                          )
                        }
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Comment
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          sendUpdate(Object.keys(offerDetails)[index])
                        }
                        className="bg-gradient-to-r from-orange-400 to-red-500 text-white hover:from-orange-500 hover:to-red-600"
                      >
                        <Send className="mr-2 h-4 w-4" />
                        Send Update
                      </Button>
                    </div>
                    {commentingDealership ===
                      Object.keys(offerDetails)[index] && (
                      <div className="mb-4">
                        <Textarea
                          placeholder="Add a comment..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="mb-2"
                        />
                        <Button
                          onClick={() =>
                            addComment(Object.keys(offerDetails)[index])
                          }
                        >
                          Submit Comment
                        </Button>
                      </div>
                    )}
                    {comments[Object.keys(offerDetails)[index]]?.map(
                      (comment, index) => (
                        <div
                          key={index}
                          className={`mt-2 p-2 rounded-md ${getCardBorderColor(
                            votes[Object.keys(offerDetails)[index]]
                          )} ${getCommentColor(
                            votes[Object.keys(offerDetails)[index]]
                          )}`}
                        >
                          <p className="text-sm text-gray-600">
                            <strong>{dealNegotiator?.name}:</strong> {comment}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#0989E5] to-[#202125] text-white">
              <CardTitle className="flex items-center">
                <FileText className="mr-2" /> Internal Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
                {internalNotes.map((note, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={note.avatar} alt={note.user} />
                      <AvatarFallback>{note.user[0]}</AvatarFallback>
                    </Avatar>
                    <div
                      className={`p-3 rounded-lg flex-grow ${
                        note.user === "Troy Paul"
                          ? "bg-blue-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-semibold">{note.user}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(note.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <p>{note.message}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <Textarea
                  placeholder="Add a note..."
                  value={newInternalNote}
                  onChange={(e) => setNewInternalNote(e.target.value)}
                  className="flex-grow"
                />
                <Button onClick={addInternalNote}>Add Note</Button>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#0989E5] to-[#202125] text-white">
              <CardTitle className="flex items-center">
                <FileText className="mr-2" /> Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <ul className="space-y-4">
                {activityLog.map((activity, index) => {
                  const date = new Date(activity.timestamp);
                  const formattedDate = date.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  });
                  const dayOfWeek = date.toLocaleDateString("en-US", {
                    weekday: "long",
                  });
                  return (
                    <li key={index} className="flex items-start">
                      <div className="w-3 h-3 rounded-full bg-orange-500 z-10 mr-4 mt-1.5"></div>
                      <div className="flex-grow">
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">{formattedDate}</span>
                          <br />
                          <span className="text-xs text-gray-400">
                            {dayOfWeek}
                          </span>
                          <br />
                          {activity.user}: {activity.action}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </CardContent>
          </Card>
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
