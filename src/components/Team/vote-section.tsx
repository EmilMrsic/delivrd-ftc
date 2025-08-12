import React from "react";
import { Button } from "../ui/button";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { toast } from "@/hooks/use-toast";
import { IncomingBid } from "@/types";
import useTeamProfile from "@/hooks/useTeamProfile";

type VoteSectionProps = {
  bidDetails: IncomingBid;
  setIncomingBid: (item: IncomingBid[]) => void;
  incomingBid: IncomingBid[];
  clientMode?: boolean;
};

const VoteSection = ({
  bidDetails,
  setIncomingBid,
  incomingBid,
  clientMode,
}: VoteSectionProps) => {
  const handleVote = async (bid_id: string, value: number) => {
    try {
      const bidsQuery = query(
        collection(db, "Incoming Bids"),
        where("bid_id", "==", bid_id)
      );
      const querySnapshot = await getDocs(bidsQuery);

      if (querySnapshot.empty) {
        return;
      }

      const docSnap = querySnapshot.docs[0];

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

      setIncomingBid(
        incomingBid.map((bid: IncomingBid) =>
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
  return (
    <div className="flex space-x-2">
      {!(clientMode || (clientMode && bidDetails.vote === "like")) && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (!clientMode) {
              handleVote(bidDetails.bid_id, 1);
            }
          }}
          className={
            bidDetails.vote && bidDetails.vote === "like"
              ? "bg-green-500 text-white"
              : ""
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
          onClick={() => handleVote(bidDetails.bid_id, -1)}
          className={
            bidDetails.vote && bidDetails.vote === "dislike"
              ? "bg-yellow-500 text-white"
              : ""
          }
        >
          <ThumbsDown className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
};

export default VoteSection;
