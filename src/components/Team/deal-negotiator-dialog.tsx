import React, { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import ProjectProfile from "../base/project-profile";
import { DealNegotiator, NegotiationData } from "@/types";
import { Button } from "../ui/button";
import { dateFormat } from "@/lib/helpers/dates";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";
type DealNegotiatorDialogProps = {
  dealNegotiator?: DealNegotiatorType;
  deal: NegotiationDataType;
  setStopPropogation: (item: boolean) => void;
};

const DealNegotiatorDialog = ({
  dealNegotiator,
  deal,
  setStopPropogation,
}: DealNegotiatorDialogProps) => {
  const [open, setOpen] = useState(false);
  console.log(deal.dealStartDate);
  return (
    <Dialog open={open} onOpenChange={() => setOpen(false)}>
      <DialogTrigger
        onClick={(e) => {
          e.stopPropagation();
          e.stopPropagation();
        }}
      >
        <Button
          variant="outline"
          className="bg-white text-black border-none hover:bg-transparent shadow-none"
          onClick={(e) => {
            e.stopPropagation();
            e.stopPropagation();
            setStopPropogation(true);
            setOpen(true);
          }}
        >
          View Details
        </Button>
      </DialogTrigger>
      <DialogContent
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        // className="max-w-7xl"
      >
        <ProjectProfile
          name={deal.clientNamefull ?? ""}
          description={deal.travelLimit ?? ""}
          status={deal.invoiceStatus ?? ""}
          manager={{
            name: dealNegotiator?.name ?? "",
            avatar: dealNegotiator?.profile_pic ?? "",
          }}
          team={[{ name: "Test", avatar: "Test Avatar" }]}
          startDate={dateFormat(deal.dealStartDate ?? "")}
          endDate={dateFormat(deal.closeDate ?? "")}
        />
      </DialogContent>
    </Dialog>
  );
};

export default DealNegotiatorDialog;
