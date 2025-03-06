import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

export const StageDropdown = ({
  toggleDropdown,
  openStates,
  deal,
  handleStageChange,
  dealStageOptions,
  getStatusStyles,
}: any) => {
  return (
    <DropdownMenu
      open={openStates[deal.id] || false}
      onOpenChange={(isOpen) => toggleDropdown(deal.id, isOpen)}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          style={{
            backgroundColor: getStatusStyles(deal?.negotiations_Status ?? "")
              .backgroundColor,
            color: getStatusStyles(deal?.negotiations_Status ?? "").textColor, // Set dynamic text color
          }}
          className="cursor-pointer p-1 w-fit h-fit text-xs border-gray-300"
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
  );
};
