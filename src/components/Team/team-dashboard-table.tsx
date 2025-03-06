import React, { useEffect, useState } from "react";
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

import "react-datepicker/dist/react-datepicker.css";
import { Check, MoreHorizontal, StickyNoteIcon, X } from "lucide-react";
import { Button } from "../ui/button";
import {
  dateFormat,
  dealStageOptions,
  getElapsedTime,
  getStatusStyles,
} from "@/lib/utils";
import DealNegotiatorDialog from "./deal-negotiator-dialog";
import { DealNegotiator, InternalNotes, NegotiationData } from "@/types";
import { useRouter } from "next/navigation";
import { Loader } from "../base/loader";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { toast } from "@/hooks/use-toast";
import DatePickerCell from "./datepicker-cell";
import ShippingInfoDialog from "./shipping-info-dialog";
import ManualBidUpload from "./Manual-bid-upload-modal";
import { TailwindPlusTable } from "../tailwind-plus/table";
import { StageDropdown } from "./stage-dropdown";
import { DealNegotiatorDropdown } from "./deal-negotiator-dropdown";
import { DashboardTableActions } from "./dashboard-table-actions";

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
      let aValue = a[key];
      let bValue = b[key];

      if (typeof aValue === "string") aValue = aValue.toLowerCase();
      if (typeof bValue === "string") bValue = bValue.toLowerCase();

      if (aValue < bValue) return direction === "ascending" ? -1 : 1;
      if (aValue > bValue) return direction === "ascending" ? 1 : -1;
      return 0;
    });

    setCurrentDeals(sortedDeals);
  };

  const handleDateChange = async (
    date: string,
    dealId: string,
    dateType: string
  ) => {
    const id = dealId;

    // Update the deal in the local state first
    const updatedDeals = currentDeals.map((deal) =>
      deal.id === dealId ? { ...deal, [dateType]: date } : deal
    );

    const negotiationRef = doc(db, "negotiations", id);
    const docSnap = await getDoc(negotiationRef);
    if (docSnap.exists()) {
      await updateDoc(negotiationRef, {
        [dateType]: date,
      });
      setCurrentDeals(updatedDeals);
    }

    toast({ title: "Negotiation Updated" });
  };

  async function handleAskForReview(id: string) {
    if (!id) return;

    try {
      const dealData = currentDeals.find((item) => item.id === id);

      const updatedDeal = {
        ...dealData,
        review: "Review Request Sent",
      };

      // Send the updated deal to the Cloud Function
      const response = await fetch(
        process.env.NEXT_PUBLIC_REVIEW_FUNC_URL ?? "",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedDeal),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast({ title: "Review Request Sent" });
      } else {
        console.error("Failed to send review request:", result.error);
        toast({
          title: "Failed to send review request",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error requesting review:", error);
      toast({ title: "Failed to send review request", variant: "destructive" });
    }
  }

  return (
    <>
      <TailwindPlusTable
        headers={[
          {
            header: "Client",
            config: {
              sortable: true,
            },
          },
          "Make",
          "Model",
          "Stage",
          "Zip Code",
          "Deal Negotiator",
          "Onboarding Complete",
          "Date Paid",
          "Arrival To Dealer",
          "Start Date",
          "Arrival To Client",
          "Close Date",
          "Actions",
        ]}
        rows={
          currentDeals && currentDeals.length > 0
            ? currentDeals.slice(0, 10).map((deal) => [
                {
                  text: deal.negotiations_Client,
                  config: {
                    maxWidth: "200px",
                  },
                },
                deal.negotiations_Brand,
                deal.negotiations_Model,
                {
                  Component: () => (
                    <StageDropdown
                      deal={deal}
                      handleStageChange={handleStageChange}
                      dealStageOptions={dealStageOptions}
                      getStatusStyles={getStatusStyles}
                      toggleDropdown={toggleDropdown}
                      openStates={openStates}
                    />
                  ),
                },
                deal.negotiations_Zip_Code,
                {
                  Component: () => (
                    <DealNegotiatorDropdown
                      deal={deal}
                      allDealNegotiator={allDealNegotiator}
                      updateDealNegotiator={updateDealNegotiator}
                      toggleNegotiatorDropdown={toggleNegotiatorDropdown}
                      openNegotiatorState={openNegotiatorState}
                    />
                  ),
                },
                {
                  Component: () =>
                    deal?.negotiations_Onboarding_Complete &&
                    deal?.negotiations_Onboarding_Complete?.toLowerCase() ===
                      "yes" ? (
                      <Check className="text-green-500" />
                    ) : (
                      <X className="text-red-500" />
                    ),
                },
                {
                  Component: () => (
                    <>
                      <div>{dateFormat(deal.date_paid ?? "")}</div>
                      <div className="text-xs text-[#0989E5]">
                        {getElapsedTime(deal.date_paid ?? "", NOW)}
                      </div>
                    </>
                  ),
                },
                {
                  Component: () => (
                    <DatePickerCell
                      initialDate={deal.arrival_to_dealer}
                      onDateChange={(date) =>
                        handleDateChange(
                          date ?? "",
                          deal.id,
                          "arrival_to_dealer"
                        )
                      }
                    />
                  ),
                },
                {
                  Component: () => (
                    <DatePickerCell
                      initialDate={deal.negotiations_Deal_Start_Date ?? ""}
                      onDateChange={(date) =>
                        handleDateChange(
                          date ?? "",
                          deal.id,
                          "negotiations_Deal_Start_Date"
                        )
                      }
                    />
                  ),
                },
                {
                  Component: () => (
                    <DatePickerCell
                      initialDate={deal.arrival_to_client ?? ""}
                      onDateChange={(date) =>
                        handleDateChange(
                          date ?? "",
                          deal.id,
                          "arrival_to_client"
                        )
                      }
                    />
                  ),
                },
                {
                  Component: () => (
                    <DatePickerCell
                      initialDate={deal.close_date ?? ""}
                      onDateChange={(date) =>
                        handleDateChange(date ?? "", deal.id, "close_date")
                      }
                    />
                  ),
                },
                {
                  Component: () => (
                    <DashboardTableActions
                      setStopPropagation={setStopPropagation}
                      deal={deal}
                      negotiatorData={negotiatorData}
                      dateFormat={dateFormat}
                      setCurrentDeals={setCurrentDeals}
                      currentDeals={currentDeals}
                      handleAskForReview={handleAskForReview}
                    />
                  ),
                },
              ])
            : []
        }
      />
      {false && (
        <Table>
          <TableHeader className="max-w-[1000px] overflow-scroll">
            <TableRow>
              <TableHead></TableHead>
              <TableHead
                onClick={() => {
                  const direction =
                    sortConfig.key === "negotiations_Client" &&
                    sortConfig.direction === "ascending"
                      ? "descending"
                      : "ascending";
                  setSortConfig({ key: "negotiations_Client", direction });
                  sortData("negotiations_Client", direction);
                }}
              >
                Client
                <button>
                  {sortConfig.key === "negotiations_Client" ? (
                    sortConfig.direction === "ascending" ? (
                      <span>↑</span>
                    ) : (
                      <span>↓</span>
                    )
                  ) : (
                    <span>↕</span>
                  )}
                </button>
              </TableHead>
              <TableHead
                onClick={() => {
                  const direction =
                    sortConfig.key === "negotiations_Brand" &&
                    sortConfig.direction === "ascending"
                      ? "descending"
                      : "ascending";
                  setSortConfig({ key: "negotiations_Brand", direction });
                  sortData("negotiations_Brand", direction);
                }}
              >
                Make
                <button>
                  {sortConfig.key === "negotiations_Brand" ? (
                    sortConfig.direction === "ascending" ? (
                      <span>↑</span>
                    ) : (
                      <span>↓</span>
                    )
                  ) : (
                    <span>↕</span>
                  )}
                </button>
              </TableHead>
              <TableHead
                onClick={() => {
                  const direction =
                    sortConfig.key === "negotiations_Model" &&
                    sortConfig.direction === "ascending"
                      ? "descending"
                      : "ascending";
                  setSortConfig({ key: "negotiations_Model", direction });
                  sortData("negotiations_Model", direction);
                }}
              >
                Model
                <button>
                  {sortConfig.key === "negotiations_Model" ? (
                    sortConfig.direction === "ascending" ? (
                      <span>↑</span>
                    ) : (
                      <span>↓</span>
                    )
                  ) : (
                    <span>↕</span>
                  )}
                </button>
              </TableHead>
              <TableHead
                onClick={() => {
                  const direction =
                    sortConfig.key === "negotiations_Status" &&
                    sortConfig.direction === "ascending"
                      ? "descending"
                      : "ascending";
                  setSortConfig({ key: "negotiations_Status", direction });
                  sortData("negotiations_Status", direction);
                }}
              >
                Stage
                <button>
                  {sortConfig.key === "negotiations_Status" ? (
                    sortConfig.direction === "ascending" ? (
                      <span>↑</span>
                    ) : (
                      <span>↓</span>
                    )
                  ) : (
                    <span>↕</span>
                  )}
                </button>
              </TableHead>
              <TableHead
                onClick={() => {
                  const direction =
                    sortConfig.key === "negotiations_Zip_Code" &&
                    sortConfig.direction === "ascending"
                      ? "descending"
                      : "ascending";
                  setSortConfig({ key: "negotiations_Zip_Code", direction });
                  sortData("negotiations_Zip_Code", direction);
                }}
              >
                Zip Code
                <button>
                  {sortConfig.key === "negotiations_Zip_Code" ? (
                    sortConfig.direction === "ascending" ? (
                      <span>↑</span>
                    ) : (
                      <span>↓</span>
                    )
                  ) : (
                    <span>↕</span>
                  )}
                </button>
              </TableHead>
              <TableHead>Deal Negotiator</TableHead>
              <TableHead>Onboarding Complete</TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => {
                  const direction =
                    sortConfig.key === "datePaid" &&
                    sortConfig.direction === "ascending"
                      ? "descending"
                      : "ascending";
                  setSortConfig({ key: "datePaid", direction });
                  sortData("negotiations_Created", direction);
                }}
              >
                Date Paid
                <button>
                  {sortConfig.key === "datePaid" ? (
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
              <TableHead
                className="cursor-pointer"
                onClick={() => {
                  const direction =
                    sortConfig.key === "arriveToDealer" &&
                    sortConfig.direction === "ascending"
                      ? "descending"
                      : "ascending";
                  setSortConfig({ key: "arriveToDealer", direction });
                  sortData("arrival_to_dealer", direction);
                }}
              >
                Arrival To Dealer
                <button>
                  {sortConfig.key === "arriveToDealer" ? (
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
              <TableHead
                className="cursor-pointer"
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
                Start Date
                <button>
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
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => {
                  const direction =
                    sortConfig.key === "arriveToClient" &&
                    sortConfig.direction === "ascending"
                      ? "descending"
                      : "ascending";
                  setSortConfig({ key: "arriveToClient", direction });
                  sortData("arrival_to_client", direction);
                }}
              >
                Arrival To Client
                <button>
                  {sortConfig.key === "arriveToClient" ? (
                    sortConfig.direction === "ascending" ? (
                      <span>↑</span>
                    ) : (
                      <span>↓</span>
                    )
                  ) : (
                    <span>↕</span>
                  )}
                </button>
              </TableHead>
              <TableHead
                className="cursor-pointer"
                onClick={() => {
                  const direction =
                    sortConfig.key === "closeDate" &&
                    sortConfig.direction === "ascending"
                      ? "descending"
                      : "ascending";
                  setSortConfig({ key: "closeDate", direction });
                  sortData("close_date", direction);
                }}
              >
                Close Date
                <button>
                  {sortConfig.key === "closeDate" ? (
                    sortConfig.direction === "ascending" ? (
                      <span>↑</span>
                    ) : (
                      <span>↓</span>
                    )
                  ) : (
                    <span>↕</span>
                  )}
                </button>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          {loading ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={14} className="text-center py-4">
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
                  <TableCell>{index + 1}</TableCell>
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
                          style={{
                            backgroundColor: getStatusStyles(
                              deal?.negotiations_Status ?? ""
                            ).backgroundColor,
                            color: getStatusStyles(
                              deal?.negotiations_Status ?? ""
                            ).textColor, // Set dynamic text color
                          }}
                          className="cursor-pointer p-1 w-fit h-fit text-xs border-gray-300"
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

                  <TableCell>{deal.negotiations_Zip_Code}</TableCell>

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
                              negotiator.id ===
                              deal.negotiations_deal_coordinator
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
                    <div>{dateFormat(deal.date_paid ?? "")}</div>
                    <div className="text-xs text-[#0989E5]">
                      {getElapsedTime(deal.date_paid ?? "", NOW)}
                    </div>
                  </TableCell>

                  <TableCell>
                    <DatePickerCell
                      initialDate={deal.arrival_to_dealer}
                      onDateChange={(date) =>
                        handleDateChange(
                          date ?? "",
                          deal.id,
                          "arrival_to_dealer"
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <DatePickerCell
                      initialDate={deal.negotiations_Deal_Start_Date ?? ""}
                      onDateChange={(date) =>
                        handleDateChange(
                          date ?? "",
                          deal.id,
                          "negotiations_Deal_Start_Date"
                        )
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <DatePickerCell
                      initialDate={deal.arrival_to_client ?? ""}
                      onDateChange={(date) =>
                        handleDateChange(
                          date ?? "",
                          deal.id,
                          "arrival_to_client"
                        )
                      }
                    />{" "}
                  </TableCell>
                  <TableCell>
                    <DatePickerCell
                      initialDate={deal.close_date ?? ""}
                      onDateChange={(date) =>
                        handleDateChange(date ?? "", deal.id, "close_date")
                      }
                    />{" "}
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
                        <div className="flex flex-col items-start">
                          <DealNegotiatorDialog
                            setStopPropogation={setStopPropagation}
                            deal={deal}
                            dealNegotiator={negotiatorData}
                            formatDate={dateFormat}
                          />
                          <ShippingInfoDialog
                            setCurrentDeals={setCurrentDeals}
                            currentDeals={currentDeals}
                            deal={deal}
                            setStopPropogation={setStopPropagation}
                          />
                          <p
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAskForReview(deal.id);
                            }}
                            className="text-sm pl-4 pr-1 py-1 cursor-pointer"
                          >
                            Ask For Review
                          </p>
                          <ManualBidUpload
                            setStopPropagation={setStopPropagation}
                            id={deal?.id}
                          />
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          ) : (
            <TableBody>
              <TableRow>
                <TableCell colSpan={13} className="text-center py-4">
                  <p>No Data Found</p>
                </TableCell>
              </TableRow>
            </TableBody>
          )}
        </Table>
      )}
    </>
  );
};

export default TeamDashboardTable;
