"use client";
import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { toast } from "@/hooks/use-toast";
import TeamDashboardTable from "@/components/Team/team-dashboard-table";
import useTeamDashboard from "@/hooks/useTeamDashboard";

import { TeamHeader } from "@/components/base/header";
import { TeamDashboardFilters } from "@/components/Team/team-dashboard-filters";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";
import {
  mapNegotiationsByColumn,
  sortMappedDataHelper,
} from "@/lib/helpers/negotiation";
import { useRouter } from "next/navigation";
import { DEFAULT_SORTED_COLUMN } from "@/lib/constants/negotiations";

const DEFAULT_FILTERS = {
  stages: "" as string,
  makes: [] as string[],
  models: [] as string[],
  dealCoordinators: "" as string,
  onboarding: [] as string[],
};

const formatFiltersForNegotiationsEndpoint = (
  filters: typeof DEFAULT_FILTERS
) => {
  const refetchFilterObject: { [key: string]: string | string[] } = {};
  if (filters.dealCoordinators) {
    refetchFilterObject.dealCoordinatorId = filters.dealCoordinators;
  }

  if (filters?.makes?.length) {
    refetchFilterObject.brand = filters.makes;
  }

  if (filters?.models?.length) {
    refetchFilterObject.model = filters.models;
  }

  if (filters?.stages) {
    if (filters.stages === "Paid/Unassigned") {
      refetchFilterObject.stage = "Paid";
    } else if (filters.stages === "Not Closed ALL") {
      refetchFilterObject.stage = [
        "Deal Started",
        "Actively Negotiating",
        "Delivery Scheduled",
        "Deal Complete Long Term",
        "Long Term Order",
        "Shipping",
        "Needs Review",
        "Follow-up",
        "Follow-up Issue",
      ];
    } else {
      refetchFilterObject.negotiations_Status = filters.stages;
    }
  }

  return refetchFilterObject;
};

