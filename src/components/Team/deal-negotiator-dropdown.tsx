import { DealNegotiator } from "@/types";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";

export const DealNegotiatorDropdown = ({
  deal,
  allDealNegotiator,
  openNegotiatorState,
  toggleNegotiatorDropdown,
  updateDealNegotiator,
}: {
  deal: NegotiationDataType;
  allDealNegotiator: DealNegotiatorType[];
  openNegotiatorState: { [key: string]: boolean };
  toggleNegotiatorDropdown: (id: string, isOpen: boolean) => void;
  updateDealNegotiator: (id: string, negotiatorId: string) => void;
}) => {
  return (
    <DropdownMenu
      open={openNegotiatorState[deal.id] || false}
      onOpenChange={(isOpen) => toggleNegotiatorDropdown(deal.id, isOpen)}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={`cursor-pointer p-1 w-fit h-fit text-xs bg-gray-100 text-gray-800 border-gray-300`}
        >
          {allDealNegotiator.some(
            (negotiator) => negotiator.id === deal.dealCoordinatorId
          ) ? (
            <p>
              {
                allDealNegotiator.find(
                  (negotiator) => negotiator.id === deal.dealCoordinatorId
                )?.name
              }
            </p>
          ) : (
            <p>Not Assigned</p>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 h-56 overflow-scroll">
        {allDealNegotiator.map((negotiator: DealNegotiatorType, index) => (
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
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
