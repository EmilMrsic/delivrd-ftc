"use client";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";

import { dateFormat, dealStageOptions, getElapsedTime } from "@/lib/utils";

import { MoreHorizontal, Search } from "lucide-react";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { DealNegotiator, EditNegotiationData, NegotiationData } from "@/types";
import { useRouter } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import DealNegotiatorDialog from "@/components/Team/deal-negotiator-dialog";
import TeamTablePagination from "@/components/Team/team-table-pagination";
import FilterPopup from "@/components/Team/filter-popup";

const NOW = new Date(new Date().toISOString().split("T")[0]);

export default function DealList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDeals, setFilteredDeals] = useState<NegotiationData[]>([]);
  const [originalDeals, setOriginalDeals] = useState<NegotiationData[]>([]);
  const [stopPropagation, setStopPropagation] = useState<boolean>(false);
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({});
  const [openNegotiatorState, setOpenNegotiatorState] = useState<
    Record<string, boolean>
  >({});
  const [negotiatorData, setNegotiatorData] = useState<DealNegotiator>();
  const [allDealNegotiator, setAllDealNegotiator] = useState<DealNegotiator[]>(
    []
  );
  const router = useRouter();

  const [itemsPerPage, setItemsPerPage] = useState(25);

  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(filteredDeals?.length / itemsPerPage);

  let currentDeals = filteredDeals?.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleItemsPerPageChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const newItemsPerPage = Number(e.target.value);
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

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

  const [filters, setFilters] = useState({
    stages: [] as string[],
    makes: [] as string[],
    models: [] as string[],
    dealCoordinators: [] as string[],
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

  const handleFilterChange = (
    filterType: keyof typeof filters,
    value: string
  ) => {
    setFilters((prevFilters) => {
      const updatedFilters = { ...prevFilters };

      if (updatedFilters[filterType].includes(value)) {
        updatedFilters[filterType] = updatedFilters[filterType].filter(
          (item) => item !== value
        );
      } else {
        updatedFilters[filterType] = [...updatedFilters[filterType], value];
      }

      if (
        updatedFilters.makes.length === 0 &&
        updatedFilters.stages.length === 0 &&
        updatedFilters.dealCoordinators.length === 0 // Check coordinators
      ) {
        setFilteredDeals(originalDeals);
      } else {
        applyFilters(updatedFilters);
      }

      return updatedFilters;
    });
  };

  const fetchAllNegotiation = async () => {
    try {
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

      const teamDocRef = doc(db, "team delivrd", id);
      const teamSnapshot = await getDoc(teamDocRef);

      if (!teamSnapshot.exists()) {
        console.log("Team document not found");
        return;
      }

      const teamData = teamSnapshot.data();
      setNegotiatorData(teamData as DealNegotiator);

      const activeDeals = teamData.active_deals;

      if (!Array.isArray(activeDeals) || activeDeals.length === 0) {
        console.log("No active deals found");
        return;
      }

      const negotiationsData = [];
      for (const id of activeDeals) {
        const negotiationDocRef = doc(db, "negotiations", id);
        const negotiationSnapshot = await getDoc(negotiationDocRef);

        if (negotiationSnapshot.exists()) {
          const data = negotiationSnapshot.data();
          negotiationsData.push(data);
        }
      }

      setOriginalDeals(negotiationsData as NegotiationData[]);
      setFilteredDeals(negotiationsData as NegotiationData[]);
    } catch (error) {
      console.error("Error fetching negotiations:", error);
    }
  };

  const applyFilters = (currentFilters: typeof filters) => {
    const filtered = originalDeals?.filter((deal) => {
      const matchesStage =
        currentFilters.stages.length === 0 ||
        currentFilters.stages.includes(deal.negotiations_Status ?? "");

      const matchesMake =
        currentFilters.makes.length === 0 ||
        currentFilters.makes.includes(deal.negotiations_Brand ?? "");

      const matchesCoordinators =
        currentFilters.dealCoordinators.length === 0 || // Use currentFilters here
        currentFilters.dealCoordinators.includes(
          deal.negotiations_deal_coordinator ?? ""
        );

      return matchesStage && matchesMake && matchesCoordinators;
    });

    setFilteredDeals(filtered);
  };

  const clearFilters = () => {
    const resetFilters = {
      stages: [],
      models: [],
      dealCoordinators: [],
      makes: [],
    };

    setFilters(resetFilters);
    setFilteredDeals(originalDeals);
  };

  const handleStageChange = async (id: string, newStage: string) => {
    try {
      await updateDoc(doc(db, "negotiations", id), {
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
        negotiations_deal_coordinator: newNegotiatorId,
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

  const getAllDealNegotiator = async () => {
    try {
      const teamCollection = collection(db, "team delivrd");

      const querySnapshot = await getDocs(teamCollection);

      const negotiatiatorData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      return negotiatiatorData as DealNegotiator[];
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchAllNegotiation();
  }, []);

  useEffect(() => {
    getAllDealNegotiator().then((res) => setAllDealNegotiator(res ?? []));
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        if (registrations.length === 0) {
          navigator.serviceWorker
            .register("../../../firebase-messaging-sw.js")
            .then((registration) => {
              console.log(
                "Service Worker registered successfully:",
                registration
              );
            })
            .catch((error) => {
              console.error("Service Worker registration failed:", error);
            });
        } else {
          console.log("Service Worker is already registered");
        }
      });
    } else {
      console.log("Service Workers are not supported in this browser.");
    }
  }, []);

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
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#0989E5] to-[#E4E5E9] text-transparent bg-clip-text">
            Client Deals Dashboard
          </h1>
          <h1 className="text-base font-semibold text-white text-transparent bg-clip-text">
            {negotiatorData?.name}
          </h1>
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
          <Table className="overflow-visible">
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Make</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Deal Negotiator</TableHead>
                <TableHead>Submitted Date</TableHead>
                <TableHead>Last Update</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            {currentDeals?.length ? (
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
                    </TableCell>

                    <TableCell className="max-w-[180px]">
                      {deal.negotiations_Brand}
                    </TableCell>

                    <TableCell>{deal.negotiations_Model}</TableCell>

                    <TableCell>
                      <DropdownMenu
                        open={openStates[deal.id] || false}
                        onOpenChange={(isOpen) =>
                          toggleDropdown(deal.id, isOpen)
                        }
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
                            <p>
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
                            </p>
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

                    <TableCell>
                      <div>{dateFormat(deal.negotiations_Created ?? "")}</div>
                      <div className="text-xs text-[#0989E5]">
                        {getElapsedTime(deal.negotiations_Created ?? "", NOW)}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div>
                        {dateFormat(deal.negotiations_Status_Updated ?? "")}
                      </div>
                      <div className="text-xs text-[#0989E5]">
                        {getElapsedTime(
                          deal.negotiations_Status_Updated ?? "",
                          NOW
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {dateFormat(deal.negotiations_Deal_Start_Date ?? "")}
                      </div>
                      <div className="text-xs text-[#0989E5]">
                        {getElapsedTime(
                          deal.negotiations_Deal_Start_Date ?? "",
                          NOW
                        )}
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
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            ) : (
              <TableBody>
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-4">
                    <svg
                      className="animate-spin h-8 w-8 text-gray-400 mx-auto"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8v8z"
                      ></path>
                    </svg>
                  </TableCell>
                </TableRow>
              </TableBody>
            )}
          </Table>
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
