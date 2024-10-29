"use client";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
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
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MoreHorizontal, Search, Filter, ChevronDown } from "lucide-react";
import ProjectProfile from "@/components/base/project-profile";
import { collection, getDocs, query } from "firebase/firestore";
import { db } from "@/firebase/config";
import { Negotiation } from "@/types";
import { useRouter } from "next/navigation";

const NOW = new Date("2024-10-17");

const stages = [
  { name: "PAID", category: "paid" },
  { name: "Contacted", category: "paid" },
  { name: "Deal Started", category: "paid" },
  { name: "Follow Up", category: "uncertain" },
  { name: "Scheduled", category: "paid" },
  { name: "Proposal Sent", category: "paid" },
  { name: "Ready & Confirmed", category: "paid" },
  { name: "Paid", category: "paid" },
  { name: "Shipping", category: "paid" },
  { name: "Delivery Scheduled", category: "paid" },
  { name: "Tomi Needs To Review", category: "uncertain" },
  { name: "Ask for Review", category: "paid" },
  { name: "Client Nurture", category: "uncertain" },
  { name: "Paid Need to finalize", category: "paid" },
  { name: "Follow Up Issue", category: "negative" },
  { name: "Paid Holding", category: "uncertain" },
  { name: "Paid Lost Contact", category: "negative" },
  { name: "Client Delayed 1 Week", category: "negative" },
  { name: "Client Delayed 2 Weeks", category: "negative" },
  { name: "Client Delayed Other", category: "negative" },
  { name: "Manually Added", category: "uncertain" },
  { name: "Insta-Pay", category: "paid" },
  { name: "Long Term Order", category: "uncertain" },
  { name: "Lost", category: "negative" },
  { name: "No Show", category: "negative" },
  { name: "Unqualified", category: "negative" },
  { name: "Refunded", category: "negative" },
  { name: "Canceled", category: "negative" },
];

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "2-digit",
  });
};

const getElapsedTime = (startDate: string, endDate: Date) => {
  const start = new Date(startDate);
  const diffTime = Math.abs(endDate.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 7) {
    return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
  } else {
    const diffWeeks = Math.floor(diffDays / 7);
    return `${diffWeeks} week${diffWeeks !== 1 ? "s" : ""} ago`;
  }
};

const getStageColor = (stageName: string) => {
  const stage = stages.find((s) => s.name === stageName);
  if (!stage) return "bg-gray-100 text-gray-800 border-gray-300";

  switch (stage.category) {
    case "negative":
      return "bg-red-100 text-red-800 border-red-300";
    case "uncertain":
      return "bg-gray-100 text-gray-800 border-gray-300";
    case "paid":
      return "bg-green-100 text-green-800 border-green-300";
    default:
      return "bg-blue-100 text-blue-800 border-blue-300";
  }
};

