import React, { useEffect, useMemo, useState } from "react";

import "react-datepicker/dist/react-datepicker.css";
import { dateFormat, getElapsedTime, getStatusStyles } from "@/lib/utils";

import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { toast } from "@/hooks/use-toast";
import DatePickerCell from "./datepicker-cell";
import { TailwindPlusTable } from "../tailwind-plus/table";
import { StageDropdown } from "./stage-dropdown";
import { DealNegotiatorDropdown } from "./deal-negotiator-dropdown";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";
import { TailwindPlusExpandableTable } from "../tailwind-plus/expandable-table";
import { Button } from "../ui/button";
import { ClientProfile } from "./profile/client-profile";
import { TeamDashboardClientNameDisplay } from "./dashboard/team-dashboard-client-name-display";
import {
  mapNegotiationsByColumn,
  orderNegotiationsByColumns,
  removeNegotiatorFromNegotiations,
  sortDataHelper,
  sortMappedDataHelper,
} from "@/lib/helpers/negotiation";
import { StageButton } from "./stage-button";
import { MakeButton } from "./make-button";
import { useTeamDashboardFiltersState } from "@/lib/state/team-dashboard-filters";

const NOW = new Date(new Date().toISOString().split("T")[0]);
const DEFAULT_OPEN_STAGE = "Actively Negotiating";

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
  name: string;
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
  name,
}: TeamDashboardTableProps) => {
  const hasIncomingBids = useTeamDashboardFiltersState(
    (state) => state.hasIncomingBids
  );
  const hasTradeInBids = useTeamDashboardFiltersState(
    (state) => state.hasTradeInBids
  );
  const [paidNegotiations, setPaidNegotiations] = useState<
    NegotiationDataType[]
  >([]);

  const [negotiationsByColumn, setNegotiationsByColumn] = useState<
    // Record<string, Record<string, NegotiationDataType[]>>
    {
      stage: string;
      deals: NegotiationDataType[] | Record<string, NegotiationDataType[]>;
    }[]
  >([]);

  const performSearch = (deal: NegotiationDataType, searchTerm: string) => {
    if (searchTerm.length === 0) {
      return true;
    }

    const searchableWorkLog = deal.workLogs
      ? deal.workLogs.map((log) => log.content).join(" ")
      : "";

    const found =
      deal?.clientNamefull?.toLowerCase().includes(searchTerm) ||
      deal?.brand?.toLowerCase().includes(searchTerm) ||
      deal?.model?.toLowerCase().includes(searchTerm) ||
      deal?.zip?.toLowerCase().includes(searchTerm) ||
      deal?.clientEmail?.toLowerCase().includes(searchTerm) ||
      deal?.clientPhone?.toLowerCase().includes(searchTerm) ||
      deal?.state?.toLowerCase().includes(searchTerm) ||
      deal?.city?.toLowerCase().includes(searchTerm) ||
      searchableWorkLog.toLowerCase().includes(searchTerm);

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
        const isGrouped = !Array.isArray(status.deals);
        if (isGrouped) {
          const sortedData = sortMappedDataHelper(
            status.deals as Record<string, NegotiationDataType[]>,
            key,
            direction
          );
          status.deals = sortedData;
        } else {
          const sortedData = sortDataHelper(
            status.deals as NegotiationDataType[]
          )(key, direction) as NegotiationDataType[];
          status.deals = sortedData;
        }
      });
      return newState;
    });

    setPaidNegotiations((prevState) => {
      const newState = [...prevState];
      return sortDataHelper(newState)(key, direction) as NegotiationDataType[];
    });
  };

  useEffect(() => {
    const { key, direction } = sortConfig;
    const filtered = allNegotiations
      ? allNegotiations.filter((item) => {
          if (
            hasTradeInBids &&
            (!item?.totalTradeInBids || item.totalTradeInBids <= 0)
          ) {
            return false;
          }

          if (
            hasIncomingBids &&
            (!item?.totalRegularBids || item.totalRegularBids <= 0)
          ) {
            return false;
          }

          if (item.dealCoordinatorId || item.dealCoordinatorId !== "") {
            return false;
          }

          if (searchTerm.length > 0) {
            return item.stage === "Paid" && performSearch(item, searchTerm);
          }
          return item.stage === "Paid";
        })
      : [];

    const sorted = sortDataHelper(filtered)(
      key || "brand",
      direction || "ascending"
    ) as NegotiationDataType[];

    setPaidNegotiations(sorted);
  }, [allNegotiations, searchTerm, hasIncomingBids, hasTradeInBids]);

  useEffect(() => {
    if (negotiations) {
      const negotiationsByColumn = mapNegotiationsByColumn(
        negotiations,
        "stage",
        (deal) => {
          if (
            hasTradeInBids &&
            (!deal?.totalTradeInBids || deal.totalTradeInBids <= 0)
          ) {
            return false;
          }

          if (
            hasIncomingBids &&
            (!deal?.totalRegularBids || deal.totalRegularBids <= 0)
          ) {
            return false;
          }

          const searchMatch = performSearch(deal, searchTerm);
          return searchMatch;
        }
      );

      const { key, direction } = sortConfig;

      const sortedNegotiationsByColumn = sortMappedDataHelper(
        negotiationsByColumn,
        key || "brand",
        direction || "ascending"
      );

      const finalNegotiationGrouping: Record<
        string,
        NegotiationDataType[] | Record<string, NegotiationDataType[]>
      > = {};
      for (const key of Object.keys(negotiationsByColumn)) {
        if (["Paid", "Actively Negotiating"].includes(key)) {
          const groupedByCondition = mapNegotiationsByColumn(
            sortedNegotiationsByColumn[key],
            "condition"
          );
          finalNegotiationGrouping[key] = groupedByCondition;
        } else {
          finalNegotiationGrouping[key] = sortedNegotiationsByColumn[key];
        }
      }

      const sortedColumns = orderNegotiationsByColumns(
        finalNegotiationGrouping
      );
      setNegotiationsByColumn(sortedColumns);
    }
  }, [negotiations, searchTerm, searchAll, hasIncomingBids, hasTradeInBids]);

  let defaultOpenRow = negotiationsByColumn.findIndex((row: any) => {
    return row.stage === DEFAULT_OPEN_STAGE;
  });

  if (displayAllPaid && paidNegotiations.length > 0) {
    defaultOpenRow += 1;
  }

  const scopedRows: any[] = [];
  for (const statusIdx in negotiationsByColumn) {
    const row: any = negotiationsByColumn[statusIdx];
    if (
      row?.deals?.length ||
      row?.deals?.New?.length ||
      row?.deals?.Used?.length
    ) {
      scopedRows.push(
        dashboardTableRowParser({
          row,
          statusIdx: parseInt(statusIdx),
          handleStageChange,
          allDealNegotiator,
          updateDealNegotiator,
          handleDateChange,
          handleAskForReview,
          setStopPropagation,
          negotiatorData: negotiatorData as DealNegotiatorType,
          sortConfig,
          setSortConfig,
          sortData,
          refetch,
          refetchAll,
        })
      );
    }
  }

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
            refetchAll={refetchAll}
          />
        ),
      },
      ...rows,
    ];
  }

  return loading ? (
    <div>Loading...</div>
  ) : (
    <TailwindPlusExpandableTable
      name={name}
      rows={rows}
      defaultExpanded={
        defaultOpenRow || defaultOpenRow === 0 ? [defaultOpenRow] : []
      }
    />
  );
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
  refetchAll,
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
  refetchAll: (id?: string, filters?: any, reset?: boolean) => void;
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

                if (deal.priority) {
                  output.backgroundColor = "bg-[#e6f9e6]";
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
                      <ClientProfile
                        negotiationId={deal.id}
                        allowClientModeToggle={true}
                      />
                    ),
                    onExpandedClose: () => {
                      refetch();
                      refetchAll();
                    },
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
                      onRemoveNegotiator={(id) => {
                        removeNegotiatorFromNegotiations(id, () => {
                          refetch();
                          refetchAll();
                        });
                        // recH85js7w4MRVDru
                      }}
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
                  Component: () => (
                    <DatePickerCell
                      initialDate={deal.arrivalToDealer}
                      onDateChange={(date) =>
                        handleDateChange(date ?? "", deal.id, "arrivalToDealer")
                      }
                    />
                  ),
                },
                {
                  Component: () => (
                    <DatePickerCell
                      initialDate={deal.arrivalToClient ?? ""}
                      onDateChange={(date) =>
                        handleDateChange(date ?? "", deal.id, "arrivalToClient")
                      }
                    />
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

export const dashboardTableRowParser = ({
  row,
  statusIdx,
  handleStageChange,
  allDealNegotiator,
  updateDealNegotiator,
  handleDateChange,
  handleAskForReview,
  setStopPropagation,
  negotiatorData,
  sortConfig,
  setSortConfig,
  sortData,
  refetch,
  refetchAll,
}: {
  row: {
    stage: string;
    deals: NegotiationDataType[] | Record<string, NegotiationDataType[]>;
  };
  statusIdx: number;
  handleStageChange: (id: string, newStage: string) => void;
  allDealNegotiator: DealNegotiatorType[];
  updateDealNegotiator: (id: string, newNegotiatorId: string) => void;
  handleDateChange: (date: string, dealId: string, dateType: string) => void;
  handleAskForReview: (id: string) => void;
  setStopPropagation: (item: boolean) => void;
  negotiatorData: DealNegotiatorType;
  sortConfig: { key: string; direction: string };
  setSortConfig: (config: { key: string; direction: string }) => void;
  sortData: (key: string, direction: string) => void;
  refetch: (id?: string, filters?: any, reset?: boolean) => void;
  refetchAll: (id?: string, filters?: any, reset?: boolean) => void;
}) => {
  const isGrouped = !Array.isArray(row.deals); // if not an array, its grouped by New/Used
  return isGrouped
    ? dashbaordTableRowGrouped({
        row: row as {
          stage: string;
          deals: Record<string, NegotiationDataType[]>;
        },
        statusIdx,
        handleStageChange,
        allDealNegotiator,
        updateDealNegotiator,
        handleDateChange,
        handleAskForReview,
        setStopPropagation,
        negotiatorData,
        sortConfig,
        setSortConfig,
        sortData,
        refetch,
        refetchAll,
      })
    : dashbaordTableRowUngrouped({
        row: row as {
          stage: string;
          deals: NegotiationDataType[];
        },
        statusIdx,
        handleStageChange,
        allDealNegotiator,
        updateDealNegotiator,
        handleDateChange,
        handleAskForReview,
        setStopPropagation,
        negotiatorData,
        sortConfig,
        setSortConfig,
        sortData,
        refetch,
        refetchAll,
      });
};

export const dashbaordTableRowGrouped = ({
  row,
  statusIdx,
  handleStageChange,
  allDealNegotiator,
  updateDealNegotiator,
  handleDateChange,
  handleAskForReview,
  setStopPropagation,
  negotiatorData,
  sortConfig,
  setSortConfig,
  sortData,
  refetch,
  refetchAll,
}: {
  row: {
    stage: string;
    deals: Record<string, NegotiationDataType[]>;
  };
  statusIdx: number;
  handleStageChange: (id: string, newStage: string) => void;
  allDealNegotiator: DealNegotiatorType[];
  updateDealNegotiator: (id: string, newNegotiatorId: string) => void;
  handleDateChange: (date: string, dealId: string, dateType: string) => void;
  handleAskForReview: (id: string) => void;
  setStopPropagation: (item: boolean) => void;
  negotiatorData: DealNegotiatorType;
  sortConfig: { key: string; direction: string };
  setSortConfig: (config: { key: string; direction: string }) => void;
  sortData: (key: string, direction: string) => void;
  refetch: (id?: string, filters?: any, reset?: boolean) => void;
  refetchAll: (id?: string, filters?: any, reset?: boolean) => void;
}) => {
  const { stage, deals } = row;
  const total = (deals?.New?.length || 0) + (deals?.Used?.length || 0);

  // ensure order of New, Used
  const rowKeys: string[] = [];
  if (deals?.New) {
    rowKeys.push("New");
  }
  if (deals?.Used) {
    rowKeys.push("Used");
  }

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
      defaultExpanded: stage === DEFAULT_OPEN_STAGE ? [0, 1] : [],
      expandAll: true,
      rows: rowKeys.map((condition, conditionIdx) => {
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
              refetchAll={refetchAll}
            />
          ),
        };
      }),
    },
  };
};

