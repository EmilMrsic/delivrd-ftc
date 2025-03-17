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
  DropDownMenu,
  DropdownMenuCheckboxItem,
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
import {
  dateFormat,
  fetchAllActiveNegotiations,
  fetchAllPaidHoldingNegotiations,
  getStatusStyles,
  vehicleOfInterest,
} from "@/lib/utils";
import { DealNegotiator, NegotiationData } from "@/types";
import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
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
import React, { useEffect, useRef, useState } from "react";

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
    label: "Phone Number",
    field: "negotiations_Phone",
  },
  {
    label: "Email",
    field: "negotiations_Email",
  },
  {
    label: "Zip Code",
    field: "negotiations_Zip_Code",
    icon: <MapPin size={14} />,
  },
  { label: "Status", field: "negotiations_Status" },
  { label: "Brand", field: "negotiations_Brand" },
  {
    label: "Client Consult Notes",
    field: "consult_notes",
    icon: <StickyNote size={14} />,
    type: "textarea",
  },

  { label: "Model", field: "model_of_interest", icon: <Car size={14} /> },
];
const ViewByBrand = () => {
  const { negotiatorData, negotiations: negotiationsFromTeamDashboard } =
    useTeamDashboard({
      filter: {
        //status: ["Actively Negotiating", "Deal Started", "Paid"],
      },
    });
  const [loading, setLoading] = useState<boolean>(true);
  const [negotiations, setNegotiations] = useState<NegotiationDataType[]>([]);
  const [filteredNegotiations, setFilteredNegotiations] = useState<
    NegotiationDataType[]
  >([]);
  const [searchMakes, setSearchMakes] = useState("");
  const searchMakeInputRef = useRef<HTMLInputElement>(null);
  const [filters, setFilters] = useState({
    makes: "", // Stores selected car makes
    condition: "", // 'New' or 'Used'
  });

  const [sortConfig, setSortConfig] = useState({
    key: "submittedDate",
    direction: "ascending",
  });

  useEffect(() => {
    console.log("negotiationsFromTeamDashboard", negotiationsFromTeamDashboard);
    setNegotiations(negotiationsFromTeamDashboard);
    setLoading(false);
  }, [negotiationsFromTeamDashboard]);

  useEffect(() => {
    if (negotiations) {
      let filtered = [...negotiations];

      if (filters.makes) {
        filtered = filtered.filter((deal) => deal.brand === filters.makes);
      }

      if (filters.condition && filters.condition !== "All") {
        filtered = filtered.filter(
          (deal) => deal.new_or_used === filters.condition
        );
      }

      console.log("setting filtered");

      setFilteredNegotiations(filtered);
    }
  }, [filters, negotiations]);

  const sortData = sortDataHelper(setNegotiations, negotiations);
  console.log(negotiations);

  return (
    <div className="container mx-auto p-4 space-y-6 min-h-screen">
      <TeamDashboardViewHeader
        negotiatorData={negotiatorData as unknown as DealNegotiatorType}
      />
      <div className="flex ml-10 gap-4 items-start">
        <div className="space-y-2">
          <DropDownMenu
            label="Select Makes"
            options={vehicleOfInterest.filter((make) =>
              make.toLowerCase().includes(searchMakes.toLowerCase())
            )}
            checkedItem={filters.makes}
            onFocus={() => searchMakeInputRef.current?.focus()}
            onCheckedChange={(checked, item) => {
              setFilters((prev) => ({
                ...prev,
                makes: checked ? item : "", // Set or clear make
              }));
            }}
          />
        </div>
        <div className="space-y-2">
          <DropDownMenu
            label="Select Condition"
            options={["All", "New", "Used"]}
            checkedItem={filters.condition}
            onFocus={() => searchMakeInputRef.current?.focus()}
            onCheckedChange={(checked, item) => {
              setFilters((prev) => ({
                ...prev,
                condition: checked ? item : "", // Set or clear make
              }));
            }}
          />
        </div>
        <TeamDashboardViewSelector />
      </div>
      <Card className="bg-white shadow-lg">
        {!filteredNegotiations?.length || loading ? (
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
                header: "Phone Number",
                config: {
                  sortable: true,
                  key: "clientPhone",
                },
              },
              {
                header: "Email",
                config: {
                  sortable: true,
                  key: "clientEmail",
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
                header: "New or Used",
                config: {
                  sortable: true,
                  key: "condition",
                },
              },
              {
                header: "Trim Package",
                config: {
                  sortable: true,
                  key: "trim",
                },
              },
              {
                header: "Consult Notes",
                config: {
                  sortable: true,
                  key: "consult_notes",
                },
              },
              {
                header: "Drivetrain",
                config: {
                  sortable: true,
                  key: "drivetrain",
                },
              },
              {
                header: "Exterior Deal Breaker",
                config: {
                  sortable: true,
                  key: "excludedExterior",
                },
              },
              {
                header: "Exterior Preffered",
                config: {
                  sortable: true,
                  key: "desiredExterior",
                },
              },
              {
                header: "Interior Deal Breaker",
                config: {
                  sortable: true,
                  key: "desiredInterior",
                },
              },
              {
                header: "Interior Preffered",
                config: {
                  sortable: true,
                  key: "desiredInterior",
                },
              },
              {
                header: "Date Paid",
                config: {
                  sortable: true,
                  key: "datePaid",
                },
              },
            ]}
            rows={filteredNegotiations.map((deal, idx) => [
              {
                text: `${idx + 1}`,
                link: `/team-profile?id=${deal.id}`,
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
              deal.clientPhone,
              deal.clientEmail,
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
              deal.condition,
              deal.trim,
              {
                text: deal?.consult_notes?.substring(0, 50),
                config: {
                  expandable:
                    typeof deal?.consult_notes?.length === "number" &&
                    deal?.consult_notes?.length > 50,
                  expandedComponent: ({ expanded, setExpanded }: any) => (
                    <div>{deal.consult_notes}</div>
                  ),
                },
              },
              deal.drivetrain,
              deal.excludedExterior,
              deal.desiredExterior,
              deal.excludedInterior,
              deal.desiredInterior,
              deal.datePaid,
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

export default ViewByBrand;
