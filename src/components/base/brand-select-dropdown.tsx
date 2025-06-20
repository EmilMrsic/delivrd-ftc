import { useState } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { negotiationMakeColors } from "@/lib/constants/negotiations";
import { NormalDropdown } from "../tailwind-plus/normal-dropdown";

export const BrandSelectDropdown = () => {
  const [selectedBrand, setSelectedBrand] = useState<string>("All");
  return (
    <NormalDropdown
      options={["All", ...Object.keys(negotiationMakeColors)]}
      default="All"
    />
  );
};