export default function DealList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDeals, setFilteredDeals] = useState<Negotiation[] | undefined>(
    []
  );
  const router = useRouter();

  const [filters, setFilters] = useState({
    stages: [] as string[],
    makes: [] as string[],
    models: [] as string[],
    paymentTypes: [] as string[],
  });

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    const term = event.target.value;
    setSearchTerm(term);
    applyFilters(term, filters);
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
      applyFilters(searchTerm, updatedFilters);
      return updatedFilters;
    });
  };

  const fetchAllNegotiation = async () => {
    try {
      const negotiationQuery = query(collection(db, "negotiations"));
      const querySnapshot = await getDocs(negotiationQuery);

      const negotiationData = querySnapshot.docs
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            negotiations_Client: data.negotiations_Client,
            negotiations_Brand: data.negotiations_Brand,
            negotiations_Model: data.negotiations_Model,
            negotiations_Invoice_Status: data.negotiations_Invoice_Status,
            negotiations_Created: data.negotiations_Created,
            lastUpdated: data.negotiations_Status_Updated, // Assuming this is a Firestore Timestamp
          };
        })
        .filter(
          (negotiation) =>
            negotiation.negotiations_Client &&
            negotiation.negotiations_Brand &&
            negotiation.negotiations_Model &&
            negotiation.negotiations_Invoice_Status
        ); // Filter to include only those with all specified attributes

      return negotiationData; // Return the filtered data
    } catch (error) {
      console.log(error);
    }
  };

  const applyFilters = (term: string, currentFilters: typeof filters) => {
    const filtered = filteredDeals?.filter(
      (deal) =>
        deal.negotiations_Client?.toLowerCase().includes(term.toLowerCase()) ||
        deal.negotiations_Invoice_Status
          ?.toLowerCase()
          .includes(term.toLowerCase()) ||
        ((currentFilters.makes.length === 0 ||
          currentFilters.makes.includes(deal.negotiations_Brand ?? "")) &&
          (currentFilters.models.length === 0 ||
            currentFilters.models.includes(deal.negotiations_Model ?? "")) &&
          (currentFilters.paymentTypes.length === 0 ||
            currentFilters.paymentTypes.includes(
              deal.negotiations_Invoice_Status ?? ""
            )))
    );
    setFilteredDeals(filtered);
  };

  const handleStageChange = (dealId: string, newStage: string) => {
    const updatedDeals = filteredDeals?.map((deal) =>
      deal?.id ?? "" === dealId
        ? {
            ...deal,
            stage: newStage,
            lastUpdateDate: NOW.toISOString().split("T")[0],
          }
        : deal
    );
    setFilteredDeals(updatedDeals);
  };

  useEffect(() => {
    fetchAllNegotiation().then((res) => setFilteredDeals(res));
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
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#0989E5] to-[#E4E5E9] text-transparent bg-clip-text">
          Client Deals Dashboard
        </h1>
      </div>
      <Card className="bg-white shadow-lg">
        <CardContent>
          <div className="flex justify-between items-center mb-4 mt-4">
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
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="grid gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none mb-2">Stages</h4>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                        >
                          Select Stages
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56">
                        {stages.map((stage) => (
                          <DropdownMenuCheckboxItem
                            key={stage.name}
                            checked={filters.stages.includes(stage.name)}
                            onCheckedChange={() =>
                              handleFilterChange("stages", stage.name)
                            }
                          >
                            {stage.name}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none mb-2">Makes</h4>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-between"
                        >
                          Select Makes
                          <ChevronDown className="ml-2 h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56">
                        {Array.from(
                          new Set(
                            filteredDeals?.map(
                              (deal) => deal.negotiations_Brand
                            )
                          )
                        ).map((make: any) => (
                          <DropdownMenuCheckboxItem
                            key={make}
                            checked={filters.makes.includes(make ?? "")}
                            onCheckedChange={() =>
                              handleFilterChange("makes", make ?? "")
                            }
                          >
                            {make}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Client</TableHead>
                <TableHead>Make/Model</TableHead>
                <TableHead>Stage</TableHead>
                <TableHead>Submitted Date</TableHead>
                <TableHead>Last Update</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            {filteredDeals?.length ? (
              <TableBody>
                {filteredDeals?.map((deal) => (
                  <TableRow
                    className="cursor-pointer"
                    onClick={() => router.push(`/team-profile?id=${deal.id}`)}
                    key={deal.id}
                  >
                    <TableCell className="font-medium max-w-[220px]">
                      <span>{deal.negotiations_Client}</span>
                    </TableCell>
                    <TableCell className="max-w-[180px]">
                      {deal.negotiations_Brand} {deal.negotiations_Model}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Badge
                            variant="outline"
                            className={`cursor-pointer ${getStageColor(
                              deal.negotiations_Invoice_Status ?? ""
                            )}`}
                          >
                            {deal.negotiations_Invoice_Status}
                          </Badge>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56">
                          <DropdownMenuLabel>Change Stage</DropdownMenuLabel>
                          {stages.map((stage) => (
                            <DropdownMenuItem
                              key={stage.name}
                              onClick={() =>
                                handleStageChange(deal.id, stage.name)
                              }
                            >
                              {stage.name}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>

                    <TableCell>
                      <div>{formatDate(deal.negotiations_Created ?? "")}</div>
                      <div className="text-xs text-gray-400">
                        {getElapsedTime(deal.negotiations_Created ?? "", NOW)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>{formatDate(deal.lastUpdated)}</div>
                      <div className="text-xs text-gray-400">
                        {getElapsedTime(deal.lastUpdated, NOW)}
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
                          <Dialog>
                            <DialogTrigger asChild>
                              <DropdownMenuItem
                                onSelect={(e) => e.preventDefault()}
                              >
                                View Details
                              </DropdownMenuItem>
                            </DialogTrigger>
                            <DialogContent className="max-w-7xl">
                              <ProjectProfile
                                name={deal.negotiations_Client ?? ""}
                                description="Text Description"
                                status={deal.negotiations_Invoice_Status ?? ""}
                                manager={{
                                  name: "Test",
                                  avatar: "Test Avatar",
                                }}
                                team={[{ name: "Test", avatar: "Test Avatar" }]}
                                startDate={formatDate(
                                  deal.negotiations_Created ?? ""
                                )}
                                endDate={formatDate(deal.lastUpdated ?? "")}
                              />
                            </DialogContent>
                          </Dialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            ) : (
              <TableBody>
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-4">
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
        </CardContent>
      </Card>
    </div>
  );
}
