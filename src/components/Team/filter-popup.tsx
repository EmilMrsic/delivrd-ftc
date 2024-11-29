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

type FilterPopupProps = {
  filters: any;
  handleFilterChange: (
    type: "stages" | "makes" | "models",
    value: string
  ) => void;
};

const FilterPopup = ({ filters, handleFilterChange }: FilterPopupProps) => {
  return (
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
            <h4 className="font-medium leading-none mb-2">Makes</h4>
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
  );
};

export default FilterPopup;
