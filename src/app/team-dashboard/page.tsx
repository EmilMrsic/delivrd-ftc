"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { fetchActiveDeals } from "@/lib/utils";
import { BellIcon, Search } from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
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
  } = useTeamDashboard();

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
    stages: [] as string[],
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
        deal.negotiations_Client?.toLowerCase().includes(term) ||
        deal.negotiations_Brand?.toLowerCase().includes(term) ||
        deal.negotiations_Model?.toLowerCase().includes(term) ||
        deal.negotiations_Status?.toLowerCase().includes(term)
      );
    });

    setFilteredDeals(filtered);
  };

  const handleFilterChange = async (
    filterType: keyof typeof filters,
    value: string
  ) => {
    setFilters((prevFilters) => {
      const updatedFilters = { ...prevFilters };

      if (filterType === "dealCoordinators") {
        updatedFilters.stages = [];
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
        if (updatedFilters.dealCoordinators === value) {
          updatedFilters.dealCoordinators = "";
          setLoading(true);
          fetchActiveDeals(id)
            .then((deals) => {
              console.log({ deals });
              setOriginalDeals(deals as NegotiationData[]);
              const defaultFilteredDeals = deals?.filter(
                (deal: NegotiationData) =>
                  ["Actively Negotiating", "Deal Started", "Paid"].includes(
                    deal.negotiations_Status ?? ""
                  )
              );
              setFilteredDeals(defaultFilteredDeals as NegotiationData[]);
              setLoading(false);
            })
            .catch((error) => console.error("Error applying filter:", error));
        } else {
          updatedFilters.dealCoordinators = value;
          setLoading(true);
          fetchActiveDeals(value)
            .then((deals) => {
              console.log({ deals });
              setOriginalDeals(deals as NegotiationData[]);
              const defaultFilteredDeals = deals?.filter(
                (deal: NegotiationData) =>
                  ["Actively Negotiating", "Deal Started", "Paid"].includes(
                    deal.negotiations_Status ?? ""
                  )
              );
              setFilteredDeals(defaultFilteredDeals as NegotiationData[]);
              setLoading(false);
            })
            .catch((error) => console.error("Error applying filter:", error));
        }
      } else {
        if (updatedFilters[filterType].includes(value)) {
          updatedFilters[filterType] = updatedFilters[filterType].filter(
            (item) => item !== value
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
          ? ["Actively Negotiating", "Deal Started", "Paid"].includes(
              deal.negotiations_Status ?? ""
            )
          : currentFilters.stages.includes("Processing")
          ? otherStages.includes(deal.negotiations_Status?.trim() ?? "")
          : currentFilters.stages.includes("Paid/Unassigned")
          ? deal.negotiations_Status?.trim() === "Paid" &&
            !deal.negotiations_deal_coordinator
          : currentFilters.stages.includes(
              deal.negotiations_Status?.trim() ?? ""
            );
      const matchesMake =
        currentFilters.makes.length === 0 ||
        currentFilters.makes.includes(deal.negotiations_Brand ?? "");

      const matchesCoordinators =
        currentFilters.dealCoordinators === "" ||
        currentFilters.dealCoordinators ===
          (deal.negotiations_deal_coordinator ?? "");
      const onboardingStatus =
        deal.hasOwnProperty("negotiations_Onboarding_Complete") &&
        deal?.negotiations_Onboarding_Complete &&
        deal?.negotiations_Onboarding_Complete?.toLowerCase() === "yes"
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
      stages: [],
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
    setLoading(true);
    fetchActiveDeals(id)
      .then((deals) => {
        setOriginalDeals(deals as NegotiationData[]);

        const defaultFilteredDeals = deals?.filter((deal: NegotiationData) =>
          ["Actively Negotiating", "Deal Started", "Paid"].includes(
            deal.negotiations_Status ?? ""
          )
        );
        setFilteredDeals(defaultFilteredDeals as NegotiationData[]);
        setLoading(false);
      })
      .catch((error) => console.error("Error applying filter:", error));
  };

  const handleStageChange = async (id: string, newStage: string) => {
    try {
      await updateDoc(doc(db, "negotiations", id ?? ""), {
        negotiations_Status: newStage,
      });

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
      toast({ title: "Status updated" });
    } catch (error) {
      console.error("Error updating stage:", error);
    }
  };

  const updateDealNegotiator = async (id: string, newNegotiatorId: string) => {
    try {
      const dealRef = doc(db, "negotiations", id);

      await updateDoc(dealRef, {
        negotiations_deal_coordinator: newNegotiatorId ?? "",
      });

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

  return (
    <div className="container mx-auto p-4 space-y-6 bg-[#E4E5E9] min-h-screen">
      <div className="flex justify-between items-center bg-[#202125] p-6 rounded-lg shadow-lg">
        <div className="flex flex-col items-start">
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-JoIhMlHLZk8imAGedndft4tH9e057R.png"
            alt="DELIVRD Logo"
            className="h-8 mb-2"
          />
          <p className="text-white text-sm">Putting Dreams In Driveways</p>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu onOpenChange={handleBellClick}>
            <DropdownMenuTrigger>
              <div className="relative">
                <BellIcon className="w-6 h-6" color="#fff" />
                {notificationCount > 0 && (
                  <div className="absolute top-[-5px] right-[-5px] flex justify-center items-center w-4 h-4 bg-red-500 text-white text-xs rounded-full">
                    {notificationCount}
                  </div>
                )}
              </div>
            </DropdownMenuTrigger>

            <DropdownMenuContent className="z-50 ">
              <div
                className={`bg-white flex flex-col ${
                  notification.length ? "max-h-[300px]" : "h-auto"
                }  overflow-y-scroll gap-3 p-2 z-10 rounded-xl`}
              >
                {notification.length ? (
                  notification.map((item, index) => (
                    <Link
                      key={index}
                      target="_blank"
                      href={item.link ?? "/"}
                      className="flex flex-col gap-1 p-3 rounded-[8px] items-start hover:bg-gray-200"
                    >
                      <p className="font-bold text-lg">{item.title}</p>
                      <p className="font-normal text-gray-500 text-sm">
                        {item.body}
                      </p>
                    </Link>
                  ))
                ) : (
                  <p>No notifications available</p>
                )}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#0989E5] to-[#E4E5E9] text-transparent bg-clip-text">
              Client Deals Dashboard
            </h1>
            <h1 className="text-base font-semibold text-white text-transparent bg-clip-text">
              {negotiatorData?.name}
            </h1>
          </div>
        </div>
      </div>
      <Card className="bg-white shadow-lg">
        <CardContent>
          <div className="flex gap-3 items-center mb-4 mt-4">
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Search deals..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-8"
              />
            </div>

            <FilterPopup
              dealCoordinators={allDealNegotiator}
              handleFilterChange={handleFilterChange}
              filters={filters}
            />
            <Button
              onClick={clearFilters}
              variant="outline"
              className={`cursor-pointer p-1 w-fit h-fit text-xs bg-gray-100 text-gray-800 border-gray-300`}
            >
              <p>Clear filters</p>
            </Button>
          </div>

          <TeamDashboardTable
            loading={loading}
            setStopPropagation={setStopPropagation}
            stopPropagation={stopPropagation}
            negotiatorData={negotiatorData}
            allDealNegotiator={allDealNegotiator}
            allInternalNotes={allInternalNotes}
            currentDeals={currentDeals}
            handleStageChange={handleStageChange}
            updateDealNegotiator={updateDealNegotiator}
          />
          <TeamTablePagination
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
