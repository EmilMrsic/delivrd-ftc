import React, { useEffect, useState } from "react";

import "react-datepicker/dist/react-datepicker.css";
import { Check, X } from "lucide-react";
import { dateFormat, getElapsedTime, getStatusStyles } from "@/lib/utils";

import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { toast } from "@/hooks/use-toast";
import DatePickerCell from "./datepicker-cell";
import { TailwindPlusTable } from "../tailwind-plus/table";
import { StageDropdown } from "./stage-dropdown";
import { DealNegotiatorDropdown } from "./deal-negotiator-dropdown";
import { DashboardTableActions } from "./dashboard-table-actions";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";
import { TailwindPlusExpandableTable } from "../tailwind-plus/expandable-table";
import { Button } from "../ui/button";
import { ClientProfile } from "./profile/client-profile";
import { TeamDashboardClientNameDisplay } from "./dashboard/team-dashboard-client-name-display";
import {
  mapNegotiationsByColumn,
  orderNegotiationsByColumns,
  sortMappedDataHelper,
} from "@/lib/helpers/negotiation";
import { StageButton } from "./stage-button";
import { MakeButton } from "./make-button";

const NOW = new Date(new Date().toISOString().split("T")[0]);

type TeamDashboardTableProps = {
  searchAll: boolean;
  displayAllPaid: boolean;
  allNegotiations?: NegotiationDataType[];
  setStopPropagation: (item: boolean) => void;
  stopPropagation: boolean;
  // currentDeals: NegotiationDataType[];
  // setCurrentDeals: (item: NegotiationDataType[]) => void;
  handleStageChange: (id: string, newStage: string) => void;
  // allInternalNotes: Record<string, InternalNotes[]>;
  allDealNegotiator: DealNegotiatorType[];
  updateDealNegotiator: (id: string, newNegotiatorId: string) => void;
  negotiatorData?: DealNegotiatorType;
  loading: boolean;
  // negotiationsByColumn: Record<string, Record<string, NegotiationDataType[]>>;
  negotiations: NegotiationDataType[];
  sortConfig: { key: string; direction: string };
  setSortConfig: (config: { key: string; direction: string }) => void;
  // sortData: (key: string, direction: string) => void;
  refetch: (id?: string, filters?: any, reset?: boolean) => void;
  searchTerm: string;
  refetchAll: (id?: string, filters?: any, reset?: boolean) => void;
};

