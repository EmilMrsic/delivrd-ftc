import { useMemo, useState } from "react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { dealStageOptions, getStatusStyles } from "@/lib/utils";
import { sortStatuses } from "@/lib/helpers/negotiation";
import { NegotiationDataType } from "@/lib/models/team";
import { toast } from "@/hooks/use-toast";
import { doc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

export const StageDropdown = ({
  deal,
  handleStageChange,
  setNegotiation,
}: {
  deal: NegotiationDataType;
  handleStageChange?: (id: string, stage: string) => void;
  setNegotiation?: (negotiation: NegotiationDataType) => void;
}) => {
  const [openStates, setOpenStates] = useState<Record<string, boolean>>({});

  const updateStatus = async (stage: string) => {
    try {
      await updateDoc(doc(db, "delivrd_negotiations", deal.id), {
        stage: stage,
      });

      if (setNegotiation) {
        setNegotiation({ ...deal, stage: stage });
      }

      toast({ title: "Status updated" });
    } catch (error) {
      console.error("Error updating stage:", error);
    }
  };

  const toggleDropdown = (id: string, isOpen: boolean) => {
    setOpenStates((prev) => ({
      ...prev,
      [id]: isOpen,
    }));
  };

  const stageOptions = useMemo(() => {
    return sortStatuses(dealStageOptions);
  }, []);

  return (
    <DropdownMenu
      open={openStates[deal.id] || false}
      onOpenChange={(isOpen) => toggleDropdown(deal.id, isOpen)}
    >
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          style={{
            backgroundColor: getStatusStyles(deal?.stage ?? "").backgroundColor,
            color: getStatusStyles(deal?.stage ?? "").textColor, // Set dynamic text color
          }}
          className="cursor-pointer p-1 w-fit h-fit text-xs border-gray-300"
        >
          <p>{deal.stage}</p>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56 h-56 overflow-scroll">
        {stageOptions.map((stage: string) => (
          <DropdownMenuItem
            key={stage}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              if (handleStageChange) {
                handleStageChange(deal.id, stage); // Update stage
              } else {
                updateStatus(stage);
              }
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
