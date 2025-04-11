"use client";
import { TeamHeader } from "@/components/base/header";
import { Loader } from "@/components/base/loader";
import { TailwindPlusTable } from "@/components/tailwind-plus/table";
import { TeamDashboardViewSelector } from "@/components/Team/dashboard/team-dashboard-view-selector";
import { statuses } from "@/components/Team/filter-popup";
import ClientDetailsPopup from "@/components/Team/team-detail-popup";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useTeamDashboard from "@/hooks/useTeamDashboard";
import { DEFAULT_SORTED_COLUMN } from "@/lib/constants/negotiations";
import { sortDataHelper } from "@/lib/helpers/negotiation";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";
import { fetchAllProposalSendNegotiations, getStatusStyles } from "@/lib/utils";
import { NegotiationData } from "@/types";
import { Calendar, ChevronDown, Expand, StickyNote, User } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const trimPackageFields = [
  { label: "Client", field: "negotiations_Client", icon: <User size={14} /> },
  { label: "Make", field: "negotiations_Brand" },
  { label: "Model", field: "model_of_interest" },
  { label: "Stage", field: "negotiations_Status" },
  { label: "Payment Date", field: "date_paid", icon: <Calendar size={14} /> },
  {
    label: "Start Date",
    field: "negotiations_Deal_Start_Date",
    icon: <Calendar size={14} />,
  },
];

const ReminderStatus = () => {
  const {
    negotiatorData,
    allDealNegotiator,
    negotiations: negotiationsFromTeamDashboard,
  } = useTeamDashboard({
    all: true,
    filter: {
      stage: "Proposal Sent",
    },
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [negotiations, setNegotiations] = useState<NegotiationDataType[]>([]);

  const [sortConfig, setSortConfig] = useState({
    key: DEFAULT_SORTED_COLUMN,
    direction: "ascending",
  });

  const sortData = sortDataHelper(negotiations, setNegotiations);

  useEffect(() => {
    setNegotiations(negotiationsFromTeamDashboard);
    setLoading(false);
  }, [negotiationsFromTeamDashboard]);

  return (
    <div className="container mx-auto p-4 space-y-6 min-h-screen">
      <TeamHeader />
      <TeamDashboardViewSelector />
      <Card className="bg-white shadow-lg">
        {!negotiations && !loading ? (
          <div className="flex justify-center items-center h-full">
            <Loader />
          </div>
        ) : (
          <TailwindPlusTable
            headers={[
              { header: "#", config: { size: 50 } },
              {
                header: "Client",
                config: { sortable: true, key: "negotiations_Client" },
              },
              {
                header: "Stage",
                config: { sortable: true, key: "negotiations_Status" },
              },
              {
                header: "Invoice Status",
                config: { sortable: true, key: "negotiations_Invoice_Status" },
              },
            ]}
            rows={negotiations.map((deal, idx) => [
              {
                text: `${idx + 1}`,
                config: {
                  link: `/team-profile?id=${deal.id}`,
                },
              },
              {
                text: deal.clientNamefull,
                config: {
                  expandable: true,
                  expandedComponent: ({ expanded, setExpanded }: any) => (
                    <ClientDetailsPopup
                      setNegotiations={setNegotiations}
                      open={expanded}
                      onClose={() => setExpanded(false)}
                      deal={deal}
                      fields={trimPackageFields as any}
                    />
                  ),
                },
              },
              {
                text: deal.stage,
              },
              {
                text: deal.invoiceStatus,
              },
            ])}
            sortConfig={sortConfig}
            setSortConfig={setSortConfig}
            sortData={sortData}
          />
        )}
      </Card>
    </div>
  );
};

export default ReminderStatus;
