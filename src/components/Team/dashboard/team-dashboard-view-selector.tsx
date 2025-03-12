import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { statuses } from "@/components/Team/filter-popup";

export const TeamDashboardViewSelector = () => {
  return (
    <div className="space-y-2 w-[150px]">
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
  );
};
