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
import {
  sortDataHelper,
  sortNegotiationsByStatus,
} from "@/lib/helpers/negotiation";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";

const NOW = new Date(new Date().toISOString().split("T")[0]);

type TeamDashboardTableProps = {
  setStopPropagation: (item: boolean) => void;
  stopPropagation: boolean;
  currentDeals: NegotiationDataType[];
  setCurrentDeals: (item: NegotiationDataType[]) => void;
  handleStageChange: (id: string, newStage: string) => void;
  allInternalNotes: Record<string, InternalNotes[]>;
  allDealNegotiator: DealNegotiatorType[];
  updateDealNegotiator: (id: string, newNegotiatorId: string) => void;
  negotiatorData?: DealNegotiatorType;
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
  console.log("got here in table:", currentDeals);
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

  const sortData = sortDataHelper(setCurrentDeals, currentDeals);

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
              key: "clientNamefull",
            },
          },
          {
            header: "Make",
            config: {
              sortable: true,
              key: "brand",
            },
          },
          {
            header: "Model",
            config: {
              sortable: true,
              key: "model",
            },
          },
          {
            header: "Stage",
            config: {
              sortable: true,
              key: "stage",
            },
          },
          {
            header: "Zip Code",
            config: {
              sortable: true,
              key: "zip",
            },
          },
          {
            header: "Deal Negotiator",
            config: {
              sortable: true,
              key: "dealCoordinatorId",
            },
          },
          {
            header: "Onboarding Complete",
            config: {
              sortable: true,
              key: "onboardingComplete",
            },
          },
          {
            header: "Date Paid",
            config: {
              sortable: true,
              key: "datePaid",
            },
          },
          {
            header: "Arrival To Dealer",
            config: {
              sortable: true,
              key: "arrivalToDealer",
            },
          },
          {
            header: "Start Date",
            config: {
              sortable: true,
              key: "dealStartDate",
            },
          },
          {
            header: "Arrival To Client",
            config: {
              sortable: true,
              key: "arrivalToClient",
            },
          },
          {
            header: "Close Date",
            config: {
              sortable: true,
              key: "closeDate",
            },
          },
          "Actions",
        ]}
        rows={
          currentDeals && currentDeals.length > 0
            ? currentDeals.map((deal) => [
                {
                  text: deal.clientNamefull,
                },
                deal.brand,
                deal.model,
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
                deal.zip,
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
                    deal?.onboardingComplete &&
                    deal?.onboardingComplete?.toLowerCase() === "yes" ? (
                      <Check className="text-green-500" />
                    ) : (
                      <X className="text-red-500" />
                    ),
                },
                {
                  Component: () => (
                    <>
                      <div>{dateFormat(deal.datePaid ?? "")}</div>
                      <div className="text-xs text-[#0989E5]">
                        {getElapsedTime(deal.datePaid ?? "", NOW)}
                      </div>
                    </>
                  ),
                },
                {
                  Component: () =>
                    deal.arrivalToDealer ? (
                      <DatePickerCell
                        initialDate={deal.arrivalToDealer}
                        onDateChange={(date) =>
                          handleDateChange(
                            date ?? "",
                            deal.id,
                            "arrivalToDealer"
                          )
                        }
                      />
                    ) : (
                      <>TBD</>
                    ),
                },
                {
                  Component: () => (
                    <DatePickerCell
                      initialDate={deal.dealStartDate ?? ""}
                      onDateChange={(date) =>
                        handleDateChange(date ?? "", deal.id, "dealStartDate")
                      }
                    />
                  ),
                },
                {
                  Component: () =>
                    deal.arrivalToClient ? (
                      <DatePickerCell
                        initialDate={deal.arrivalToClient ?? ""}
                        onDateChange={(date) =>
                          handleDateChange(
                            date ?? "",
                            deal.id,
                            "arrivalToClient"
                          )
                        }
                      />
                    ) : (
                      <>TBD</>
                    ),
                },
                {
                  Component: () => (
                    <DatePickerCell
                      initialDate={deal.closeDate ?? ""}
                      onDateChange={(date) =>
                        handleDateChange(date ?? "", deal.id, "closeDate")
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
        sortConfig={sortConfig}
        setSortConfig={setSortConfig}
        sortData={sortData}
      />
    </>
  );
};

export default TeamDashboardTable;
