import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { FileText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import { addDoc, collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase/config";
import {
  DealNegotiator,
  EditNegotiationData,
  IncomingBid,
  InternalNotes,
} from "@/types";
import {
  getCurrentDateTime,
  getCurrentTimestamp,
  getUsersWithTeamPrivilege,
  sendNotification,
} from "@/lib/utils";
import { toast } from "@/hooks/use-toast";

type AddNoteSectionProps = {
  user: any;
  negotiation: EditNegotiationData | null;
  dealNegotiator?: DealNegotiator;
  negotiationId: string;
  incomingBids: IncomingBid[];
  allDealNegotiator: DealNegotiator[];
};

const AddNoteSection = ({
  user,
  negotiation,
  dealNegotiator,
  negotiationId,
  incomingBids,
  allDealNegotiator,
}: AddNoteSectionProps) => {
  const [allInternalNotes, setAllInternalNotes] = useState<InternalNotes[]>([]);
  const [mentionedUsers, setMentionedUsers] = useState<DealNegotiator[]>([]);
  const [newInternalNote, setNewInternalNote] = useState<string>("");
  const [mentionSuggestions, setMentionSuggestions] = useState<
    DealNegotiator[]
  >([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState<number>(-1);

  const [isMentioning, setIsMentioning] = useState<boolean>(false);

  const fetchBidNotes = async (negotiation_id: string) => {
    const notesRef = collection(db, "internal notes"); // Reference to "internal notes" collection
    let negotiationNotesData: InternalNotes[] = [];

    try {
      // Query notes based on the provided "negotiation_id"
      const notesQuery = query(
        notesRef,
        where("negotiation_id", "==", negotiation_id)
      );
      const notesSnap = await getDocs(notesQuery);

      if (!notesSnap.empty) {
        notesSnap.forEach((doc) => {
          const notesData = doc.data() as InternalNotes;
          negotiationNotesData.push(notesData);
        });
      } else {
        console.warn(`No notes found for negotiation ID ${negotiation_id}`);
      }
    } catch (error) {
      console.error(
        `Error fetching notes for negotiation ID ${negotiation_id}:`,
        error
      );
    }

    setAllInternalNotes(negotiationNotesData); // Update the state with fetched notes
  };

  const handleMentionSelect = (mention: DealNegotiator) => {
    const newNote =
      newInternalNote.substring(0, newInternalNote.lastIndexOf("@")) +
      `@${mention.name} `;
    setNewInternalNote(newNote);
    setIsMentioning(false);
    setMentionSuggestions([]);
    setSelectedMentionIndex(-1);
    setMentionedUsers((prev) => [...prev, mention]);
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

  const addInternalNote = async (newInternalNote: string) => {
    if (newInternalNote.trim()) {
      const teamMembers = await getUsersWithTeamPrivilege();
      if (negotiation && dealNegotiator) {
        let newNote = {
          sender: user,
          mentioned_user: mentionedUsers,
          client:
            negotiation?.clientInfo?.negotiations_Client ?? "Unknown Client",
          deal_coordinator: dealNegotiator?.id ?? "Unknown ID",
          deal_coordinator_name: dealNegotiator?.name ?? "Unknown Name",
          negotiation_id: negotiationId ?? "Unknown Negotiation ID",
          note: newInternalNote,
          time: getCurrentDateTime() ?? "Unknown Time",
        };
        setAllInternalNotes((prevNotes: InternalNotes[]) => [
          ...prevNotes,
          newNote,
        ]);
        const notesRef = collection(db, "internal notes");
        await addDoc(notesRef, newNote);
        const teamWithToken = teamMembers.filter((item) => item.fcmToken);
        teamWithToken.forEach((item) => {
          if (item.fcmToken) {
            sendNotification(
              item.fcmToken,
              `${negotiation.clientInfo.negotiations_Client} added a note`,
              newInternalNote,
              window.location.href
            );
          }
        });
        setNewInternalNote("");
        setMentionedUsers([]);

        toast({ title: "Note added successfully" });
      } else {
        console.warn("Some required data is missing.");
      }
    }
  };

  useEffect(() => {
    fetchBidNotes(negotiationId ?? "");
  }, [negotiationId]);

  return (
    <Card className="bg-white shadow-lg">
      <CardHeader className="bg-gradient-to-r from-[#0989E5] to-[#202125] text-white">
        <CardTitle className="flex items-center">
          <FileText className="mr-2" /> Internal Notes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4 mb-4 ">
          {allInternalNotes
            .sort((a, b) => {
              const dateA = Date.parse(a.time);
              const dateB = Date.parse(b.time);
              return dateB - dateA; // Newest to oldest
            })

            .map((note, index) => (
              <div key={index} className="flex items-start space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user[0]} alt={user.name[0]} />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar>
                <div
                  className={`p-3 rounded-lg flex-grow ${
                    note.client === user.name ? "bg-blue-100" : "bg-gray-100"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-semibold">{user.name}</p>
                    <p className="text-xs text-gray-500">{note.time}</p>
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
  );
};

export default AddNoteSection;
