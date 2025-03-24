import { MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import DealNegotiatorDialog from "./deal-negotiator-dialog";
import ManualBidUpload from "./Manual-bid-upload-modal";
import ShippingInfoDialog from "./shipping-info-dialog";
import { Button } from "../ui/button";

export const DashboardTableActions = ({
  setStopPropagation,
  deal,
  negotiatorData,
  dateFormat,
  setCurrentDeals,
  currentDeals,
  handleAskForReview,
}: any) => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Open menu</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      {/* align="end" */}
      <DropdownMenuContent>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <div className="flex flex-col items-start">
          <DealNegotiatorDialog
            setStopPropogation={setStopPropagation}
            deal={deal}
            dealNegotiator={negotiatorData}
            formatDate={dateFormat}
          />
          <ShippingInfoDialog
            setCurrentDeals={setCurrentDeals}
            currentDeals={currentDeals}
            deal={deal}
            setStopPropogation={setStopPropagation}
          />
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
          />
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
