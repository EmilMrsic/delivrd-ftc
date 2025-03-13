"use client";
import { TeamDashboardViewHeader } from "@/components/base/header";
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
  const router = useRouter();
  const { negotiatorData, allDealNegotiator } = useTeamDashboard();
  const [loading, setLoading] = useState<boolean>(false);
  const [negotiations, setNegotiations] = useState<NegotiationDataType[]>([]);
  const [trimDetails, setTrimDetails] = useState<{
    id: string;
    trim: string;
  } | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<NegotiationData | null>(
    null
  );
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const [sortConfig, setSortConfig] = useState({
    key: "submittedDate",
    direction: "ascending",
  });

  // const sortWithoutCoordinatorData = (key: string) => {
  //   setSortConfig((prevConfig) => {
  //     const newDirection =
  //       prevConfig.key === key && prevConfig.direction === "ascending"
  //         ? "descending"
  //         : "ascending";

  //     const sortedNegotiations = [...negotiations].sort((a: any, b: any) => {
  //       let aValue = a[key];
  //       let bValue = b[key];

  //       if (typeof aValue === "string") aValue = aValue.toLowerCase();
  //       if (typeof bValue === "string") bValue = bValue.toLowerCase();

  //       if (aValue == null) return newDirection === "ascending" ? 1 : -1;
  //       if (bValue == null) return newDirection === "ascending" ? -1 : 1;

  //       if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
  //         return newDirection === "ascending"
  //           ? Number(aValue) - Number(bValue)
  //           : Number(bValue) - Number(aValue);
  //       }

  //       if (aValue < bValue) return newDirection === "ascending" ? -1 : 1;
  //       if (aValue > bValue) return newDirection === "ascending" ? 1 : -1;
  //       return 0;
  //     });

  //     setNegotiations(sortedNegotiations);

  //     return { key, direction: newDirection };
  //   });
  // };

  const sortData = sortDataHelper(setNegotiations, negotiations);

  useEffect(() => {
    setLoading(true);
    fetchAllOldNegotiations()
      .then((res) => {
        setNegotiations(res);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  return (
    <div className="container mx-auto p-4 space-y-6 min-h-screen">
      <TeamDashboardViewHeader
        negotiatorData={negotiatorData as unknown as DealNegotiatorType}
      />
      <TeamDashboardViewSelector />
      <Card className="bg-white shadow-lg">
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
                key: "negotiations_Client",
              },
            },
            {
              header: "Make",
              config: {
                sortable: true,
                key: "negotiations_Brand",
              },
            },
            {
              header: "Model",
              config: {
                sortable: true,
                key: "model_of_interest",
              },
            },
            {
              header: "Stage",
              config: {
                sortable: true,
                key: "negotiations_Status",
              },
            },
            {
              header: "Payment Date",
              config: {
                sortable: true,
                key: "date_paid",
              },
            },
            {
              header: "Start Date",
              config: {
                sortable: true,
                key: "negotiations_Deal_Start_Date",
              },
            },
            {
              header: "Deal Negotiator",
              config: {
                sortable: true,
                key: "negotiations_deal_coordinator",
              },
            },
            {
              header: "Trim Package",
              config: {
                sortable: true,
                key: "negotiations_Trim_Package_Options",
              },
            },
          ]}
          rows={negotiations
            .filter((deal) => {
              if (!deal.date_paid) return false;
              const today = new Date();
              const paidDate = new Date(deal.date_paid);
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
                text: deal.negotiations_Client,
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
              deal.negotiations_Brand,
              deal.model_of_interest,
              {
                Component: () => (
                  <Button
                    variant="outline"
                    style={{
                      backgroundColor: getStatusStyles(
                        deal?.negotiations_Status ?? ""
                      ).backgroundColor,
                      color: getStatusStyles(deal?.negotiations_Status ?? "")
                        .textColor,
                    }}
                    className="cursor-pointer p-1 w-fit h-fit text-xs rounded-full"
                  >
                    <p>{deal.negotiations_Status}</p>
                  </Button>
                ),
              },
              deal.date_paid,
              deal.negotiations_Deal_Start_Date,
              allDealNegotiator.find(
                (negotiator) =>
                  negotiator.id === deal.negotiations_deal_coordinator
              )?.name || "Not Assigned",
              {
                text:
                  deal.negotiations_Trim_Package_Options?.substring(0, 50) ||
                  "",
                config: {
                  expandable: true,
                  expandedComponent: () => (
                    <div>{deal.negotiations_Trim_Package_Options}</div>
                  ),
                },
              },
            ])}
          sortConfig={sortConfig}
          setSortConfig={setSortConfig}
          sortData={sortData}
        />
      </Card>
    </div>
  );
};

export default OldDeals;
