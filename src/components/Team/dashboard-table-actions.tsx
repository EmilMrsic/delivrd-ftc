import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import ManualBidUpload from "./Manual-bid-upload-modal";
import { Button } from "../ui/button";
import { useSearchParams } from "next/navigation";
import useTeamProfile from "@/hooks/useTeamProfile";
import { useState } from "react";

export const DashboardTableActions = ({
  setStopPropagation,
  deal,
  negotiatorData,
  // setCurrentDeals,
  // currentDeals,
  handleAskForReview,
  setShowModal,
  incomingBids,
  setIncomingBids,
  dealers,
}: any) => {
  // const [isDialogOpen, setIsDialogOpen] = useState(false);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="h-4 w-4 p-0"
          // onClick={() => {
          //   setIsDialogOpen(true);
          // }}
        >
          {/* <span className="sr-only">Open menu</span> */}
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <div className="flex flex-col items-start">
          <Button
            variant="outline"
            className="bg-white text-black border-none hover:bg-transparent shadow-none"
            onClick={(e) => {
              setShowModal("shipping");
            }}
          >
            Shipping Info
          </Button>
          <p
            onClick={(e) => {
              e.stopPropagation();
              handleAskForReview(deal.id);
            }}
            className="text-sm pl-4 pr-1 py-1 cursor-pointer"
          >
            Ask For Review
          </p>
          <ManualBidUpload
            setStopPropagation={setStopPropagation}
            id={deal?.id}
            incomingBids={incomingBids}
            setIncomingBids={setIncomingBids}
            dealers={dealers}
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
