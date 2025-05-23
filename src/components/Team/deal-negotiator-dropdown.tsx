import { DealNegotiator } from "@/types";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";
import { useState } from "react";
import { X } from "lucide-react";

export const DealNegotiatorDropdown = ({
  deal,
  allDealNegotiator,
  updateDealNegotiator,
  onRemoveNegotiator,
}: {
  deal: NegotiationDataType;
  allDealNegotiator: DealNegotiatorType[];
  updateDealNegotiator: (id: string, negotiatorId: string) => void;
  onRemoveNegotiator?: (id: string) => void;
}) => {
  const [openNegotiatorState, setOpenNegotiatorState] =
    useState<boolean>(false);

  if (!deal) return null;

  return (
    <>
      {onRemoveNegotiator && (
        <X
          className="cursor-pointer w-fit mr-0 ml-auto"
          onClick={() => onRemoveNegotiator(deal.id)}
        />
      )}
      <DropdownMenu
        open={openNegotiatorState}
        onOpenChange={(isOpen) => setOpenNegotiatorState(isOpen)}
      >
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={`relative cursor-pointer p-1 w-fit h-fit text-xs bg-gray-100 text-gray-800 border-gray-300`}
          >
            {allDealNegotiator.some(
              (negotiator) => negotiator.id === deal.dealCoordinatorId
            ) ? (
              <>
                <p>
                  {
                    allDealNegotiator.find(
                      (negotiator) => negotiator.id === deal.dealCoordinatorId
                    )?.name
                  }
                </p>
              </>
            ) : (
              <p>Not Assigned</p>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56 h-56 overflow-scroll z-[9999]">
          {allDealNegotiator.map((negotiator: DealNegotiatorType, index) => (
            <DropdownMenuItem
              key={index}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                updateDealNegotiator(deal.id, negotiator.id);
                setOpenNegotiatorState(false);
              }}
            >
              {negotiator.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
