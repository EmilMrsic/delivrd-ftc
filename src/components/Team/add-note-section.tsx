import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { FileText } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage, UserAvatar } from "../ui/avatar";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";
import {
  addDoc,
  collection,
  doc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { DealNegotiator, IncomingBid } from "@/types";
import {
  getCurrentDateTime,
  getCurrentTimestamp,
  getUsersWithTeamPrivilege,
  sendNotification,
} from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { TailwindPlusCard } from "../tailwind-plus/card";
import {
  DealNegotiatorType,
  InternalNotesType,
  NegotiationDataType,
} from "@/lib/models/team";
import { TailwindPlusTextarea } from "../tailwind-plus/textarea";
import { v4 as uuidv4 } from "uuid";
import { createNotification } from "@/lib/helpers/notifications";
import { TailwindPlusToggle } from "../tailwind-plus/toggle";

type AddNoteSectionProps = {
  user: any;
  negotiation: NegotiationDataType | null;
  dealNegotiator?: DealNegotiator;
  // negotiationId: string;
  setNegotiation: (negotiation: NegotiationDataType) => void;
  incomingBids?: IncomingBid[];
  allDealNegotiator: DealNegotiatorType[];
  noUserActions?: boolean;
};

const AddNoteSection = ({
  noUserActions,
  user,
  negotiation,
  dealNegotiator,
  // negotiationId,
  incomingBids,
  allDealNegotiator,
  setNegotiation,
}: AddNoteSectionProps) => {
  // const [allInternalNotes, setAllInternalNotes] = useState<InternalNotesType[]>(
  //   []
  // );
  const [mentionedUsers, setMentionedUsers] = useState<DealNegotiatorType[]>(
    []
  );
  const [newInternalNote, setNewInternalNote] = useState<string>("");
  const [mentionSuggestions, setMentionSuggestions] = useState<
    DealNegotiatorType[]
  >([]);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState<number>(-1);

  const [isMentioning, setIsMentioning] = useState<boolean>(false);

  // const fetchBidNotes = async (negotiation_id: string) => {
  //   const notesRef = collection(db, "internal notes"); // Reference to "internal notes" collection
  //   let negotiationNotesData: InternalNotes[] = [];

  //   try {
  //     // Query notes based on the provided "negotiation_id"
  //     const notesQuery = query(
  //       notesRef,
  //       where("negotiation_id", "==", negotiation_id)
  //     );
  //     const notesSnap = await getDocs(notesQuery);

  //     if (!notesSnap.empty) {
  //       notesSnap.forEach((doc) => {
  //         const notesData = doc.data() as InternalNotes;
  //         negotiationNotesData.push(notesData);
  //       });
  //     } else {
  //       console.warn(`No notes found for negotiation ID ${negotiation_id}`);
  //     }
  //   } catch (error) {
  //     console.error(
  //       `Error fetching notes for negotiation ID ${negotiation_id}:`,
  //       error
  //     );
  //   }

  //   setAllInternalNotes(negotiationNotesData); // Update the state with fetched notes
  // };

  const handleMentionSelect = (mention: DealNegotiatorType) => {
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
    } else if (e.key === "Enter") {
      let indexToUse = selectedMentionIndex === -1 ? 0 : selectedMentionIndex;
      handleMentionSelect(mentionSuggestions[indexToUse]);
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
      if (negotiation) {
        const newNote: InternalNotesType = {
          author: user,
          mentionedTeammember: mentionedUsers
            .map((mentionedUser) => mentionedUser.id)
            .join(","),
          createdAt: getCurrentDateTime(),
          text: newInternalNote,
          noteId: uuidv4(),
        };
        setNegotiation({
          ...negotiation,
          internalNotes: [...(negotiation.internalNotes ?? []), newNote],
        });

        const notesRef = doc(db, "delivrd_negotiations", negotiation.id);
        await updateDoc(notesRef, {
          internalNotes: [...(negotiation.internalNotes ?? []), newNote],
        });

        mentionedUsers.forEach(async (mentionedUser) => {
          await createNotification(mentionedUser.id, "internal_note", {
            negotiationId: negotiation.id,
            author: user.id,
            noteId: newNote.noteId,
          });
        });

        setMentionedUsers([]);
        setNewInternalNote("");

        toast({ title: "Note added successfully" });
      } else {
        console.warn("Some required data is missing.");
      }
    }
  };

  return (
    <TailwindPlusCard
      title="Internal Notes"
      icon={FileText}
      actions={() => (
        <>
          <TailwindPlusToggle
            label="Flagged"
            checked={negotiation?.priority}
            onToggle={async (value) => {
              if (negotiation) {
                setNegotiation({ ...negotiation, priority: value });
                await updateDoc(
                  doc(db, "delivrd_negotiations", negotiation.id),
                  { priority: value }
                );
              }
            }}
          />
        </>
      )}
    >
      <div className="space-y-4 mb-4 max-h-60 overflow-y-auto">
        {negotiation?.internalNotes
          ?.sort((a, b) => {
            const dateA = Date.parse(a.createdAt);
            const dateB = Date.parse(b.createdAt);
            return dateB - dateA; // Newest to oldest
          })

          .map((note, index) => {
            return (
              <div key={index} className="flex items-start space-x-3">
                <UserAvatar
                  user={{
                    name: (note?.author?.name && note.author.name[0]) ?? "",
                    profile_pic: note.author?.profile_pic ?? "",
                  }}
                />
                {/* <Avatar className="h-10 w-10">
                  <AvatarImage
                    src={user[0]}
                    alt={user.name[0]}
                    className="rounded-full"
                  />
                  <AvatarFallback>{user.name[0]}</AvatarFallback>
                </Avatar> */}
                <div
                  className={`p-3 rounded-lg flex-grow ${
                    negotiation?.userId === note.author?.name
                      ? "bg-blue-100"
                      : "bg-gray-100"
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-semibold">{note.author.name}</p>
                    <p className="text-xs text-gray-500">{note.createdAt}</p>
                  </div>
                  <p>{note.text}</p>
                </div>
              </div>
            );
          })}
      </div>
      {!noUserActions && (
        <div className="space-x-2">
          <TailwindPlusTextarea
            placeholder="Add a note..."
            value={newInternalNote}
            onChange={handleInputChange}
            onKeyDown={handleKeyboardNavigation}

            // className="flex-grow"
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
          <div className="flex justify-end mt-4">
            <Button onClick={() => addInternalNote(newInternalNote)}>
              Add Note
            </Button>
          </div>
        </div>
      )}
    </TailwindPlusCard>
  );
};

export default AddNoteSection;
