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
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import {
  BidComments,
  DealerData,
  DealNegotiator,
  EditNegotiationData,
  IncomingBid,
  InternalNotes,
} from "@/types";
import { formatDate, mapNegotiationData } from "@/lib/utils";
import FeatureDetails from "@/components/Team/Feature-details";
import StickyHeader from "@/components/Team/Sticky-header";
import ClientDetails from "@/components/Team/Client-details";
import ManualBidUpload from "@/components/Team/Manual-bid-upload-modal";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";

interface VoteState {
  [key: string]: number;
}

type ActivityLog = {
  timestamp: string;
  action: string;
  user: string;
}[];

type GroupedBidComments = {
  [bid_id: string]: BidComments[];
};

function getCurrentTimestamp() {
  const today = new Date();

  const day = String(today.getDate()).padStart(2, "0");
  const month = String(today.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
  const year = today.getFullYear();

  return `${month}/${day}/${year}`;
}

function ProjectProfile() {
  const [openDialog, setOpenDialog] = useState<string | null>(null);
  const params = useSearchParams();
  const negotiationId = params.get("id");
  const [negotiation, setNegotiation] = useState<EditNegotiationData | null>(
    null
  );
  const [allDealNegotiator, setAllDealNegotiator] = useState<DealNegotiator[]>(
    []
  );
  const [mentionSuggestions, setMentionSuggestions] = useState<
    DealNegotiator[]
  >([]);
  const [isMentioning, setIsMentioning] = useState<boolean>(false);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState<number>(-1);
  const [dealNegotiator, setDealNegotiator] = useState<DealNegotiator>();
  const [allInternalNotes, setAllInternalNotes] = useState<InternalNotes[]>([]);
  const [incomingBids, setIncomingBids] = useState<IncomingBid[]>([]);
  const [dealers, setDealers] = useState<DealerData[]>([]);
  const [bidCommentsByBidId, setBidCommentsByBidId] =
    useState<GroupedBidComments>({});

  const [votes, setVotes] = useState<VoteState>({
    "Honda World": 1,
    "AutoNation Honda": 1,
    "Honda of Downtown": 1,
  });
  const [newComment, setNewComment] = useState<{ [key: string]: string }>({});
  const [commentingBidId, setCommentingBidId] = useState<string | null>(null);

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

  const [newInternalNote, setNewInternalNote] = useState<string>("");

  const [showStickyHeader, setShowStickyHeader] = useState(false);

  const addComment = async (bid_id: string) => {
    if (!newComment[bid_id]?.trim()) return;

    const newCommentData: BidComments = {
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

  const handleVote = async (bid_id: string, value: number) => {
    try {
      const bidsQuery = query(
        collection(db, "Incoming Bids"),
        where("bid_id", "==", bid_id)
      );
      const querySnapshot = await getDocs(bidsQuery);

      if (querySnapshot.empty) {
        console.log("No matching bids found for bid_id:", bid_id);
        return;
      }

      const docSnap = querySnapshot.docs[0];

      console.log("Document data:", docSnap.data());

      let currentVote = null;

      if (docSnap.exists()) {
        currentVote = docSnap.data().vote;
      }

      const voteType =
        currentVote === (value === 1 ? "like" : "dislike")
          ? "neutral"
          : value === 1
          ? "like"
          : "dislike";

      const internalNotesRef = doc(db, "Incoming Bids", docSnap.id);

      await setDoc(
        internalNotesRef,
        {
          vote: voteType,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );

      console.log(`Vote for ${bid_id} set to ${voteType}`);
      setIncomingBids((prevState) =>
        prevState.map((bid) =>
          bid.bid_id === bid_id ? { ...bid, vote: voteType } : bid
        )
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
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const inputValue = e.target.value;
    setNewInternalNote(inputValue);

    const lastWord = inputValue.split(" ").pop() ?? "";
    if (lastWord.startsWith("@")) {
      setIsMentioning(true);
      const query = lastWord.slice(1);
      setMentionSuggestions(
        allDealNegotiator.filter((negotiator) =>
          negotiator.name.toLowerCase().includes(query.toLowerCase())
        )
      );
    } else {
      setIsMentioning(false);
      setMentionSuggestions([]);
    }
  };

  const handleMentionSelect = (mention: DealNegotiator) => {
    const newNote =
      newInternalNote.substring(0, newInternalNote.lastIndexOf("@")) +
      `@${mention.name} `;
    setNewInternalNote(newNote);
    setIsMentioning(false);
    setMentionSuggestions([]);
    setSelectedMentionIndex(-1);
  };

  const handleKeyboardNavigation = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ) => {
    if (
      e.key === "ArrowDown" &&
      selectedMentionIndex < mentionSuggestions.length - 1
    ) {
      setSelectedMentionIndex(selectedMentionIndex + 1);
    } else if (e.key === "ArrowUp" && selectedMentionIndex > 0) {
      setSelectedMentionIndex(selectedMentionIndex - 1);
    } else if (e.key === "Enter" && selectedMentionIndex >= 0) {
      handleMentionSelect(mentionSuggestions[selectedMentionIndex]);
    }
  };

  const addInternalNote = async (newInternalNote: string) => {
    if (newInternalNote.trim()) {
      if (incomingBids.length > 0 && negotiation && dealNegotiator) {
        let newNote = {
          bid_id: incomingBids[0]?.bid_id ?? "default_bid_id",
          client:
            negotiation?.clientInfo?.negotiations_Client ?? "Unknown Client",
          deal_coordinator: dealNegotiator?.id ?? "Unknown ID",
          deal_coordinator_name: dealNegotiator?.name ?? "Unknown Name",
          negotiation_id: negotiationId ?? "Unknown Negotiation ID",
          note: newInternalNote,
          time: getCurrentTimestamp() ?? "Unknown Time",
        };
        setAllInternalNotes((prevNotes: InternalNotes[]) => [
          ...prevNotes,
          newNote,
        ]);
        setNewInternalNote("");
        const notesRef = collection(db, "internal notes");
        await addDoc(notesRef, newNote);
        toast({ title: "Note added successfully" });
      } else {
        console.warn("Some required data is missing.");
      }
    }
  };

  const fetchDealers = async () => {
    const dealersData = [];

    for (const bid of incomingBids) {
      const id = bid.dealerId;

      try {
        const dealerRef = doc(db, "Dealers", id); // Adjust "Dealers" to match your Firestore collection name
        const dealerSnap = await getDoc(dealerRef);

        if (dealerSnap.exists()) {
          dealersData.push({ id: dealerSnap.id, ...dealerSnap.data() });
        } else {
          console.warn(`Dealer with ID ${id} not found`);
        }
      } catch (error) {
        console.error(`Error fetching dealer data for ID ${id}:`, error);
      }
    }

    return dealersData;
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
      } catch (error) {
        console.error("Error fetching incoming bids:", error);
      }
    };

    getBidsByIds(negotiation?.otherData?.incoming_bids ?? []);
  }, [negotiation]);

  const fetchBidComments = async () => {
    const groupedBidComments: GroupedBidComments = {};
    const bidCommentsRef = collection(db, "bid comment");

    for (const bid of incomingBids) {
      const bid_id = bid.bid_id;

      console.log(`Fetching bid comments for bid_id: ${bid_id}`);

      try {
        const bidCommentQuery = query(
          bidCommentsRef,
          where("bid_id", "==", bid_id)
        );

        const bidCommentSnap = await getDocs(bidCommentQuery);

        if (!bidCommentSnap.empty) {
          bidCommentSnap.forEach((doc) => {
            const bidCommentData = doc.data() as BidComments;

            if (!groupedBidComments[bid_id]) {
              groupedBidComments[bid_id] = [];
            }

            groupedBidComments[bid_id].push(bidCommentData);
          });
        } else {
          console.warn(`No comments found for bid ID ${bid_id}`);
        }
      } catch (error) {
        console.error(`Error fetching bid comment for ID ${bid_id}:`, error);
      }
    }

    setBidCommentsByBidId(groupedBidComments);
  };

  const fetchBidNotes = async () => {
    const bidNotesRef = collection(db, "internal notes");
    let bidNotesData: InternalNotes[] = [];

    for (const bid of incomingBids) {
      const bid_id = bid.bid_id;

      console.log(`Fetching bid comments for bid_id: ${bid_id}`);

      try {
        const bidNotesQuery = query(bidNotesRef, where("bid_id", "==", bid_id));

        const bidNotesSnap = await getDocs(bidNotesQuery);

        if (!bidNotesSnap.empty) {
          bidNotesSnap.forEach((doc) => {
            const notesData = doc.data() as InternalNotes;
            bidNotesData.push(notesData);
          });
        } else {
          console.warn(`No comments found for bid ID ${bid_id}`);
        }
      } catch (error) {
        console.error(`Error fetching bid comment for ID ${bid_id}:`, error);
      }
    }

    setAllInternalNotes(bidNotesData);
  };

  const getAllDealNegotiator = async () => {
    try {
      const teamCollection = collection(db, "team delivrd");

      const querySnapshot = await getDocs(teamCollection);

      const negotiatiatorData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      console.log("Fetched negotiations:", negotiatiatorData);
      return negotiatiatorData as DealNegotiator[];
    } catch (error) {
      console.log(error);
    }
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
    fetchDealers().then((res) => setDealers(res as DealerData[]));
    fetchBidComments();
    fetchBidNotes();
    getAllDealNegotiator().then((res) =>
      setAllDealNegotiator(res as DealNegotiator[])
    );
  }, [incomingBids]);

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
                {incomingBids.length ? (
                  incomingBids?.map((bidDetails, index) => (
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
                          {dealers[index]?.Dealership ?? ""} Offer
                        </h3>
                        <div className="flex space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVote(bidDetails.bid_id, 1)}
                            className={
                              bidDetails.vote && bidDetails.vote === "like"
                                ? "bg-green-500 text-white"
                                : ""
                            }
                          >
                            <ThumbsUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleVote(bidDetails.bid_id, -1)}
                            className={
                              bidDetails.vote && bidDetails.vote === "dislike"
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
                          open={openDialog === dealers[index]?.Dealership}
                          onOpenChange={(isOpen) =>
                            setOpenDialog(
                              isOpen ? dealers[index]?.Dealership ?? "" : null
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
                          <Button onClick={() => addComment(bidDetails.bid_id)}>
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

          <Card className="bg-white shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[#0989E5] to-[#202125] text-white">
              <CardTitle className="flex items-center">
                <FileText className="mr-2" /> Internal Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
                {allInternalNotes.map((note, index) => (
                  <div key={index} className="flex items-start space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage
                        src={negotiation?.clientInfo.negotiations_Client[0]}
                        alt={negotiation?.clientInfo.negotiations_Client[0]}
                      />
                      <AvatarFallback>
                        {negotiation?.clientInfo.negotiations_Client[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={`p-3 rounded-lg flex-grow ${
                        note.client ===
                        negotiation?.clientInfo.negotiations_Client
                          ? "bg-blue-100"
                          : "bg-gray-100"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <p className="font-semibold">
                          {negotiation?.clientInfo.negotiations_Client}
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(note.time).toLocaleString()}
                        </p>
                      </div>
                      <p>{note.note}</p>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex space-x-2">
                <Textarea
                  placeholder="Add a note..."
                  value={newInternalNote}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyboardNavigation}
                  className="flex-grow"
                />
                {isMentioning && mentionSuggestions.length > 0 && (
                  <div className="absolute z-10 mt-[50px] w-[250px] bg-white border border-gray-300 rounded-md shadow-lg">
                    <ul className="max-h-40 overflow-y-auto">
                      {mentionSuggestions.map((mention, index) => (
                        <li
                          key={mention.id}
                          onClick={() => handleMentionSelect(mention)}
                          className={`p-2 cursor-pointer ${
                            index === selectedMentionIndex ? "bg-gray-200" : ""
                          }`}
                        >
                          {mention.name}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <Button onClick={() => addInternalNote(newInternalNote)}>
                  Add Note
                </Button>
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
