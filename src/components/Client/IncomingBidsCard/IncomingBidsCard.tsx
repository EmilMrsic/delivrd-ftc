import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { DealerData, IncomingBid } from "@/types";
import { Dialog, DialogContent, DialogTrigger } from "@radix-ui/react-dialog";
import { FileText } from "lucide-react";
import React from "react";

const IncomingBidsCard = ({
  incomingBids,
  dealerData,
  children,
}: {
  incomingBids: IncomingBid[];
  dealerData: DealerData[];
  children: React.ReactNode;
}) => {
  return (
    <Card className="bg-white shadow-lg">
      <CardHeader className="bg-gradient-to-r from-[#0989E5] to-[#202125] text-white">
        <CardTitle className="flex items-center">
          <FileText className="mr-2" /> Incoming Bids
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">{children}</CardContent>
    </Card>
  );
};

export default IncomingBidsCard;
