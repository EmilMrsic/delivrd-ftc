import React, { useRef, useState } from "react";
import { Button } from "../ui/button";
import { ChevronDown, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { dealStageOptions, vehicleOfInterest } from "@/lib/utils";
import Link from "next/link";
import { DealNegotiatorType } from "@/lib/models/team";

type FilterPopupProps = {
  filters: any;
  handleFilterChange: (
    type: "stages" | "makes" | "models" | "dealCoordinators" | "onboarding",
    value: string
  ) => void;

  dealCoordinators: DealNegotiatorType[];
};

export const statuses = [
  "Paid Holding",
  "Old Deals",
  "Need To Review",
  "View By Brand",
  "Reminder Status",
  "Should Have Received a Car",
];

const FilterPopup = ({
  filters,
  handleFilterChange,
  dealCoordinators,
}: FilterPopupProps) => {
  const [searchStages, setSearchStages] = useState("");
  const [searchMakes, setSearchMakes] = useState("");
  const [searchCoordinators, setSearchCoordinators] = useState("");
  const searchStageInputRef = useRef<HTMLInputElement>(null);
  const searchCoordinatorInputRef = useRef<HTMLInputElement>(null);
  const searchMakeInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-wrap gap-4 items-start w-full">
      <div className="space-y-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              Select Deal Coordinators
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-auto">
            <input
              ref={searchCoordinatorInputRef}
              autoFocus
              type="text"
              placeholder="Search coordinators..."
              className="w-full px-2 py-1 border border-gray-300 rounded-md mb-2"
              onChange={
                (e) => setSearchCoordinators(e.target.value.toLowerCase()) // Update search state
              }
            />
            <div className="max-h-56 overflow-scroll">
              {dealCoordinators
                .filter((coordinator) => coordinator.visible)
                .map((coordinator, index) => (
                  <DropdownMenuCheckboxItem
                    key={index}
                    onFocus={() => searchCoordinatorInputRef.current?.focus()}
                    checked={filters.dealCoordinators.includes(coordinator.id)}
                    onCheckedChange={() =>
                      handleFilterChange("dealCoordinators", coordinator.id)
                    }
                  >
                    {coordinator.name}
                  </DropdownMenuCheckboxItem>
                ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="space-y-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              Select View
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-auto">
            <div className="flex flex-col w-fit">
              {statuses.map((status, index) => (
                <Link
                  key={index}
                  className="p-2 text-sm hover:underline cursor-pointer"
                  href={`/${status.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {status}
                </Link>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default FilterPopup;
