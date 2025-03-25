"use client";
import { TeamDashboardViewHeader } from "@/components/base/header";
import { Loader } from "@/components/base/loader";
import { TailwindPlusTable } from "@/components/tailwind-plus/table";
import { TeamDashboardViewSelector } from "@/components/Team/dashboard/team-dashboard-view-selector";
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
import { fetchAllPaidHoldingNegotiations, getStatusStyles } from "@/lib/utils";
import { DealNegotiator, NegotiationData } from "@/types";
import {
  Car,
  ChevronDown,
  Expand,
  MapPin,
  StickyNote,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const fields = [
  {
    label: "First Name",
    field: "negotiations_First_Name",
    icon: <User size={14} />,
  },
  {
    label: "Last Name",
    field: "negotiations_Last_Name",
    icon: <User size={14} />,
  },
  {
    label: "Zip Code",
    field: "negotiations_Zip_Code",
    icon: <MapPin size={14} />,
  },
  { label: "Status", field: "negotiations_Status" },
  { label: "Deal Coordinator", field: "negotiations_deal_coordinator" },
  { label: "Brand", field: "negotiations_Brand" },
  {
    label: "Client Consult Notes",
    field: "consultNotes",
    icon: <StickyNote size={14} />,
    type: "textarea",
  },
  {
    label: "Vehicle of Interest",
    field: "vehicle_of_interest",
    icon: <Car size={14} />,
  },
  { label: "Model", field: "model_of_interest", icon: <Car size={14} /> },
];
const PaidHolding = () => {
  const {
    negotiatorData,
    allDealNegotiator,
    negotiations: negotiationsFromTeamDashboard,
  } = useTeamDashboard({
    all: true,
    filter: {
      stage: "Paid Holding",
    },
  });
  const [loading, setLoading] = useState<boolean>(true);
  // const [isOpen, setIsOpen] = useState<boolean>(false);
  const [negotiations, setNegotiations] = useState<NegotiationDataType[]>([]);
  // const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  // const [expandedNote, setExpandedNote] = useState<{
  //   id: string;
  //   note: string;
  // } | null>(null);
  // const [selectedDeal, setSelectedDeal] = useState<NegotiationDataType | null>(
  //   null
  // );
  const [sortConfig, setSortConfig] = useState({
    key: "submittedDate", // default sorting by Submitted Date
    direction: "ascending", // default direction
  });

  useEffect(() => {
    setNegotiations(negotiationsFromTeamDashboard);
    setLoading(false);
  }, [negotiationsFromTeamDashboard]);

  // useEffect(() => {
  //   if (!isOpen) {
  //     setSelectedDeal(null);
  //   }
  // }, [isOpen]);

  const sortData = sortDataHelper(negotiations, setNegotiations);

  return (
    <div className="container mx-auto p-4 space-y-6 min-h-screen">
      <TeamDashboardViewHeader
        negotiatorData={negotiatorData as unknown as DealNegotiatorType}
      />
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
                header: "Zip Code",
                config: {
                  sortable: true,
                  key: "zip",
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
                header: "Consult Notes",
                config: {
                  sortable: true,
                  key: "consultNotes",
                },
              },
              {
                header: "Vehicle of Interest",
                config: {
                  sortable: true,
                  key: "vehicleOfInterest",
                },
              },
              {
                header: "New or Used",
                config: {
                  sortable: true,
                  key: "condition",
                },
              },
            ]}
            rows={negotiations.map((deal, idx) => [
              {
                text: idx + 1,
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
                      fields={fields as any}
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
                      color: getStatusStyles(deal?.stage ?? "").textColor, // Set dynamic text color
                    }}
                    className="cursor-pointer p-1 w-fit h-fit text-xs rounded-full"
                  >
                    <p>{deal.stage}</p>
                  </Button>
                ),
              },
              deal.zip,
              allDealNegotiator.find(
                (negotiator) => negotiator.id === deal.dealCoordinatorId
              )?.name || "Not Assigned",
              {
                text: deal?.consultNotes?.substring(0, 50) || "",
                config: {
                  expandable:
                    typeof deal?.consultNotes?.length === "number" &&
                    deal?.consultNotes?.length > 50,
                  expandedComponent: () => (
                    <>
                      <h2 className="text-lg font-semibold mb-2">
                        Consult Note
                      </h2>
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {deal.consultNotes}
                      </p>
                    </>
                  ),
                },
              },
              deal.vehicleOfinterest,
              {
                Component: () =>
                  deal?.condition && (
                    <Button
                      variant="outline"
                      className={`cursor-pointer p-1 w-fit h-fit text-xs rounded-full ${
                        deal?.condition === "New"
                          ? "bg-[#d1e2ff]"
                          : "bg-[#c4ecff]"
                      }`}
                    >
                      <p> {deal?.condition ?? ""}</p>
                    </Button>
                  ),
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

export default PaidHolding;
