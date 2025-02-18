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
import { DealNegotiator } from "@/types";

type FilterPopupProps = {
  filters: any;
  handleFilterChange: (
    type: "stages" | "makes" | "models" | "dealCoordinators" | "onboarding",
    value: string
  ) => void;

  dealCoordinators: DealNegotiator[];
};

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
            <Button variant="outline" className="w-full flex justify-between">
              Select Stages
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className=" w-auto">
            <input
              ref={searchStageInputRef}
              type="text"
              placeholder="Search stages..."
              className="w-full px-2 py-1 border border-gray-300 rounded-md mb-2"
              onChange={(e) => setSearchStages(e.target.value.toLowerCase())}
              autoFocus
            />
            <div className="h-56 overflow-scroll">
              {dealStageOptions
                .filter((stage) =>
                  stage.toLowerCase().includes(searchStages.toLowerCase())
                )
                .map((stage, index) => (
                  <DropdownMenuCheckboxItem
                    key={"stage" + index}
                    tabIndex={-1}
                    onFocus={() => searchStageInputRef.current?.focus()}
                    checked={filters.stages === stage}
                    onCheckedChange={() => handleFilterChange("stages", stage)}
                  >
                    {stage}
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
              Select Makes
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-auto">
            <input
              ref={searchMakeInputRef}
              autoFocus
              type="text"
              onFocus={() => searchMakeInputRef.current?.focus()}
              placeholder="Search makes..."
              className="w-full px-2 py-1 border border-gray-300 rounded-md mb-2"
              onChange={
                (e) => setSearchMakes(e.target.value.toLowerCase()) // Update search state
              }
            />
            <div className="h-56 overflow-scroll">
              {vehicleOfInterest
                .filter((make) =>
                  make.toLowerCase().includes(searchMakes.toLowerCase())
                )
                .map((make: string, index) => (
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
            </div>
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
            <div className="h-56 overflow-scroll">
              {dealCoordinators
                .filter((coordinator) =>
                  coordinator.name
                    .toLowerCase()
                    .includes(searchCoordinators.toLowerCase())
                )
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
              Select Onboarding Status
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-auto">
            <div className="overflow-scroll">
              {["Yes", "No"].map((status, index) => (
                <DropdownMenuCheckboxItem
                  key={index}
                  checked={filters.onboarding.includes(status.toLowerCase())}
                  onCheckedChange={() =>
                    handleFilterChange("onboarding", status.toLowerCase())
                  }
                >
                  {status}
                </DropdownMenuCheckboxItem>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};

export default FilterPopup;
