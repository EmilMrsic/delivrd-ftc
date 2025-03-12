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
import { DealNegotiatorType } from "@/lib/models/team";
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
  const [negotiations, setNegotiations] = useState<NegotiationData[]>([]);

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
        negotiatorData={negotiatorData as DealNegotiatorType}
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

  return (
    <>
      <div className="m-5">
        <Table className="min-w-full border-collapse">
          <TableHeader className="sticky top-0 bg-gray-100 z-10 border-b border-gray-300">
            <TableRow>
              <TableHead className="text-left px-4 py-2 border-r">#</TableHead>
              <TableHead
                onClick={() =>
                  sortWithoutCoordinatorData("negotiations_Client")
                }
                className="text-left px-4 py-2 border-r"
              >
                Client
              </TableHead>

              <TableHead className="text-left px-4 py-2 border-r">
                Stage
              </TableHead>
              <TableHead
                onClick={() =>
                  sortWithoutCoordinatorData("negotiations_Invoice_Status")
                }
                className="text-left px-4 py-2 border-r"
              >
                Invoice Status
              </TableHead>
            </TableRow>
          </TableHeader>

          {loading ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  <Loader />
                </TableCell>
              </TableRow>
            </TableBody>
          ) : negotiations?.length ? (
            <TableBody>
              {negotiations.map((deal, index) => (
                <TableRow key={deal.id} className="hover:bg-gray-50 transition">
                  <TableCell className="px-4 py-2 border-r">
                    <Link href={`/team-profile?id=${deal.id}`}>
                      {index + 1}
                    </Link>
                  </TableCell>

                  <TableCell className="px-4 py-2 relative border-r">
                    {deal.negotiations_Client}
                    <Expand
                      size={16}
                      className="text-gray-500 absolute top-[5px] right-[10px] hover:text-gray-700 cursor-pointer"
                      onClick={() => {
                        setSelectedDeal(deal);
                        setIsOpen(true);
                      }}
                    />
                  </TableCell>

                  <TableCell className="px-4 py-2 border-r">
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
                  </TableCell>
                  <TableCell className="px-4 py-2 border-r">
                    <Button
                      variant="outline"
                      className="cursor-pointer p-1 w-fit h-fit text-xs rounded-full"
                    >
                      <p>{deal.negotiations_Invoice_Status}</p>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          ) : (
            <TableBody>
              <TableRow>
                <TableCell colSpan={9} className="text-center py-4">
                  No Data Found
                </TableCell>
              </TableRow>
            </TableBody>
          )}
        </Table>

        {selectedDeal && (
          <ClientDetailsPopup
            setNegotiations={setNegotiations}
            open={isOpen}
            onClose={() => setIsOpen(false)}
            deal={selectedDeal}
            fields={trimPackageFields as any}
          />
        )}
      </div>
    </>
  );
};

export default ReminderStatus;
