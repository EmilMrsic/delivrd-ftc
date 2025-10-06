import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";
import { Button } from "../ui/button";

export const DealSupportDropdown = ({
  negotiation,
  allDealNegotiator,
  updateDealSupportAgent,
}: {
  negotiation: NegotiationDataType;
  allDealNegotiator: DealNegotiatorType[];
  updateDealSupportAgent: (id: string, newSupportId: string) => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <>
      <DropdownMenu open={isOpen} onOpenChange={(isOpen) => setIsOpen(isOpen)}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className={`relative cursor-pointer p-1 w-fit h-fit text-xs bg-gray-100 text-gray-800 border-gray-300`}
          >
            {allDealNegotiator.some(
              (negotiator) => negotiator.id === negotiation.supportAgentId
            ) ? (
              <>
                <p>
                  {
                    allDealNegotiator.find(
                      (negotiator) =>
                        negotiator.id === negotiation.supportAgentId
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
          {allDealNegotiator
            .filter((negotiator: DealNegotiatorType) => {
              const isVisible =
                process.env.NEXT_PUBLIC_MODE === "development" ||
                negotiator.visible !== false;
              return isVisible;
            })
            .map((negotiator: DealNegotiatorType, index) => (
              <DropdownMenuItem
                key={index}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateDealSupportAgent(negotiation.id, negotiator.id);
                  setIsOpen(false);
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
