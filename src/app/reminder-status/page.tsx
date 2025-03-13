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
  const router = useRouter();
  const { negotiatorData, allDealNegotiator } = useTeamDashboard();
  const [loading, setLoading] = useState<boolean>(false);
  const [negotiations, setNegotiations] = useState<NegotiationDataType[]>([]);

  const [selectedDeal, setSelectedDeal] = useState<NegotiationDataType | null>(
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
    fetchAllProposalSendNegotiations()
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
              link: `/team-profile?id=${deal.id}`,
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
            {
              text: deal.negotiations_Status,
            },
            {
              text: deal.negotiations_Invoice_Status,
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

export default ReminderStatus;
