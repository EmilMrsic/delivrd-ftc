import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Check, MoreHorizontal, StickyNoteIcon, X } from "lucide-react";
import { Button } from "../ui/button";
import { dateFormat, dealStageOptions, getElapsedTime } from "@/lib/utils";
import DealNegotiatorDialog from "./deal-negotiator-dialog";
import { DealNegotiator, InternalNotes, NegotiationData } from "@/types";
import { useRouter } from "next/navigation";
import { Loader } from "../base/loader";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { toast } from "@/hooks/use-toast";

const NOW = new Date(new Date().toISOString().split("T")[0]);

type TeamDashboardTableProps = {
  setStopPropagation: (item: boolean) => void;
  stopPropagation: boolean;
  currentDeals: NegotiationData[];
  setCurrentDeals: (item: NegotiationData[]) => void;
  handleStageChange: (id: string, newStage: string) => void;
  allInternalNotes: Record<string, InternalNotes[]>;
  allDealNegotiator: DealNegotiator[];
  updateDealNegotiator: (id: string, newNegotiatorId: string) => void;
  negotiatorData?: DealNegotiator;
  loading: boolean;
};

const TeamDashboardTable = ({
  setStopPropagation,
  stopPropagation,
  currentDeals,
  allInternalNotes,
  handleStageChange,
  allDealNegotiator,
  updateDealNegotiator,
  negotiatorData,
  loading,
  setCurrentDeals,
}: TeamDashboardTableProps) => {
  const router = useRouter();
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({});
  const [openNoteState, setOpenNoteStates] = useState<Record<string, boolean>>(
    {}
  );

  const [openNegotiatorState, setOpenNegotiatorState] = useState<
    Record<string, boolean>
  >({});

  const [sortConfig, setSortConfig] = useState({
    key: "submittedDate", // default sorting by Submitted Date
    direction: "ascending", // default direction
  });

  const toggleDropdown = (id: string, isOpen: boolean) => {
    setOpenStates((prev) => ({
      ...prev,
      [id]: isOpen,
    }));
  };

  const toggleNegotiatorDropdown = (id: string, isOpen: boolean) => {
    setOpenNegotiatorState((prev) => ({
      ...prev,
      [id]: isOpen,
    }));
  };

  const toggleInternalNotesDropdown = (id: string, isOpen: boolean) => {
    setOpenNoteStates((prev) => ({
      ...prev,
      [id]: isOpen,
    }));
  };

  const sortData = (key: string, direction: string) => {
    const sortedDeals = [...currentDeals].sort((a: any, b: any) => {
      const aValue = a[key];
      const bValue = b[key];

      if (aValue < bValue) {
        return direction === "ascending" ? -1 : 1;
      }
      if (aValue > bValue) {
        return direction === "ascending" ? 1 : -1;
      }
      return 0;
    });

    setCurrentDeals(sortedDeals);
  };

  async function handleAskForReview(id: string) {
    if (!id) return;
    console.log(id);
    try {
      const negotiationRef = doc(db, "negotiations", id);
      const docSnap = await getDoc(negotiationRef);

      if (docSnap.exists()) {
        console.log("here");
        await updateDoc(negotiationRef, { review: "Review Request Sent" });
      } else {
        await setDoc(
          negotiationRef,
          { review: "Review Request Sent" },
          { merge: true }
        );
      }

      toast({ title: "Review Request Sent" });
      setCurrentDeals(
        currentDeals.map((deal) =>
          deal.id === id ? { ...deal, review: "Review Request Sent" } : deal
        )
      );
    } catch (error) {
      console.error("Error updating review status:", error);
      toast({ title: "Failed to send review request" });
    }
  }

  return (
    <Table className="overflow-visible">
      <TableHeader>
        <TableRow>
          <TableHead>Client</TableHead>
          <TableHead>Make</TableHead>
          <TableHead>Model</TableHead>
          <TableHead>Stage</TableHead>
          <TableHead>State</TableHead>
          <TableHead>Deal Negotiator</TableHead>
          <TableHead>Onboarding Complete</TableHead>
          <TableHead>
            Submitted Date
            <button
              onClick={() => {
                const direction =
                  sortConfig.key === "submittedDate" &&
                  sortConfig.direction === "ascending"
                    ? "descending"
                    : "ascending";
                setSortConfig({ key: "submittedDate", direction });
                sortData("negotiations_Created", direction);
              }}
            >
              {sortConfig.key === "submittedDate" ? (
                sortConfig.direction === "ascending" ? (
                  <span>↑</span>
                ) : (
                  <span>↓</span>
                )
              ) : (
                <span>↕</span>
              )}
            </button>
          </TableHead>{" "}
          <TableHead>
            Last Update
            <button
              onClick={() => {
                const direction =
                  sortConfig.key === "lastUpdate" &&
                  sortConfig.direction === "ascending"
                    ? "descending"
                    : "ascending";
                setSortConfig({ key: "lastUpdate", direction });
                sortData("negotiations_Status_Updated", direction);
              }}
            >
              {sortConfig.key === "lastUpdate" ? (
                sortConfig.direction === "ascending" ? (
                  <span>↑</span>
                ) : (
                  <span>↓</span>
                )
              ) : (
                <span>↕</span>
              )}
            </button>
          </TableHead>{" "}
          <TableHead>
            Start Date
            <button
              onClick={() => {
                const direction =
                  sortConfig.key === "startDate" &&
                  sortConfig.direction === "ascending"
                    ? "descending"
                    : "ascending";
                setSortConfig({ key: "startDate", direction });
                sortData("negotiations_Deal_Start_Date", direction);
              }}
            >
              {sortConfig.key === "startDate" ? (
                sortConfig.direction === "ascending" ? (
                  <span>↑</span>
                ) : (
                  <span>↓</span>
                )
              ) : (
                <span>↕</span>
              )}
            </button>
          </TableHead>{" "}
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      {loading ? (
        <TableBody>
          <TableRow>
            <TableCell colSpan={11} className="text-center py-4">
              <Loader />
            </TableCell>
          </TableRow>
        </TableBody>
      ) : currentDeals?.length ? (
        <TableBody>
          {currentDeals?.map((deal, index) => (
            <TableRow
              className={`cursor-pointer ${
                index % 2 === 0
                  ? "bg-white hover:bg-gray-100"
                  : "bg-gray-50 hover:bg-gray-200"
              }`}
              key={deal.id}
              onClick={(e) => {
                if (!stopPropagation) {
                  e.preventDefault();
                  e.stopPropagation();
                  router.push(`/team-profile?id=${deal.id}`);
                } else {
                  setStopPropagation(false);
                }
              }}
            >
              <TableCell className="font-medium max-w-[220px]">
                <span>{deal.negotiations_Client}</span>
                {allInternalNotes[deal?.id]?.length > 0 && (
                  <DropdownMenu
                    open={openNoteState[deal.id] || false}
                    onOpenChange={(isOpen) =>
                      toggleInternalNotesDropdown(deal.id, isOpen)
                    }
                  >
                    <DropdownMenuTrigger asChild>
                      <StickyNoteIcon
                        height={15}
                        width={15}
                        className="ml-2 text-gray-500 cursor-pointer"
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      side="right"
                      className="w-56 max-h-56 overflow-auto bg-white border border-gray-300 shadow-lg rounded-md p-2"
                    >
                      <p className="text-lg font-bold">Notes</p>
                      {allInternalNotes[deal.id].map((note, index) => (
                        <DropdownMenuItem
                          key={index}
                          className=" hover:bg-gray-100 rounded p-1"
                        >
                          <div className="flex flex-col">
                            <p className="text-black">{note.note}</p>
                            <p className="text-gray-700">{note.time}</p>
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </TableCell>

              <TableCell className="max-w-[180px]">
                {deal.negotiations_Brand}
              </TableCell>

              <TableCell>{deal.negotiations_Model}</TableCell>

              <TableCell>
                <DropdownMenu
                  open={openStates[deal.id] || false}
                  onOpenChange={(isOpen) => toggleDropdown(deal.id, isOpen)}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className={`cursor-pointer p-1 w-fit h-fit text-xs bg-gray-100 text-gray-800 border-gray-300`}
                    >
                      <p>{deal.negotiations_Status}</p>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 h-56 overflow-scroll">
                    {dealStageOptions.map((stage: string) => (
                      <DropdownMenuItem
                        key={stage}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStageChange(deal.id, stage); // Update stage
                          toggleDropdown(deal.id, false);
                        }}
                      >
                        {stage}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>

              <TableCell>{deal.negotiations_state}</TableCell>

              <TableCell>
                <DropdownMenu
                  open={openNegotiatorState[deal.id] || false}
                  onOpenChange={(isOpen) =>
                    toggleNegotiatorDropdown(deal.id, isOpen)
                  }
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className={`cursor-pointer p-1 w-fit h-fit text-xs bg-gray-100 text-gray-800 border-gray-300`}
                    >
                      {allDealNegotiator.some(
                        (negotiator) =>
                          negotiator.id === deal.negotiations_deal_coordinator
                      ) ? (
                        <p>
                          {
                            allDealNegotiator.find(
                              (negotiator) =>
                                negotiator.id ===
                                deal.negotiations_deal_coordinator
                            )?.name
                          }
                        </p>
                      ) : (
                        <p>Not Assigned</p>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56 h-56 overflow-scroll">
                    {allDealNegotiator.map(
                      (negotiator: DealNegotiator, index) => (
                        <DropdownMenuItem
                          key={index}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            updateDealNegotiator(deal.id, negotiator.id);
                            toggleNegotiatorDropdown(deal.id, false);
                          }}
                        >
                          {negotiator.name}
                        </DropdownMenuItem>
                      )
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
              <TableCell className="text-center">
                {deal?.negotiations_Onboarding_Complete &&
                deal?.negotiations_Onboarding_Complete?.toLowerCase() ===
                  "yes" ? (
                  <Check className="text-green-500" />
                ) : (
                  <X className="text-red-500" />
                )}
              </TableCell>
              <TableCell>
                <div>{dateFormat(deal.negotiations_Created ?? "")}</div>
                <div className="text-xs text-[#0989E5]">
                  {getElapsedTime(deal.negotiations_Created ?? "", NOW)}
                </div>
              </TableCell>

              <TableCell>
                <div>{dateFormat(deal.negotiations_Status_Updated ?? "")}</div>
                <div className="text-xs text-[#0989E5]">
                  {getElapsedTime(deal.negotiations_Status_Updated ?? "", NOW)}
                </div>
              </TableCell>
              <TableCell>
                <div>{dateFormat(deal.negotiations_Deal_Start_Date ?? "")}</div>
                <div className="text-xs text-[#0989E5]">
                  {getElapsedTime(deal.negotiations_Deal_Start_Date ?? "", NOW)}
                </div>
              </TableCell>

              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DealNegotiatorDialog
                      setStopPropogation={setStopPropagation}
                      deal={deal}
                      dealNegotiator={negotiatorData}
                      formatDate={dateFormat}
                    />
                    <p
                      onClick={(e) => {
                        if (!deal.review) {
                          e.stopPropagation();
                          handleAskForReview(deal.id);
                        } else {
                          e.stopPropagation();
                          toast({ title: "Already Review Request Send" });
                        }
                      }}
                      className="text-sm pl-4 pr-1 py-1 cursor-pointer"
                    >
                      Ask For Review
                    </p>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      ) : (
        <TableBody>
          <TableRow>
            <TableCell colSpan={11} className="text-center py-4">
              <p>No Data Found</p>
            </TableCell>
          </TableRow>
        </TableBody>
      )}
    </Table>
  );
};

export default TeamDashboardTable;
