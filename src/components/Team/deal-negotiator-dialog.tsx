import React, { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "../ui/dialog";
import ProjectProfile from "../base/project-profile";
import { DealNegotiator, NegotiationData } from "@/types";
import { Button } from "../ui/button";
import { dateFormat } from "@/lib/helpers/dates";
type DealNegotiatorDialogProps = {
  dealNegotiator?: DealNegotiator;
  deal: NegotiationData;
  setStopPropogation: (item: boolean) => void;
};

const DealNegotiatorDialog = ({
  dealNegotiator,
  deal,
  setStopPropogation,
}: DealNegotiatorDialogProps) => {
  const [open, setOpen] = useState(false);
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
        className="max-w-7xl"
      >
        <ProjectProfile
          name={deal.negotiations_Client ?? ""}
          description={deal.negotiations_Travel_Limit ?? ""}
          status={deal.negotiations_Invoice_Status ?? ""}
          manager={{
            name: dealNegotiator?.name ?? "",
            avatar: dealNegotiator?.profile_pic ?? "",
          }}
          team={[{ name: "Test", avatar: "Test Avatar" }]}
          startDate={dateFormat(deal.negotiations_Created ?? "")}
          endDate={dateFormat(deal.negotiations_Status_Updated ?? "")}
        />
      </DialogContent>
    </Dialog>
  );
};

export default DealNegotiatorDialog;
