import React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Button } from "../ui/button";
import { ChevronDown, Filter } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { dealStageOptions, vehicleOfInterest } from "@/lib/utils";
import { DealNegotiator } from "@/types";

type FilterPopupProps = {
  filters: any;
  handleFilterChange: (
    type: "stages" | "makes" | "models" | "dealCoordinators",
    value: string
  ) => void;

  dealCoordinators: DealNegotiator[];
};

const FilterPopup = ({
  filters,
  handleFilterChange,
  dealCoordinators,
}: FilterPopupProps) => {
  return (
    <div className="flex gap-4">
      <div className="space-y-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              Select Stages
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 h-56 overflow-scroll">
            {dealStageOptions.map((stage, index) => (
              <DropdownMenuCheckboxItem
                key={index}
                checked={filters.stages.includes(stage)}
                onCheckedChange={() => handleFilterChange("stages", stage)}
              >
                {stage}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="space-y-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              Select Makes
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 h-56 overflow-scroll">
            {vehicleOfInterest.map((make: string, index) => (
              <DropdownMenuCheckboxItem
                key={index}
                checked={filters.makes.includes(make ?? "")}
                onCheckedChange={() => handleFilterChange("makes", make ?? "")}
              >
                {make}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="space-y-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              Select Deal Coordinators
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 h-56 overflow-scroll">
            {dealCoordinators.map((coordinator, index) => (
              <DropdownMenuCheckboxItem
                key={index}
                checked={filters.dealCoordinators.includes(coordinator.id)}
                onCheckedChange={() =>
                  handleFilterChange("dealCoordinators", coordinator.id)
                }
              >
                {coordinator.name}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default FilterPopup;
