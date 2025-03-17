"use client";
import { useEffect, useState } from "react";
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

export default function DealList() {
  const [searchTerm, setSearchTerm] = useState("");

  const [stopPropagation, setStopPropagation] = useState<boolean>(false);

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
  } = useTeamDashboard({});

  const { notification } = useAppSelector((state) => state.notification);
  const { notificationCount } = useAppSelector((state) => state.notification);
  const dispatch = useDispatch();

  const totalPages = Math.ceil(filteredDeals?.length / itemsPerPage);

  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newItemsPerPage = Number(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  const handleBellClick = () => {
    dispatch(setNotificationCount(0));
  };

  const [filters, setFilters] = useState({
    stages: "" as string,
    makes: [] as string[],
    models: [] as string[],
    dealCoordinators: "" as string,
    onboarding: [] as string[],
  });

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
    setFilters((prevFilters) => {
      const updatedFilters = { ...prevFilters };

      if (filterType === "dealCoordinators") {
        updatedFilters.stages = "";
        if (updatedFilters.dealCoordinators !== value) {
          refetch(value);
        }
      } else if (filterType === "stages") {
        if (updatedFilters.stages === value) {
          updatedFilters.stages = "";
          setLoading(true);

          fetchActiveDeals(
            updatedFilters.dealCoordinators.length
              ? updatedFilters.dealCoordinators
              : id
          )
            .then((deals) => {
              setOriginalDeals(deals as NegotiationDataType[]);
              const defaultFilteredDeals = deals?.filter(
                (deal: NegotiationData) =>
                  allowedStatuses.includes(deal.negotiations_Status ?? "")
              );
              setFilteredDeals(defaultFilteredDeals as NegotiationDataType[]);
              setLoading(false);
            })
            .catch((error) => console.error("Error applying filter:", error));
        } else {
          updatedFilters.stages = value;
          setLoading(true);

          if (value === "Paid/Unassigned") {
            fetchAllPaidNegotiations().then((res) => {
              setOriginalDeals(res);
              setFilteredDeals(res);
              setLoading(false);
            });
          } else if (value === "Not Closed ALL") {
            fetchAllNotClosedNegotiations().then((res) => {
              setOriginalDeals(res);
              setFilteredDeals(res);
              setLoading(false);
            });
          } else {
            if (value === "Not Closed") {
              const allowedStatuses = [
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
              const deals = originalDeals.filter((deal) =>
                allowedStatuses.includes(deal.stage ?? "")
              );
              setFilteredDeals(deals);
              setLoading(false);
            } else {
              const deals = originalDeals.filter(
                (deal) => deal.stage && deal.stage.trim() === value.trim()
              );
              setFilteredDeals(deals);
              setLoading(false);
            }
          }
        }
      } else {
        if (updatedFilters[filterType].includes(value)) {
          updatedFilters[filterType] = updatedFilters[filterType].filter(
            (item: string) => item !== value
          );
        } else {
          updatedFilters[filterType] = [...updatedFilters[filterType], value];
        }
        applyFilters(updatedFilters);
      }

      return updatedFilters;
    });
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
    const resetFilters = {
      stages: "",
      models: [],
      dealCoordinators: "",
      makes: [],
      onboarding: [],
    };
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

    setFilters(resetFilters);
    setFilteredDeals(originalDeals);
    setCurrentPage(1);
    setLoading(true);
    fetchActiveDeals(id)
      .then((deals) => {
        setOriginalDeals(deals as NegotiationDataType[]);

        const defaultFilteredDeals = deals?.filter((deal: NegotiationData) =>
          allowedStatuses.includes(deal.negotiations_Status ?? "")
        );
        setFilteredDeals(defaultFilteredDeals as NegotiationDataType[]);
        setLoading(false);
      })
      .catch((error) => console.error("Error applying filter:", error));
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

  useEffect(() => {
    const handlePopState = (event: any) => {
      event.preventDefault();
      clearFilters();
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  useEffect(() => {
    if (notificationCount > 0) {
      alert("You have unread notifications");
    }
  });

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
          />
          <TeamTablePagination
            setCurrentDeal={setCurrentDeals}
            filteredDeal={filteredDeals}
            totalPages={totalPages}
            setCurrentPage={setCurrentPage}
            handleItemsPerPageChange={handleItemsPerPageChange}
            currentPage={currentPage}
            itemsPerPage={itemsPerPage}
          />
        </CardContent>
      </Card>
    </div>
  );
}
