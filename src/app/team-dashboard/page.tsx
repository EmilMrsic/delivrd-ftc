"use client";
import { useState } from "react";
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

const NOW = new Date("2024-10-17");

const stages = [
  { name: "Actively Negotiating", category: "momentum" },
  { name: "Contacted", category: "momentum" },
  { name: "Deal Started", category: "momentum" },
  { name: "Follow Up", category: "uncertain" },
  { name: "Scheduled", category: "momentum" },
  { name: "Proposal Sent", category: "momentum" },
  { name: "Ready & Confirmed", category: "momentum" },
  { name: "Paid", category: "momentum" },
  { name: "Shipping", category: "momentum" },
  { name: "Delivery Scheduled", category: "momentum" },
  { name: "Tomi Needs To Review", category: "uncertain" },
  { name: "Ask for Review", category: "momentum" },
  { name: "Client Nurture", category: "uncertain" },
  { name: "Paid Need to finalize", category: "momentum" },
  { name: "Follow Up Issue", category: "negative" },
  { name: "Paid Holding", category: "uncertain" },
  { name: "Paid Lost Contact", category: "negative" },
  { name: "Client Delayed 1 Week", category: "negative" },
  { name: "Client Delayed 2 Weeks", category: "negative" },
  { name: "Client Delayed Other", category: "negative" },
  { name: "Manually Added", category: "uncertain" },
  { name: "Insta-Pay", category: "momentum" },
  { name: "Long Term Order", category: "uncertain" },
  { name: "Lost", category: "negative" },
  { name: "No Show", category: "negative" },
  { name: "Unqualified", category: "negative" },
  { name: "Refunded", category: "negative" },
  { name: "Canceled", category: "negative" },
];

// Mock data for demonstration
const deals = [
  {
    id: 1,
    name: "Brandon Smith",
    stage: "Paid",
    submittedDate: "2024-07-01",
    lastUpdateDate: "2024-07-12",
    city: "Los Angeles",
    state: "CA",
    make: "Honda",
    model: "CR-V",
    paymentType: "Lease",
  },
  {
    id: 2,
    name: "Emily Johnson",
    stage: "Actively Negotiating",
    submittedDate: "2024-07-03",
    lastUpdateDate: "2024-10-10",
    city: "New York",
    state: "NY",
    make: "Toyota",
    model: "Camry",
    paymentType: "Finance",
  },
  {
    id: 3,
    name: "Michael Brown",
    stage: "Contacted",
    submittedDate: "2024-07-05",
    lastUpdateDate: "2024-07-05",
    city: "Chicago",
    state: "IL",
    make: "Ford",
    model: "F-150",
    paymentType: "Cash",
  },
  {
    id: 4,
    name: "Sarah Davis",
    stage: "Proposal Sent",
    submittedDate: "2024-06-28",
    lastUpdateDate: "2024-10-11",
    city: "Houston",
    state: "TX",
    make: "Chevrolet",
    model: "Equinox",
    paymentType: "Lease",
  },
  {
    id: 5,
    name: "David Wilson",
    stage: "Follow Up",
    submittedDate: "2024-07-02",
    lastUpdateDate: "2024-10-09",
    city: "Phoenix",
    state: "AZ",
    make: "Nissan",
    model: "Altima",
    paymentType: "Finance",
  },
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
    case "momentum":
      return "bg-green-100 text-green-800 border-green-300";
    default:
      return "bg-blue-100 text-blue-800 border-blue-300";
  }
};

export default function DealList() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredDeals, setFilteredDeals] = useState(deals);
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

  const applyFilters = (term: string, currentFilters: typeof filters) => {
    const filtered = deals.filter(
      (deal) =>
        (deal.name.toLowerCase().includes(term.toLowerCase()) ||
          deal.stage.toLowerCase().includes(term.toLowerCase()) ||
          deal.city.toLowerCase().includes(term.toLowerCase()) ||
          deal.state.toLowerCase().includes(term.toLowerCase())) &&
        (currentFilters.stages.length === 0 ||
          currentFilters.stages.includes(deal.stage)) &&
        (currentFilters.makes.length === 0 ||
          currentFilters.makes.includes(deal.make)) &&
        (currentFilters.models.length === 0 ||
          currentFilters.models.includes(deal.model)) &&
        (currentFilters.paymentTypes.length === 0 ||
          currentFilters.paymentTypes.includes(deal.paymentType))
    );
    setFilteredDeals(filtered);
  };

  const handleStageChange = (dealId: number, newStage: string) => {
    const updatedDeals = filteredDeals.map((deal) =>
      deal.id === dealId
        ? {
            ...deal,
            stage: newStage,
            lastUpdateDate: NOW.toISOString().split("T")[0],
          }
        : deal
    );
    setFilteredDeals(updatedDeals);
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
                          new Set(deals.map((deal) => deal.make))
                        ).map((make) => (
                          <DropdownMenuCheckboxItem
                            key={make}
                            checked={filters.makes.includes(make)}
                            onCheckedChange={() =>
                              handleFilterChange("makes", make)
                            }
                          >
                            {make}
                          </DropdownMenuCheckboxItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">Payment Types</h4>
                    {Array.from(
                      new Set(deals.map((deal) => deal.paymentType))
                    ).map((type) => (
                      <div key={type} className="flex items-center space-x-2">
                        <Checkbox
                          id={`payment-${type}`}
                          checked={filters.paymentTypes.includes(type)}
                          onCheckedChange={() =>
                            handleFilterChange("paymentTypes", type)
                          }
                        />
                        <Label htmlFor={`payment-${type}`}>{type}</Label>
                      </div>
                    ))}
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
            <TableBody>
              {filteredDeals.map((deal) => (
                <TableRow key={deal.id}>
                  <TableCell className="font-medium">
                    <div>
                      <span>{deal.name}</span>
                      <div className="text-sm text-gray-400">
                        {deal.city}, {deal.state}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {deal.make} {deal.model}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Badge
                          variant="outline"
                          className={`cursor-pointer ${getStageColor(
                            deal.stage
                          )}`}
                        >
                          {deal.stage}
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
                    <div>{formatDate(deal.submittedDate)}</div>
                    <div className="text-xs text-gray-400">
                      {getElapsedTime(deal.submittedDate, NOW)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>{formatDate(deal.lastUpdateDate)}</div>
                    <div className="text-xs text-gray-400">
                      {getElapsedTime(deal.lastUpdateDate, NOW)}
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
                              name="Test"
                              description="Text Description"
                              status="Active"
                              manager={{ name: "Test", avatar: "Test Avatar" }}
                              team={[{ name: "Test", avatar: "Test Avatar" }]}
                              startDate="2024-10-21"
                              endDate="2027-10-21"
                            />
                          </DialogContent>
                        </Dialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