const TeamDashboardTable = ({
  searchAll,
  displayAllPaid,
  allNegotiations,
  setStopPropagation,
  stopPropagation,
  // currentDeals,
  // allInternalNotes,
  handleStageChange,
  allDealNegotiator,
  updateDealNegotiator,
  negotiatorData,
  loading,
  // setCurrentDeals,
  // negotiationsByColumn,
  negotiations,
  sortConfig,
  setSortConfig,
  refetch,
  searchTerm,
  refetchAll,
}: TeamDashboardTableProps) => {
  const [paidNegotiations, setPaidNegotiations] = useState<
    NegotiationDataType[]
  >([]);

  const [negotiationsByColumn, setNegotiationsByColumn] = useState<
    // Record<string, Record<string, NegotiationDataType[]>>
    {
      stage: string;
      deals: Record<string, NegotiationDataType[]>;
    }[]
  >([]);

  const performSearch = (deal: NegotiationDataType, searchTerm: string) => {
    if (searchTerm.length === 0) {
      return true;
    }

    const found =
      deal?.clientNamefull?.toLowerCase().includes(searchTerm) ||
      deal?.brand?.toLowerCase().includes(searchTerm) ||
      deal?.model?.toLowerCase().includes(searchTerm) ||
      deal?.zip?.toLowerCase().includes(searchTerm) ||
      deal?.clientEmail?.toLowerCase().includes(searchTerm) ||
      deal?.clientPhone?.toLowerCase().includes(searchTerm) ||
      deal?.state?.toLowerCase().includes(searchTerm) ||
      deal?.city?.toLowerCase().includes(searchTerm);

    return found;
  };
  //   setOpenNegotiatorState((prev) => ({
  //     ...prev,
  //     [id]: isOpen,
  //   }));
  // };

  const handleDateChange = async (
    date: string,
    dealId: string,
    dateType: string
  ) => {
    const id = dealId;

    const negotiationRef = doc(db, "delivrd_negotiations", id);
    const docSnap = await getDoc(negotiationRef);
    if (docSnap.exists()) {
      await updateDoc(negotiationRef, {
        [dateType]: date,
      });
      refetch();
      refetchAll();
    }

    toast({ title: "Negotiation Updated" });
  };

  async function handleAskForReview(id: string) {
    if (!id) return;

    try {
      const dealData = negotiations.find((item) => item.id === id);

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

  const sortData = (key: string, direction: string) => {
    setSortConfig({ key, direction });
    setNegotiationsByColumn((prevState) => {
      const newState = [...prevState];
      newState.forEach((status) => {
        const sortedData = sortMappedDataHelper(status.deals, key, direction);
        status.deals = sortedData;
      });
      return newState;
    });
  };

  useEffect(() => {
    setPaidNegotiations(
      allNegotiations
        ? allNegotiations.filter((item) => {
            if (searchTerm.length > 0) {
              return item.stage === "Paid" && performSearch(item, searchTerm);
            }
            return item.stage === "Paid";
          })
        : []
    );
  }, [allNegotiations, searchTerm]);

  useEffect(() => {
    if (negotiations) {
      const negotiationsByColumn = mapNegotiationsByColumn(
        negotiations,
        "stage",
        (deal) => performSearch(deal, searchTerm)
      );

      const sortedNegotiationsByColumn = sortMappedDataHelper(
        negotiationsByColumn,
        "clientNameFull",
        "ascending"
      );

      const groupedByNewAndUsed: Record<
        string,
        Record<string, NegotiationDataType[]>
      > = {};
      for (const key of Object.keys(negotiationsByColumn)) {
        const groupedByCondition = mapNegotiationsByColumn(
          sortedNegotiationsByColumn[key],
          "condition"
        );

        groupedByNewAndUsed[key] = groupedByCondition;
      }

      const sortedColumns = orderNegotiationsByColumns(groupedByNewAndUsed);
      setNegotiationsByColumn(sortedColumns);
    }
  }, [negotiations, searchTerm, searchAll]);

  const scopedRows = negotiationsByColumn.map((row, statusIdx) => {
    const { stage, deals } = row;
    const total = (deals?.New?.length || 0) + (deals?.Used?.length || 0);

    return {
      Component: () => (
        <>
          <StageButton stage={stage} />
          {total}
        </>
      ),
      expandedComponent: TailwindPlusExpandableTable,
      expandedComponentProps: {
        name: statusIdx.toString(),
        rows: Object.keys(deals)
          .filter((condition) => ["New", "Used"].includes(condition))
          .map((condition, conditionIdx) => {
            const total = deals[condition].length;
            return {
              Component: () => (
                <>
                  <Button
                    variant="outline"
                    style={{
                      backgroundColor: getStatusStyles(condition ?? "")
                        .backgroundColor,
                      color: getStatusStyles(condition ?? "").textColor, // Set dynamic text color
                    }}
                    className="cursor-pointer p-1 w-fit h-fit text-xs border-gray-300 mr-[10px]"
                  >
                    <p>{condition}</p>
                  </Button>
                  {total}
                </>
              ),
              expandedComponent: () => (
                <DashboardTable
                  key={`dashboard-table-${statusIdx}-${conditionIdx}`}
                  currentDeals={deals[condition]}
                  handleStageChange={handleStageChange}
                  allDealNegotiator={allDealNegotiator}
                  updateDealNegotiator={updateDealNegotiator}
                  handleDateChange={handleDateChange}
                  handleAskForReview={handleAskForReview}
                  setStopPropagation={setStopPropagation}
                  // setCurrentDeals={setCurrentDeals}
                  negotiatorData={negotiatorData as DealNegotiatorType}
                  sortConfig={sortConfig}
                  setSortConfig={setSortConfig}
                  sortData={sortData}
                  refetch={refetch}
                />
              ),
            };
          }),
      },
    };
  });

  let rows: any = [...scopedRows];
  if (displayAllPaid && paidNegotiations.length > 0) {
    rows = [
      {
        Component: () => (
          <>
            <Button
              variant="outline"
              style={{
                backgroundColor: getStatusStyles("Paid").backgroundColor,
                color: getStatusStyles("Paid").textColor, // Set dynamic text color
              }}
              className="cursor-pointer p-1 w-fit h-fit text-xs border-gray-300 mr-[10px]"
            >
              <p>Paid</p>
            </Button>
            {paidNegotiations.length}
          </>
        ),
        expandedComponent: () => (
          <DashboardTable
            key={`dashboard-table-paid`}
            currentDeals={paidNegotiations}
            handleStageChange={handleStageChange}
            allDealNegotiator={allDealNegotiator}
            updateDealNegotiator={updateDealNegotiator}
            handleDateChange={handleDateChange}
            handleAskForReview={handleAskForReview}
            setStopPropagation={setStopPropagation}
            // setCurrentDeals={setCurrentDeals}
            negotiatorData={negotiatorData as DealNegotiatorType}
            sortConfig={sortConfig}
            setSortConfig={setSortConfig}
            sortData={sortData}
            refetch={refetch}
          />
        ),
      },
      ...rows,
    ];
  }

  return <TailwindPlusExpandableTable rows={rows} />;
};

export const DashboardTable = ({
  currentDeals,
  handleStageChange,
  allDealNegotiator,
  updateDealNegotiator,
  handleDateChange,
  handleAskForReview,
  setStopPropagation,
  // setCurrentDeals,
  negotiatorData,
  sortConfig,
  setSortConfig,
  sortData,
  refetch,
}: {
  currentDeals: NegotiationDataType[];
  handleStageChange: (id: string, newStage: string) => void;
  allDealNegotiator: DealNegotiatorType[];
  updateDealNegotiator: (id: string, newNegotiatorId: string) => void;
  handleDateChange: (date: string, dealId: string, dateType: string) => void;
  handleAskForReview: (id: string) => void;
  setStopPropagation: (item: boolean) => void;
  // setCurrentDeals: (item: NegotiationDataType[]) => void;
  negotiatorData: DealNegotiatorType;
  sortConfig: { key: string; direction: string };
  setSortConfig: (config: { key: string; direction: string }) => void;
  sortData: (key: string, direction: string) => void;
  refetch: (id?: string, filters?: any, reset?: boolean) => void;
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
          {
            header: "Date Paid",
            config: {
              sortable: true,
              key: "datePaid",
            },
          },
        ]}
        rowConfigs={
          currentDeals && currentDeals.length > 0
            ? currentDeals.map((deal) => {
                const output: {
                  backgroundColor?: string;
                } = {};

                if (deal.onboardingComplete === "NO") {
                  output.backgroundColor = "bg-red-100";
                }

                return output;
              })
            : []
        }
        rows={
          currentDeals && currentDeals.length > 0
            ? currentDeals.map((deal) => [
                {
                  Component: () => (
                    <TeamDashboardClientNameDisplay
                      deal={deal}
                      allDealNegotiator={allDealNegotiator}
                      refetch={refetch}
                      setStopPropagation={setStopPropagation}
                      currentDeals={currentDeals}
                      handleAskForReview={handleAskForReview}
                      negotiatorData={negotiatorData}
                    />
                  ),
                  config: {
                    expandable: true,
                    expandedComponent: () => (
                      <ClientProfile negotiationId={deal.id} />
                    ),
                    expandedSize: "full",
                  },
                },
                {
                  Component: () => <MakeButton make={deal.brand} />,
                },
                deal.model,
                {
                  Component: () => (
                    <StageDropdown
                      deal={deal}
                      handleStageChange={handleStageChange}
                      getStatusStyles={getStatusStyles}
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
                    />
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
                    <>
                      <div>{dateFormat(deal.datePaid ?? "")}</div>
                      <div className="text-xs text-[#0989E5]">
                        {getElapsedTime(deal.datePaid ?? "", NOW)}
                      </div>
                    </>
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