export default function DealList() {
  // const backButtonDetector = useBackButtonDetector();
  const cachedFilters =
    sessionStorage.getItem("teamDashboardFilters") &&
    JSON.parse(sessionStorage.getItem("teamDashboardFilters") ?? "");
  const [filters, setFilters] = useState(cachedFilters ?? DEFAULT_FILTERS);
  const formattedCachedFilters =
    cachedFilters && formatFiltersForNegotiationsEndpoint(cachedFilters);

  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  const [stopPropagation, setStopPropagation] = useState<boolean>(false);

  const {
    allNegotiations,
    allDealNegotiator,
    negotiatorData,
    loading,
    refetch,
    negotiations,
    searchAll,
    setSearchAll,
    refetchAll,
    loadingAll,
    archive,
    setArchive,
  } = useTeamDashboard({
    id: formattedCachedFilters?.dealCoordinatorId,
    filter: formattedCachedFilters ?? {},
  });

  const [sortConfig, setSortConfig] = useState({
    key: DEFAULT_SORTED_COLUMN, // default sorting by Submitted Date
    direction: "ascending", // default direction
  });

  useEffect(() => {
    sessionStorage.setItem("teamDashboardFilters", JSON.stringify(filters));
    // setLoading(true);
    runFilters();
  }, [filters]);

  const runFilters = () => {
    const formattedFilters = formatFiltersForNegotiationsEndpoint(filters);
    if (!Object.keys(formattedFilters)?.length) {
      refetch(undefined, undefined, true);
    } else {
      refetch(formattedFilters.dealCoordinatorId as string, formattedFilters);
    }
    // setLoading(false);
  };

  const handleFilterChange = async (
    filterType: keyof typeof filters,
    value: string
  ) => {
    const userData = localStorage.getItem("user");
    const parseUserData = JSON.parse(userData ?? "");
    const id = Array.isArray(parseUserData.deal_coordinator_id)
      ? parseUserData.deal_coordinator_id[0]
      : parseUserData.deal_coordinator_id;

    if (!id || typeof id !== "string") {
      console.error(
        "Invalid deal_coordinator_id:",
        parseUserData.deal_coordinator_id
      );
    }

    setFilters((prevFilters: typeof filters) => {
      const updatedFilters: typeof filters = {
        ...DEFAULT_FILTERS,
        dealCoordinators: prevFilters.dealCoordinators,
      };

      if (filterType === "dealCoordinators") {
        updatedFilters.stages = "";
        if (updatedFilters.dealCoordinators !== value) {
          updatedFilters.dealCoordinators = value;
        }
      } else if (filterType === "stages") {
        if (updatedFilters.stages === value) {
          updatedFilters.stages = "";
        } else {
          updatedFilters.stages = value;
        }
      } else {
        if (updatedFilters[filterType].includes(value)) {
          updatedFilters[filterType] = updatedFilters[filterType].filter(
            (item: string) => item !== value
          );
        } else {
          updatedFilters[filterType] = [...updatedFilters[filterType], value];
        }
      }

      return updatedFilters;
    });
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value.toLowerCase();
    setSearchTerm(term);
  };

  const clearFilters = () => {
    setFilters(DEFAULT_FILTERS);
    // setLoading(true);
  };

  useEffect(() => {
    const userData = localStorage.getItem("user");
    const parseUserData = JSON.parse(userData ?? "");
    if (
      parseUserData.privilege === "Client" ||
      parseUserData.privilege === "Dealer"
    ) {
      router.push("/");
    }
  }, []);

  const handleStageChange = async (id: string, newStage: string) => {
    try {
      await updateDoc(doc(db, "delivrd_negotiations", id ?? ""), {
        stage: newStage,
      });

      if (newStage !== "Closed") {
        await updateDoc(doc(db, "delivrd_negotiations", id ?? ""), {
          close_date: "",
        });
      }

      refetch(
        formattedCachedFilters?.dealCoordinatorId as string,
        formattedCachedFilters
      );

      refetchAll(
        formattedCachedFilters?.dealCoordinatorId as string,
        formattedCachedFilters
      );
      toast({ title: "Status updated" });
    } catch (error) {
      console.error("Error updating stage:", error);
    }
  };

  const updateDealNegotiator = async (id: string, newNegotiatorId: string) => {
    try {
      const dealRef = doc(db, "delivrd_negotiations", id);

      const dealSnap = await getDoc(dealRef);
      if (!dealSnap.exists()) {
        throw new Error("Deal not found");
      }

      await updateDoc(dealRef, {
        dealCoordinatorId: newNegotiatorId ?? "",
      });

      refetch(
        formattedCachedFilters?.dealCoordinatorId as string,
        formattedCachedFilters
      );

      refetchAll(
        formattedCachedFilters?.dealCoordinatorId as string,
        formattedCachedFilters
      );

      toast({ title: "Negotiator updated successfully" });
    } catch (error) {
      console.error("Error updating negotiator: ", error);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6 min-h-screen">
      <TeamHeader />
      <Card className="bg-white shadow-lg">
        <CardContent>
          <TeamDashboardFilters
            allDealNegotiator={allDealNegotiator}
            filters={filters}
            handleFilterChange={handleFilterChange}
            clearFilters={clearFilters}
            // setCurrentDeals={setCurrentDeals}
            searchTerm={searchTerm}
            handleSearch={handleSearch}
            searchAll={searchAll}
            setSearchAll={setSearchAll}
            archive={archive}
            setArchive={setArchive}
          />
          <TeamDashboardTable
            // setCurrentDeals={setCurrentDeals}
            allNegotiations={allNegotiations}
            loading={loading}
            setStopPropagation={setStopPropagation}
            stopPropagation={stopPropagation}
            negotiatorData={negotiatorData as unknown as DealNegotiatorType}
            allDealNegotiator={
              allDealNegotiator as unknown as DealNegotiatorType[]
            }
            // allInternalNotes={allInternalNotes}
            // currentDeals={currentDeals}
            handleStageChange={handleStageChange}
            updateDealNegotiator={updateDealNegotiator}
            // negotiationsByColumn={negotiationsByColumn}
            sortConfig={sortConfig}
            setSortConfig={setSortConfig}
            refetch={refetch}
            displayAllPaid={!searchAll}
            negotiations={negotiations}
            searchTerm={searchTerm}
            searchAll={searchAll}
            refetchAll={refetchAll}
            name="team-dashboard-negotiator"
          />
          {searchAll && (
            <>
              <div className="border-t border-blue-200 mt-4 border-[4px]"></div>
              <TeamDashboardTable
                displayAllPaid={false}
                allNegotiations={allNegotiations}
                loading={loadingAll}
                setStopPropagation={setStopPropagation}
                stopPropagation={stopPropagation}
                negotiatorData={negotiatorData as unknown as DealNegotiatorType}
                allDealNegotiator={
                  allDealNegotiator as unknown as DealNegotiatorType[]
                }
                handleStageChange={handleStageChange}
                updateDealNegotiator={updateDealNegotiator}
                // negotiationsByColumn={negotiationsByColumn}
                negotiations={allNegotiations}
                sortConfig={sortConfig}
                setSortConfig={setSortConfig}
                refetch={refetch}
                searchTerm={searchTerm}
                searchAll={searchAll}
                refetchAll={refetchAll}
                name="team-dashboard-all"
              />
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
