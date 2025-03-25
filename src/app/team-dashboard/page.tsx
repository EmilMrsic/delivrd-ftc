"use client";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  allowedStatuses,
  fetchActiveDeals,
  fetchAllNotClosedNegotiations,
  fetchAllPaidNegotiations,
} from "@/lib/utils";
import { BellIcon, Search } from "lucide-react";
import {
  arrayRemove,
  arrayUnion,
  doc,
  getDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { NegotiationData } from "@/types";
import { toast } from "@/hooks/use-toast";
import TeamTablePagination from "@/components/Team/team-table-pagination";
import FilterPopup from "@/components/Team/filter-popup";
import { useDispatch } from "react-redux";
import { setNotificationCount } from "../redux/Slice/notificationSlice";
import { useAppSelector } from "../redux/store";
import Link from "next/link";
import { DropdownMenuTrigger } from "@radix-ui/react-dropdown-menu";
import TeamDashboardTable from "@/components/Team/team-dashboard-table";
import useTeamDashboard from "@/hooks/useTeamDashboard";
import SearchAll from "@/components/Team/search-all";
import { TeamHeader } from "@/components/base/header";
import { TeamDashboardFilters } from "@/components/Team/team-dashboard-filters";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";
import {
  mapNegotiationsByColumn,
  sortDataHelper,
  sortMappedDataHelper,
} from "@/lib/helpers/negotiation";
import { useRouter } from "next/navigation";
import { getUserData } from "@/lib/user";

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
  const [isBackNav, setIsBackNav] = useState(false);
  const router = useRouter();
  const isPopState = useRef(false);
  const cachedFilters =
    sessionStorage.getItem("teamDashboardFilters") &&
    JSON.parse(sessionStorage.getItem("teamDashboardFilters") ?? "");
  const [filters, setFilters] = useState(cachedFilters ?? DEFAULT_FILTERS);
  const formattedCachedFilters =
    cachedFilters && formatFiltersForNegotiationsEndpoint(cachedFilters);

  const [searchTerm, setSearchTerm] = useState("");

  const [stopPropagation, setStopPropagation] = useState<boolean>(false);
  const [negotiationsByColumn, setNegotiationsByColumn] = useState<
    Record<string, NegotiationDataType[]>
  >({});

  const {
    filteredDeals,
    originalDeals,
    allDealNegotiator,
    allInternalNotes,
    negotiatorData,
    setFilteredDeals,
    setOriginalDeals,
    loading,
    setLoading,
    itemsPerPage,
    setItemsPerPage,
    currentDeals,
    currentPage,
    setCurrentPage,
    setCurrentDeals,
    refetch,
    negotiations,
  } = useTeamDashboard({
    id: formattedCachedFilters?.dealCoordinatorId,
    filter: formattedCachedFilters ?? {},
  });

  const { notification } = useAppSelector((state) => state.notification);
  const { notificationCount } = useAppSelector((state) => state.notification);
  const dispatch = useDispatch();

  // const totalPages = Math.ceil(filteredDeals?.length / itemsPerPage);

  // const handleItemsPerPageChange = (
  //   e: React.ChangeEvent<HTMLSelectElement>
  // ) => {
  //   const newItemsPerPage = Number(e.target.value);
  //   setItemsPerPage(newItemsPerPage);
  //   setCurrentPage(1);
  // };

  const handleBellClick = () => {
    dispatch(setNotificationCount(0));
  };

  const [sortConfig, setSortConfig] = useState({
    key: "submittedDate", // default sorting by Submitted Date
    direction: "ascending", // default direction
  });

  const sortData = (key: string, direction: string) => {
    const sortedData = sortMappedDataHelper(
      negotiationsByColumn,
      key,
      direction
    );
    setSortConfig({ key, direction });
    setNegotiationsByColumn(sortedData);
  };

  useEffect(() => {
    sessionStorage.setItem("teamDashboardFilters", JSON.stringify(filters));
    setLoading(true);
    runFilters();
  }, [filters]);

  const runFilters = () => {
    console.log("running filters:", filters);
    const formattedFilters = formatFiltersForNegotiationsEndpoint(filters);
    refetch(formattedFilters.dealCoordinatorId as string, formattedFilters);
    setLoading(false);
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

    if (term.length === 0) {
      setFilteredDeals(originalDeals);
      return;
    }

    const filtered = originalDeals?.filter((deal) => {
      return (
        deal.clientNamefull?.toLowerCase().includes(term) ||
        deal.brand?.toLowerCase().includes(term) ||
        deal.model?.toLowerCase().includes(term) ||
        deal.stage?.toLowerCase().includes(term)
      );
    });

    setFilteredDeals(filtered);
  };

  const applyFilters = (currentFilters: typeof filters) => {
    const otherStages = [
      "Delivery Scheduled",
      "Long Term Order",
      "Shipping",
      "Tomi Needs To Review",
      "Ask for Review",
      "Closed No Review",
      "Follow Up Issue",
    ];

    const filtered = originalDeals?.filter((deal) => {
      const matchesStage =
        currentFilters.stages.length === 0
          ? allowedStatuses.includes(deal.stage ?? "")
          : currentFilters.stages.includes("Not Closed")
          ? otherStages.includes(deal.stage?.trim() ?? "")
          : currentFilters.stages.includes(deal.stage?.trim() ?? "");
      const matchesMake =
        currentFilters.makes.length === 0 ||
        currentFilters.makes.includes(deal.brand ?? "");

      const matchesCoordinators =
        currentFilters.dealCoordinators === "" ||
        currentFilters.dealCoordinators === (deal.dealCoordinatorId ?? "");
      const onboardingStatus =
        deal.hasOwnProperty("onboardingComplete") &&
        deal?.onboardingComplete &&
        deal?.onboardingComplete?.toLowerCase() === "yes"
          ? "yes"
          : "no";
      const matchesOnboarding =
        currentFilters.onboarding.length === 0 ||
        currentFilters.onboarding.includes(onboardingStatus);

      return (
        matchesStage && matchesMake && matchesCoordinators && matchesOnboarding
      );
    });
    setFilteredDeals(filtered);
  };

  const clearFilters = () => {
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
      return;
    }

    setFilters(DEFAULT_FILTERS);
    setFilteredDeals(originalDeals);
    setCurrentPage(1);
    setLoading(true);
  };

  const handleStageChange = async (id: string, newStage: string) => {
    try {
      await updateDoc(doc(db, "negotiations", id ?? ""), {
        negotiations_Status: newStage,
      });

      if (newStage !== "Closed") {
        console.log("here", newStage);
        await updateDoc(doc(db, "negotiations", id ?? ""), {
          close_date: "",
        });

        setCurrentDeals((prevDeals) =>
          prevDeals?.map((deal) =>
            deal.id === id
              ? { ...deal, close_date: "", negotiations_Status: newStage }
              : deal
          )
        );
      } else {
        setFilteredDeals((prevDeals) =>
          prevDeals?.map((deal) =>
            deal.id === id ? { ...deal, negotiations_Status: newStage } : deal
          )
        );
        setOriginalDeals((prevDeals) =>
          prevDeals?.map((deal) =>
            deal.id === id ? { ...deal, negotiations_Status: newStage } : deal
          )
        );
      }

      toast({ title: "Status updated" });
    } catch (error) {
      console.error("Error updating stage:", error);
    }
  };

  const updateDealNegotiator = async (id: string, newNegotiatorId: string) => {
    try {
      const dealRef = doc(db, "negotiations", id);

      const dealSnap = await getDoc(dealRef);
      if (!dealSnap.exists()) {
        throw new Error("Deal not found");
      }

      const oldNegotiatorId = dealSnap.data().negotiations_deal_coordinator;

      await updateDoc(dealRef, {
        negotiations_deal_coordinator: newNegotiatorId ?? "",
      });

      const negotiatorRef = doc(db, "team delivrd", newNegotiatorId);

      await updateDoc(negotiatorRef, {
        active_deals: arrayUnion(id),
      });

      if (oldNegotiatorId) {
        const oldNegotiatorRef = doc(db, "team delivrd", oldNegotiatorId);
        await updateDoc(oldNegotiatorRef, {
          active_deals: arrayRemove(id),
        });
      }

      setFilteredDeals((prevDeals) =>
        prevDeals?.map((deal) =>
          deal.id === id
            ? { ...deal, negotiations_deal_coordinator: newNegotiatorId }
            : deal
        )
      );

      setOriginalDeals((prevDeals) =>
        prevDeals?.map((deal) =>
          deal.id === id
            ? { ...deal, negotiations_deal_coordinator: newNegotiatorId }
            : deal
        )
      );

      console.log("Negotiator updated successfully!");
      toast({ title: "Negotiator updated successfully" });
    } catch (error) {
      console.error("Error updating negotiator: ", error);
    }
  };

  // useEffect(() => {
  //   const handlePopState = (event: any) => {
  //     event.preventDefault();
  //     clearFilters();
  //   };

  //   window.addEventListener("popstate", handlePopState);

  //   return () => {
  //     window.removeEventListener("popstate", handlePopState);
  //   };
  // }, []);

  useEffect(() => {
    const onPopState = () => {
      setIsBackNav(true);
    };

    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  useEffect(() => {
    console.log("isBackNav: ", isBackNav);
  }, [isBackNav]);

  useEffect(() => {
    if (negotiations) {
      const negotiationsByColumn = mapNegotiationsByColumn(
        negotiations,
        "stage"
      );
      const sortedNegotiationsByColumn = sortMappedDataHelper(
        negotiationsByColumn,
        "condition",
        "ascending"
      );
      setNegotiationsByColumn(sortedNegotiationsByColumn);
    }
  }, [negotiations]);

  useEffect(() => {
    if (notificationCount > 0) {
      alert("You have unread notifications");
    }
  });

  console.log("user data:", negotiations);

  return (
    <div className="container mx-auto p-4 space-y-6 min-h-screen">
      <TeamHeader
        handleBellClick={handleBellClick}
        notificationCount={notificationCount}
        notification={notification}
        negotiatorData={negotiatorData as unknown as DealNegotiatorType}
      />
      <Card className="bg-white shadow-lg">
        <CardContent>
          <TeamDashboardFilters
            allDealNegotiator={allDealNegotiator}
            filters={filters}
            handleFilterChange={handleFilterChange}
            clearFilters={clearFilters}
            setCurrentDeals={setCurrentDeals}
            searchTerm={searchTerm}
            handleSearch={handleSearch}
          />
          <TeamDashboardTable
            setCurrentDeals={setCurrentDeals}
            loading={loading}
            setStopPropagation={setStopPropagation}
            stopPropagation={stopPropagation}
            negotiatorData={negotiatorData as unknown as DealNegotiatorType}
            allDealNegotiator={
              allDealNegotiator as unknown as DealNegotiatorType[]
            }
            allInternalNotes={allInternalNotes}
            currentDeals={currentDeals}
            handleStageChange={handleStageChange}
            updateDealNegotiator={updateDealNegotiator}
            negotiationsByColumn={negotiationsByColumn}
            sortConfig={sortConfig}
            setSortConfig={setSortConfig}
            sortData={sortData}
          />
          {/* <TeamTablePagination
            setCurrentDeal={setCurrentDeals}
            filteredDeal={filteredDeals}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            handleItemsPerPageChange={handleItemsPerPageChange}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
          /> */}
        </CardContent>
      </Card>
    </div>
  );
}
