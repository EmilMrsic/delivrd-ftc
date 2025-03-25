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
import { dateFormat } from "@/lib/helpers/dates";
import { sortDataHelper } from "@/lib/helpers/negotiation";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";
import { fetchAllOldNegotiations, getStatusStyles } from "@/lib/utils";
import { DealNegotiator, NegotiationData } from "@/types";
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
  { label: "Deal Negotiator", field: "negotiations_deal_coordinator" },
  {
    label: "Trim Package",
    field: "negotiations_Trim_Package_Options",
    type: "textarea",
    icon: <StickyNote size={14} />,
  },
];

const OldDeals = () => {
  const {
    negotiatorData,
    allDealNegotiator,
    negotiations: negotiationsFromTeamDashboard,
  } = useTeamDashboard({
    all: true,
    // filter: {
    //   status: ["Actively Negotiating", "Deal Started", "Paid"],
    // },
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [negotiations, setNegotiations] = useState<NegotiationDataType[]>([]);

  const [sortConfig, setSortConfig] = useState({
    key: "submittedDate",
    direction: "ascending",
  });

  const sortData = sortDataHelper(negotiations, setNegotiations);

  useEffect(() => {
    setNegotiations(negotiationsFromTeamDashboard);
    setLoading(false);
  }, [negotiationsFromTeamDashboard]);

  console.log(negotiations);

  return (
    <div className="container mx-auto p-4 space-y-6 min-h-screen">
      <TeamHeader />
      <TeamDashboardViewSelector />
      <Card className="bg-white shadow-lg">
        {!negotiations || loading ? (
          <Loader />
        ) : (
          <TailwindPlusTable
            headers={[
              {
                header: "#",
                config: {
                  size: 50,
                },
              },
              {
                header: "Client",
                config: {
                  sortable: true,
                  key: "clientNamefull",
                },
              },
              {
                header: "Make",
                config: {
                  sortable: true,
                  key: "brand",
                },
              },
              {
                header: "Model",
                config: {
                  sortable: true,
                  key: "model",
                },
              },
              {
                header: "Stage",
                config: {
                  sortable: true,
                  key: "stage",
                },
              },
              {
                header: "Payment Date",
                config: {
                  sortable: true,
                  key: "datePaid",
                },
              },
              {
                header: "Start Date",
                config: {
                  sortable: true,
                  key: "dealStartDate",
                },
              },
              {
                header: "Deal Negotiator",
                config: {
                  sortable: true,
                  key: "dealCoordinatorId",
                },
              },
              {
                header: "Trim Package",
                config: {
                  sortable: true,
                  key: "trim",
                },
              },
            ]}
            rows={negotiations
              .filter((deal) => {
                if (!deal.datePaid) return false;
                const today = new Date();
                const paidDate = new Date(deal.datePaid);
                const diffTime = today.getTime() - paidDate.getTime();
                const diffDays = diffTime / (1000 * 3600 * 24); // Convert ms to days

                return diffDays >= 14; // ✅ 14 days or more
              })
              .map((deal, index) => [
                {
                  text: index + 1,
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
                deal.brand,
                deal.model,
                {
                  Component: () => (
                    <Button
                      variant="outline"
                      style={{
                        backgroundColor: getStatusStyles(deal?.stage ?? "")
                          .backgroundColor,
                        color: getStatusStyles(deal?.stage ?? "").textColor,
                      }}
                      className="cursor-pointer p-1 w-fit h-fit text-xs rounded-full"
                    >
                      <p>{deal.stage}</p>
                    </Button>
                  ),
                },
                dateFormat(deal.datePaid),
                dateFormat(deal.dealStartDate),
                allDealNegotiator.find(
                  (negotiator) => negotiator.id === deal.dealCoordinatorId
                )?.name || "Not Assigned",
                {
                  text: deal.trim?.substring(0, 50) || "",
                  config: {
                    expandable: true,
                    expandedComponent: () => <div>{deal.trim}</div>,
                  },
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

export default OldDeals;