export const dashbaordTableRowUngrouped = ({
  row,
  statusIdx,
  handleStageChange,
  allDealNegotiator,
  updateDealNegotiator,
  handleDateChange,
  handleAskForReview,
  setStopPropagation,
  negotiatorData,
  sortConfig,
  setSortConfig,
  sortData,
  refetch,
  refetchAll,
}: {
  row: {
    stage: string;
    deals: NegotiationDataType[];
  };
  statusIdx: number;
  handleStageChange: (id: string, newStage: string) => void;
  allDealNegotiator: DealNegotiatorType[];
  updateDealNegotiator: (id: string, newNegotiatorId: string) => void;
  handleDateChange: (date: string, dealId: string, dateType: string) => void;
  handleAskForReview: (id: string) => void;
  setStopPropagation: (item: boolean) => void;
  negotiatorData: DealNegotiatorType;
  sortConfig: { key: string; direction: string };
  setSortConfig: (config: { key: string; direction: string }) => void;
  sortData: (key: string, direction: string) => void;
  refetch: (id?: string, filters?: any, reset?: boolean) => void;
  refetchAll: (id?: string, filters?: any, reset?: boolean) => void;
}) => {
  const { stage, deals } = row;
  const total = deals.length;

  return {
    name: `status-${statusIdx}`,
    Component: () => (
      <>
        <StageButton stage={stage} />
        {total}
      </>
    ),
    expandedComponent: DashboardTable,
    expandedComponentProps: {
      key: `dashboard-table-${statusIdx}`,
      currentDeals: deals,
      handleStageChange: handleStageChange,
      allDealNegotiator: allDealNegotiator,
      updateDealNegotiator: updateDealNegotiator,
      handleDateChange: handleDateChange,
      handleAskForReview: handleAskForReview,
      setStopPropagation: setStopPropagation,
      // setCurrentDeals={setCurrentDeals}
      negotiatorData: negotiatorData as DealNegotiatorType,
      sortConfig: sortConfig,
      setSortConfig: setSortConfig,
      sortData: sortData,
      refetch: refetch,
      refetchAll: refetchAll,
    },
  };
};

export default TeamDashboardTable;
