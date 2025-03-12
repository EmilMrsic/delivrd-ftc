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
  const [negotiations, setNegotiations] = useState<NegotiationData[]>([]);
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
        negotiatorData={negotiatorData as DealNegotiatorType}
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

  return (
    <>
      <div className="flex justify-between items-center bg-[#202125] p-6 mb-5 shadow-lg">
        <div
          onClick={() => router.push("/team-dashboard")}
          className="flex flex-col items-start cursor-pointer"
        >
          <img
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/image-JoIhMlHLZk8imAGedndft4tH9e057R.png"
            alt="DELIVRD Logo"
            className="h-8 mb-2"
          />
          <p className="text-white text-sm">Putting Dreams In Driveways</p>
        </div>
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#0989E5] to-[#E4E5E9] text-transparent bg-clip-text">
              Client Deals Dashboard
            </h1>
            <h1 className="text-base font-semibold text-white text-transparent bg-clip-text">
              {negotiatorData?.name}
            </h1>
          </div>
        </div>
      </div>
      <div className="space-y-2 ml-10 w-[150px]">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              Select View
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-auto">
            <div className="flex flex-col w-fit">
              {statuses.map((status, index) => (
                <Link
                  key={index}
                  className="p-2 text-sm hover:underline cursor-pointer"
                  href={`/${status.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  {status}
                </Link>
              ))}
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
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
              <TableHead
                onClick={() => sortWithoutCoordinatorData("negotiations_Brand")}
                className="text-left px-4 py-2 border-r"
              >
                Make
              </TableHead>
              <TableHead
                onClick={() => sortWithoutCoordinatorData("negotiations_Model")}
                className="text-left px-4 py-2 border-r"
              >
                Model
              </TableHead>
              <TableHead className="text-left px-4 py-2 border-r">
                Stage
              </TableHead>
              <TableHead
                onClick={() => sortWithoutCoordinatorData("date_paid")}
                className="text-left px-4 py-2 border-r"
              >
                Payment Date
              </TableHead>
              <TableHead
                onClick={() =>
                  sortWithoutCoordinatorData("negotiations_Deal_Start_Date")
                }
                className="text-left px-4 py-2 border-r"
              >
                Start Date
              </TableHead>
              <TableHead className="text-left px-4 py-2 border-r">
                Deal Negotiator
              </TableHead>
              <TableHead className="text-left px-4 py-2">
                Trim Package
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
              {negotiations
                ?.filter((deal) => {
                  const today = new Date();
                  const paidDate = new Date(deal.date_paid);
                  const diffTime = today.getTime() - paidDate.getTime();
                  const diffDays = diffTime / (1000 * 3600 * 24); // Convert ms to days

                  return diffDays >= 14; // ✅ 14 days or more
                })
                .map((deal, index) => (
                  <TableRow
                    key={deal.id}
                    className="hover:bg-gray-50 transition"
                  >
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
                      {deal.negotiations_Brand}
                    </TableCell>

                    <TableCell className="px-4 py-2 border-r">
                      {deal.model_of_interest}
                    </TableCell>

                    <TableCell className="px-4 py-2 border-r">
                      <Button
                        variant="outline"
                        style={{
                          backgroundColor: getStatusStyles(
                            deal?.negotiations_Status ?? ""
                          ).backgroundColor,
                          color: getStatusStyles(
                            deal?.negotiations_Status ?? ""
                          ).textColor,
                        }}
                        className="cursor-pointer p-1 w-fit h-fit text-xs rounded-full"
                      >
                        <p>{deal.negotiations_Status}</p>
                      </Button>
                    </TableCell>

                    <TableCell className="px-4 py-2 border-r">
                      {deal.date_paid}
                    </TableCell>
                    <TableCell className="px-4 py-2 border-r">
                      {deal.negotiations_Deal_Start_Date}
                    </TableCell>

                    <TableCell className="px-4 py-2 border-r">
                      {allDealNegotiator.find(
                        (negotiator) =>
                          negotiator.id === deal.negotiations_deal_coordinator
                      )?.name || "Not Assigned"}
                    </TableCell>

                    <TableCell className="px-4 py-2 relative max-w-[150px]">
                      {deal?.negotiations_Trim_Package_Options &&
                      deal?.negotiations_Trim_Package_Options?.length > 50
                        ? `${deal?.negotiations_Trim_Package_Options?.substring(
                            0,
                            50
                          )}...`
                        : deal.negotiations_Trim_Package_Options}
                      <button
                        onClick={() =>
                          setTrimDetails({
                            id: deal.id,
                            trim: deal.negotiations_Trim_Package_Options ?? "",
                          })
                        }
                        className="absolute top-[5px] right-[10px] transform  text-gray-500 hover:text-gray-700"
                        title="Expand"
                      >
                        <Expand
                          size={16}
                          className="text-gray-500 hover:text-gray-700"
                        />
                      </button>
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
        {trimDetails && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-4">
              <h2 className="text-lg font-semibold mb-2">Trim Details</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {trimDetails.trim}
              </p>
              <div className="text-right mt-4">
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={() => setTrimDetails(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
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

export default OldDeals;
