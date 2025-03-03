import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";

import "react-datepicker/dist/react-datepicker.css";
import { Check, MoreHorizontal, StickyNoteIcon, X } from "lucide-react";
import { Button } from "../ui/button";
import {
  dateFormat,
  dealStageOptions,
  getElapsedTime,
  getStatusStyles,
} from "@/lib/utils";
import DealNegotiatorDialog from "./deal-negotiator-dialog";
import { DealNegotiator, InternalNotes, NegotiationData } from "@/types";
import { useRouter } from "next/navigation";
import { Loader } from "../base/loader";
import { toast } from "@/hooks/use-toast";
import DatePickerCell from "./datepicker-cell";
import ShippingInfoDialog from "./shipping-info-dialog";
import ManualBidUpload from "./Manual-bid-upload-modal";

const NOW = new Date(new Date().toISOString().split("T")[0]);

type TeamDashboardTableProps = {
  setStopPropagation: (item: boolean) => void;
  stopPropagation: boolean;
  currentDeals: NegotiationData[];
  setCurrentDeals: (item: NegotiationData[]) => void;
  handleStageChange: (id: string, newStage: string) => void;
  allInternalNotes: Record<string, InternalNotes[]>;
  allDealNegotiator: DealNegotiator[];
  updateDealNegotiator: (id: string, newNegotiatorId: string) => void;
  negotiatorData?: DealNegotiator;
  loading: boolean;
};

const TeamDashboardTable = ({
  setStopPropagation,
  stopPropagation,
  currentDeals,
  allInternalNotes,
  handleStageChange,
  allDealNegotiator,
  updateDealNegotiator,
  negotiatorData,
  loading,
  setCurrentDeals,
}: TeamDashboardTableProps) => {
  const router = useRouter();

  async function handleAskForReview(id: string) {
    console.log(`🔹 Triggering review request for deal ID: ${id}`);

    if (!id) {
      console.error("❌ Error: No ID provided for review request.");
      return;
    }

    const dealData = currentDeals.find((item) => item.id === id);
    if (!dealData) {
      console.error("❌ Error: No matching deal found.");
      return;
    }

    const updatedDeal = { id, review: "Review Request Sent" };
    console.log("📤 Sending request to:", process.env.NEXT_PUBLIC_REVIEW_FUNC_URL, updatedDeal);

    try {
      const response = await fetch(process.env.NEXT_PUBLIC_REVIEW_FUNC_URL ?? "", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedDeal),
      });

      const result = await response.json();
      console.log("📩 Server response:", result);

      if (result.success) {
        toast({ title: "Review Request Sent" });
      } else {
        console.error("❌ Failed to send review request:", result.error);
        toast({ title: "Failed to send review request", variant: "destructive" });
      }
    } catch (error) {
      console.error("❌ Error requesting review:", error);
      toast({ title: "Failed to send review request", variant: "destructive" });
    }
  }

  return (
    <Table>
      <TableHeader className="max-w-[1000px] overflow-scroll">
        <TableRow>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      {loading ? (
        <TableBody>
          <TableRow>
            <TableCell colSpan={14} className="text-center py-4">
              <Loader />
            </TableCell>
          </TableRow>
        </TableBody>
      ) : currentDeals?.length ? (
        <TableBody>
          {currentDeals?.map((deal, index) => (
            <TableRow key={deal.id}>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <div className="flex flex-col items-start">
                      <p
                        onClick={(e) => {
                          e.stopPropagation();
                          handleAskForReview(deal.id);
                        }}
                        className="text-sm pl-4 pr-1 py-1 cursor-pointer"
                      >
                        Ask For Review
                      </p>
                    </div>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      ) : (
        <TableBody>
          <TableRow>
            <TableCell colSpan={13} className="text-center py-4">
              <p>No Data Found</p>
            </TableCell>
          </TableRow>
        </TableBody>
      )}
    </Table>
  );
};

export default TeamDashboardTable;
