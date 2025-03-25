"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Check, ChevronDown, ChevronRight, Expand, X } from "lucide-react";
import {
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "@/firebase/config";
import { DealNegotiator, IUser, NegotiationData } from "@/types";
import {
  allowedStatuses,
  dateFormat,
  getDealsWithoutCoordinator,
  getStatusStyles,
} from "@/lib/utils";
import { Loader } from "@/components/base/loader";
import useTeamDashboard from "@/hooks/useTeamDashboard";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/hooks/use-toast";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { statuses } from "@/components/Team/filter-popup";
import { TailwindPlusTable } from "@/components/tailwind-plus/table";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";
import { TeamDashboardViewHeader } from "@/components/base/header";
import { TeamDashboardViewSelector } from "@/components/Team/dashboard/team-dashboard-view-selector";

type NegotiationsGroupedType = {
  [groupKey: string]: NegotiationDataType[];
};

type TeamDataType = {
  activeDeals: string[];
  deals: string[];
  email: string;
  id: string;
  name: string;
  profile_pic: string;
  role: string;
  video_link: string;
  negotiationsGrouped: NegotiationsGroupedType;
};

function ReceivedCar() {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [teamData, setTeamData] = useState<TeamDataType[]>([]);
  const [userData, setUserData] = useState<IUser>();

  const [dealsWithoutCoordinator, setDealsWithoutCoordinator] = useState<
    NegotiationDataType[]
  >([]);
  const [loading, setLoading] = useState(false);
  const {
    allDealNegotiator,
    negotiatorData,
    negotiations: negotiationsFromTeamDashboard,
    team,
  } = useTeamDashboard({
    all: true,
    filter: {
      stage: "Shipping",
    },
  });

  const [expandedStatusRows, setExpandedStatusRows] = useState<{
    [key: string]: boolean;
  }>({});

  const [sortConfig, setSortConfig] = useState({
    key: "submittedDate",
    direction: "ascending",
  });

  const toggleRow = (id: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      newSet.has(id) ? newSet.delete(id) : newSet.add(id);
      return newSet;
    });
  };

  const toggleStatusRow = (teamId: string, status: string) => {
    const key = `${teamId}_${status}`;
    setExpandedStatusRows((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  useEffect(() => {
    if (negotiationsFromTeamDashboard) {
      const filteredDeals = negotiationsFromTeamDashboard.filter(
        (item: any) => {
          return (
            item.stage === "Shipping" ||
            item.stage === "Delivery Scheduled" ||
            item.stage === "Follow Up Issue"
          );
        }
      );

      const teamIdToObject: {
        [key: string]: NegotiationDataType[];
      } = {};

      filteredDeals.map((deal: NegotiationDataType) => {
        if (deal.dealCoordinatorId) {
          if (!teamIdToObject[deal.dealCoordinatorId]) {
            teamIdToObject[deal.dealCoordinatorId] = [];
          }

          teamIdToObject[deal.dealCoordinatorId].push(deal);
        }
      });

      for (const index in team) {
        const member = team[index];
        const teamMemberDeals = teamIdToObject[member.id] ?? [];
        console.log(member.id, member.name, teamMemberDeals);
        const groupedByStatus = teamMemberDeals.reduce(
          (acc: any, negotiation: any) => {
            const status = negotiation.stage || "Unknown";
            if (!acc[status]) acc[status] = [];
            acc[status].push(negotiation);
            return acc;
          },
          {}
        );

        team[index].negotiationsGrouped = groupedByStatus;
      }

      setTeamData(team);
      setLoading(false);
    }
  }, [negotiationsFromTeamDashboard]);

  const sortData = (key: string, direction: string) => {
    setSortConfig((prevConfig) => {
      // console.log("prevConfig:", prevConfig);
      // const newDirection =
      //   prevConfig.key === key && prevConfig.direction === "ascending"
      //     ? "descending"
      //     : "ascending";

      // console.log(key);

      const sortedTeams = teamData.map((team) => {
        const sortedNegotiationsGrouped: NegotiationsGroupedType =
          Object.fromEntries(
            Object.entries(team.negotiationsGrouped).map(
              ([groupKey, negotiations]) => {
                const sortedNegotiations = [...negotiations].sort(
                  (a: any, b: any) => {
                    let aValue = a[key];
                    let bValue = b[key];

                    if (typeof aValue === "string")
                      aValue = aValue.toLowerCase();
                    if (typeof bValue === "string")
                      bValue = bValue.toLowerCase();

                    if (aValue == null)
                      return direction === "ascending" ? 1 : -1;
                    if (bValue == null)
                      return direction === "ascending" ? -1 : 1;

                    if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
                      return direction === "ascending"
                        ? Number(aValue) - Number(bValue)
                        : Number(bValue) - Number(aValue);
                    }

                    return direction === "ascending"
                      ? aValue.localeCompare(bValue)
                      : bValue.localeCompare(aValue);
                  }
                );

                return [groupKey, sortedNegotiations];
              }
            )
          );

        return { ...team, negotiationsGrouped: sortedNegotiationsGrouped };
      });

      setTeamData(sortedTeams);

      return { key, direction };
    });
  };

  useEffect(() => {
    const user = localStorage.getItem("user");
    setUserData(JSON.parse(user ?? ""));
    const fetchUserData = async () => {
      const q = query(
        collection(db, "users"),
        where("id", "==", userData?.id ?? "")
      );
      const querySnapshot = await getDocs(q);
      const userInfo = querySnapshot.docs[0]?.data();
      setUserData(userInfo as IUser);
    };
    fetchUserData();
  }, []);

  useEffect(() => {
    setDealsWithoutCoordinator(negotiationsFromTeamDashboard);
  }, [negotiationsFromTeamDashboard]);

  return (
    <>
      <div className="container mx-auto p-4 space-y-6 min-h-screen">
        <TeamDashboardViewHeader
          negotiatorData={negotiatorData as unknown as DealNegotiatorType}
        />
        <TeamDashboardViewSelector />
        <Table className="border-collapse border border-gray-200">
          {loading ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={17} className="text-center py-4">
                  <Loader />
                </TableCell>
              </TableRow>
            </TableBody>
          ) : (
            <TableBody>
              {teamData
                ?.filter(
                  (item) =>
                    item.name !== "Tabarak Sohail" &&
                    item.name.trim() !== "Emil Mrsic Negotiator" &&
                    item.name !== "Crystal Watts" &&
                    item.name !== "Schalaschly Marrero"
                )
                .map((team) => (
                  <React.Fragment key={team.id}>
                    {/* Team Member Row */}
                    <TableRow className="bg-gray-100 hover:bg-gray-200 transition-colors">
                      <TableCell className="w-[50px]">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRow(team.id)}
                        >
                          {expandedRows.has(team.id) ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell colSpan={16} className="font-semibold">
                        <div className="flex flex-col">
                          <p>{team.name}</p>
                          <p className="text-xs text-gray-600">
                            Total Deals:{" "}
                            {Object.values(team.negotiationsGrouped).reduce(
                              (acc, curr) => acc + curr.length,
                              0
                            )}
                          </p>
                        </div>
                      </TableCell>
                    </TableRow>

                    {expandedRows.has(team.id) &&
                      Object.entries(team.negotiationsGrouped).map(
                        ([status, deals]) => (
                          <React.Fragment key={status}>
                            <TableRow className="bg-gray-50 hover:bg-gray-100 transition-colors">
                              <TableCell className="pl-8">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    toggleStatusRow(team.id, status)
                                  }
                                >
                                  {expandedStatusRows[
                                    `${team.id}_${status}`
                                  ] ? (
                                    <ChevronDown className="h-4 w-4" />
                                  ) : (
                                    <ChevronRight className="h-4 w-4" />
                                  )}{" "}
                                </Button>
                              </TableCell>
                              <TableCell colSpan={16}>
                                <div className="flex flex-col">
                                  <p className="font-medium">
                                    Status: {status}
                                  </p>
                                  <p className="text-xs text-gray-600">
                                    Deals: {deals.length}
                                  </p>
                                </div>
                              </TableCell>
                            </TableRow>
                            {expandedStatusRows[`${team.id}_${status}`] && (
                              <TableRow>
                                <TableCell colSpan={16}>
                                  <TailwindPlusTable
                                    headers={[
                                      {
                                        header: "No.",
                                      },
                                      {
                                        header: "Client",
                                        config: {
                                          sortable: true,
                                          key: "clientNamefull",
                                        },
                                      },
                                      {
                                        header: "Phone",
                                        config: {
                                          sortable: true,
                                          key: "clientPhone",
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
                                        header: "Brand",
                                        config: {
                                          sortable: true,
                                          key: "brand",
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
                                        header: "Model",
                                        config: {
                                          sortable: true,
                                          key: "model",
                                        },
                                      },
                                      {
                                        header: "Status",
                                        config: {
                                          sortable: true,
                                          key: "stage",
                                        },
                                      },
                                      {
                                        header: "Deal Start Date",
                                        config: {
                                          sortable: true,
                                          key: "dealStartDate",
                                        },
                                      },
                                      {
                                        header: "Arrival to Client",
                                        config: {
                                          sortable: true,
                                          key: "arrival_to_client",
                                        },
                                      },
                                      {
                                        header: "Arrival to Dealer",
                                        config: {
                                          sortable: true,
                                          key: "arrival_to_dealer",
                                        },
                                      },
                                      {
                                        header: "Trade Details",
                                        config: {
                                          sortable: true,
                                          key: "tradeDetails",
                                        },
                                      },
                                      {
                                        header: "Travel Limit",
                                        config: {
                                          sortable: true,
                                          key: "travelLimit",
                                        },
                                      },
                                      {
                                        header: "Shipping Info",
                                        config: {
                                          sortable: true,
                                          key: "shippingInfo",
                                        },
                                      },
                                      {
                                        header: "Interior Preferred",
                                        config: {
                                          sortable: true,
                                          key: "desiredInterior",
                                        },
                                      },
                                      {
                                        header: "Interior Deal Breaker",
                                        config: {
                                          sortable: true,
                                          key: "excludedInterior",
                                        },
                                      },
                                      {
                                        header: "Exterior Preferred",
                                        config: {
                                          sortable: true,
                                          key: "desiredExterior",
                                        },
                                      },
                                      {
                                        header: "Exterior Deal Breakers",
                                        config: {
                                          sortable: true,
                                          key: "excludedExterior",
                                        },
                                      },
                                    ]}
                                    rows={deals
                                      .filter((deal) => {
                                        return true;
                                        const today = new Date();
                                        const paidDate = new Date(
                                          deal.arrivalToClient
                                        );
                                        const diffTime =
                                          today.getTime() - paidDate.getTime();
                                        const diffDays =
                                          diffTime / (1000 * 3600 * 24);

                                        return diffDays >= 1;
                                      })
                                      .map((deal, index) => [
                                        {
                                          text: `${index + 1}`,
                                          config: {
                                            link: `/team-profile?id=${deal.id}`,
                                          },
                                        },
                                        {
                                          text: deal.clientNamefull,
                                        },
                                        {
                                          text: deal.clientPhone,
                                        },
                                        {
                                          text: deal.zip,
                                        },
                                        {
                                          text: deal.brand,
                                        },
                                        allDealNegotiator.find(
                                          (negotiator) =>
                                            negotiator.id ===
                                            deal.dealCoordinatorId
                                        )?.name || "Not Assigned",
                                        {
                                          text: deal.model,
                                        },
                                        {
                                          Component: () => (
                                            <Button
                                              variant="outline"
                                              style={{
                                                backgroundColor:
                                                  getStatusStyles(
                                                    deal?.stage ?? ""
                                                  ).backgroundColor,
                                                color: getStatusStyles(
                                                  deal?.stage ?? ""
                                                ).textColor,
                                              }}
                                              className="cursor-pointer p-1 w-fit h-fit text-xs rounded-full"
                                            >
                                              <p>{deal.stage}</p>
                                            </Button>
                                          ),
                                        },
                                        {
                                          text: deal.dealStartDate,
                                        },
                                        {
                                          text: deal.arrivalToClient,
                                        },
                                        {
                                          text: deal.arrivalToDealer,
                                        },
                                        {
                                          text: deal.tradeDetails?.comments?.substring(
                                            0,
                                            50
                                          ),
                                          config: {
                                            expandable:
                                              typeof deal.tradeDetails?.comments
                                                ?.length === "number" &&
                                              deal.tradeDetails?.comments
                                                ?.length > 50,
                                            expandedComponent: () => (
                                              <p>
                                                {deal.tradeDetails?.comments}
                                              </p>
                                            ),
                                          },
                                        },
                                        {
                                          text: deal.travelLimit?.substring(
                                            0,
                                            50
                                          ),
                                          config: {
                                            expandable:
                                              typeof deal.travelLimit
                                                ?.length === "number" &&
                                              deal.travelLimit?.length > 50,
                                            expandedComponent: () => (
                                              <p>{deal.travelLimit}</p>
                                            ),
                                          },
                                        },
                                        {
                                          text: deal.shippingInfo?.substring(
                                            0,
                                            50
                                          ),
                                          config: {
                                            expandable:
                                              typeof deal.shippingInfo
                                                ?.length === "number" &&
                                              deal.shippingInfo?.length > 50,
                                            expandedComponent: () => (
                                              <p>{deal.shippingInfo}</p>
                                            ),
                                          },
                                        },
                                        {
                                          text: deal?.desiredInterior,
                                        },
                                        {
                                          text: deal?.excludedInterior,
                                        },
                                        {
                                          text: deal?.desiredExterior,
                                        },
                                        {
                                          text: deal?.excludedExterior,
                                        },
                                      ])}
                                    sortConfig={sortConfig}
                                    setSortConfig={setSortConfig}
                                    sortData={sortData}
                                  />
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        )
                      )}
                  </React.Fragment>
                ))}
            </TableBody>
          )}
        </Table>
      </div>
    </>
  );
}

export default ReceivedCar;
