import React, { useEffect, useState } from "react";

import "react-datepicker/dist/react-datepicker.css";
import { Check, X } from "lucide-react";
import {
  dateFormat,
  dealStageOptions,
  getElapsedTime,
  getStatusStyles,
} from "@/lib/utils";

import { InternalNotes } from "@/types";
import { useRouter } from "next/navigation";
import { Loader } from "../base/loader";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { toast } from "@/hooks/use-toast";
import DatePickerCell from "./datepicker-cell";
import { TailwindPlusTable } from "../tailwind-plus/table";
import { StageDropdown } from "./stage-dropdown";
import { DealNegotiatorDropdown } from "./deal-negotiator-dropdown";
import { DashboardTableActions } from "./dashboard-table-actions";
import { sortDataHelper } from "@/lib/helpers/negotiation";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";
import { TailwindPlusExpandableTable } from "../tailwind-plus/expandable-table";
import { Button } from "../ui/button";
import { ClientProfile } from "./profile/client-profile";

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
  negotiationsByColumn: Record<string, NegotiationDataType[]>;
  sortConfig: { key: string; direction: string };
  setSortConfig: (config: { key: string; direction: string }) => void;
  sortData: (key: string, direction: string) => void;
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
  negotiationsByColumn,
  sortConfig,
  setSortConfig,
  sortData,
}: TeamDashboardTableProps) => {
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({});

  const [openNegotiatorState, setOpenNegotiatorState] = useState<
    Record<string, boolean>
  >({});

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
    <TailwindPlusExpandableTable
      defaultExpanded={[0]}
      rows={Object.keys(negotiationsByColumn).map((key, keyIdx) => {
        const stage = negotiationsByColumn[key];

        return {
          Component: () => (
            <>
              <Button
                variant="outline"
                style={{
                  backgroundColor: getStatusStyles(key ?? "").backgroundColor,
                  color: getStatusStyles(key ?? "").textColor, // Set dynamic text color
                }}
                className="cursor-pointer p-1 w-fit h-fit text-xs border-gray-300 mr-[10px]"
              >
                <p>{key}</p>
              </Button>
              {stage.length}
            </>
          ),
          expandedComponent: () => (
            <DashboardTable
              currentDeals={stage}
              handleStageChange={handleStageChange}
              toggleDropdown={toggleDropdown}
              openStates={openStates}
              allDealNegotiator={allDealNegotiator}
              updateDealNegotiator={updateDealNegotiator}
              toggleNegotiatorDropdown={toggleNegotiatorDropdown}
              openNegotiatorState={openNegotiatorState}
              handleDateChange={handleDateChange}
              handleAskForReview={handleAskForReview}
              setStopPropagation={setStopPropagation}
              setCurrentDeals={setCurrentDeals}
              negotiatorData={negotiatorData as DealNegotiatorType}
              sortConfig={sortConfig}
              setSortConfig={setSortConfig}
              sortData={sortData}
            />
          ),
        };
      })}
    />
  );
};

export const DashboardTable = ({
  currentDeals,
  handleStageChange,
  toggleDropdown,
  openStates,
  allDealNegotiator,
  updateDealNegotiator,
  toggleNegotiatorDropdown,
  openNegotiatorState,
  handleDateChange,
  handleAskForReview,
  setStopPropagation,
  setCurrentDeals,
  negotiatorData,
  sortConfig,
  setSortConfig,
  sortData,
}: {
  currentDeals: NegotiationDataType[];
  handleStageChange: (id: string, newStage: string) => void;
  toggleDropdown: (id: string, isOpen: boolean) => void;
  openStates: Record<string, boolean>;
  allDealNegotiator: DealNegotiatorType[];
  updateDealNegotiator: (id: string, newNegotiatorId: string) => void;
  toggleNegotiatorDropdown: (id: string, isOpen: boolean) => void;
  openNegotiatorState: Record<string, boolean>;
  handleDateChange: (date: string, dealId: string, dateType: string) => void;
  handleAskForReview: (id: string) => void;
  setStopPropagation: (item: boolean) => void;
  setCurrentDeals: (item: NegotiationDataType[]) => void;
  negotiatorData: DealNegotiatorType;
  sortConfig: { key: string; direction: string };
  setSortConfig: (config: { key: string; direction: string }) => void;
  sortData: (key: string, direction: string) => void;
}) => {
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
            header: "Condition",
            config: {
              sortable: true,
              key: "condition",
            },
          },
          {
            header: "Stage",
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
            header: "Start Date",
            config: {
              sortable: true,
              key: "dealStartDate",
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
                  config: {
                    expandable: true,
                    expandedComponent: () => (
                      <ClientProfile negotiationId={deal.id} />
                    ),
                    expandedSize: "full",
                  },
                },
                deal.brand,
                deal.model,
                deal.condition,
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
