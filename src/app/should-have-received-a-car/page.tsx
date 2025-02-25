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

type NegotiationsGroupedType = {
  [groupKey: string]: NegotiationData[];
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
  const router = useRouter();
  const [userData, setUserData] = useState<IUser>();
  const [expandedNote, setExpandedNote] = useState<{
    id: string;
    note: string;
  } | null>(null);
  const [shippingInfo, setExpandedShippingInfo] = useState<{
    id: string;
    note: string;
  } | null>(null);

  const [tradeInfo, setExpandedTradeInfo] = useState<{
    id: string;
    note: string;
  } | null>(null);

  const [dealsWithoutCoordinator, setDealsWithoutCoordinator] = useState<
    NegotiationData[]
  >([]);
  const [loading, setLoading] = useState(false);
  const {
    allDealNegotiator,
    setFilteredDeals,
    setOriginalDeals,
    negotiatorData,
  } = useTeamDashboard();

  const [expandedStatusRows, setExpandedStatusRows] = useState<{
    [key: string]: boolean;
  }>({});

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

  const fetchTeamAndDeals = async () => {
    try {
      setLoading(true);
      const teamQuery = collection(db, "team delivrd");
      const teamSnapshot = await getDocs(teamQuery);

      let teamsWithDeals = [];

      for (const teamDoc of teamSnapshot.docs) {
        const teamMember: any = { id: teamDoc.id, ...teamDoc.data() };
        const activeDeals = teamMember.active_deals?.filter(Boolean) || [];

        let negotiations = [];

        if (activeDeals.length > 0) {
          const chunkedDeals = [];
          for (let i = 0; i < activeDeals.length; i += 30) {
            const chunk = activeDeals.slice(i, i + 30).filter(Boolean);
            if (chunk.length > 0) chunkedDeals.push(chunk);
          }

          for (const chunk of chunkedDeals) {
            const negotiationsQuery = query(
              collection(db, "negotiations"),
              where("__name__", "in", chunk)
            );
            const negotiationsSnapshot = await getDocs(negotiationsQuery);
            negotiations.push(
              ...negotiationsSnapshot.docs
                .map((doc) => ({
                  id: doc.id,
                  ...doc.data(),
                }))
                .filter(
                  (item: any) =>
                    item.negotiations_Status === "Shipping" ||
                    item.negotiations_Status === "Delivery Scheduled" ||
                    item.negotiations_Status === "Follow Up Issue"
                )
            );
          }
        }

        // Grouping by negotiation status
        const groupedByStatus = negotiations.reduce(
          (acc: any, negotiation: any) => {
            const status = negotiation.negotiations_Status || "Unknown";
            if (!acc[status]) acc[status] = [];
            acc[status].push(negotiation);
            return acc;
          },
          {}
        );

        teamMember.negotiationsGrouped = groupedByStatus;
        teamsWithDeals.push(teamMember);
      }

      setLoading(false);
      setTeamData(teamsWithDeals);
    } catch (error) {
      setLoading(false);
      console.error("Error fetching data:", error);
    }
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
    fetchTeamAndDeals();
    getDealsWithoutCoordinator().then((res) =>
      setDealsWithoutCoordinator(res as NegotiationData[])
    );
  }, []);

  console.log({ teamData });

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
      <div className="space-y-2 ml-10 mb-7 w-[150px]">
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
      <div className="w-full overflow-x-auto">
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
                                  )}
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
                              <>
                                <TableRow className="bg-gray-200">
                                  <TableHead className="pl-16 py-2 text-xs font-semibold">
                                    No.
                                  </TableHead>
                                  <TableHead className="min-w-[130px] py-2 text-xs font-semibold">
                                    Client
                                  </TableHead>
                                  <TableHead className="min-w-[120px] py-2 text-xs font-semibold">
                                    Phone
                                  </TableHead>
                                  <TableHead className="min-w-[100px] py-2 text-xs font-semibold">
                                    Zip Code
                                  </TableHead>
                                  <TableHead className="py-2 text-xs font-semibold">
                                    Brand
                                  </TableHead>
                                  <TableHead className="min-w-[120px] py-2 text-xs font-semibold">
                                    Deal Negotiator
                                  </TableHead>
                                  <TableHead className="min-w-[100px] py-2 text-xs font-semibold">
                                    Model
                                  </TableHead>
                                  <TableHead className="min-w-[120px] py-2 text-xs font-semibold">
                                    Status
                                  </TableHead>
                                  <TableHead className="min-w-[90px] py-2 text-xs font-semibold">
                                    Deal Start Date
                                  </TableHead>
                                  <TableHead className="min-w-[90px] py-2 text-xs font-semibold">
                                    Arrival to Client
                                  </TableHead>
                                  <TableHead className="min-w-[90px] py-2 text-xs font-semibold">
                                    Arrival to Dealer
                                  </TableHead>
                                  <TableHead className="py-2 text-xs font-semibold">
                                    Trade Details
                                  </TableHead>
                                  <TableHead className="py-2 text-xs font-semibold">
                                    Travel Limit
                                  </TableHead>
                                  <TableHead className="py-2 text-xs font-semibold">
                                    Shipping Info
                                  </TableHead>
                                  <TableHead className="py-2 text-xs font-semibold">
                                    Interior Preferred
                                  </TableHead>
                                  <TableHead className="py-2 text-xs font-semibold">
                                    Interior Deal Breaker
                                  </TableHead>
                                  <TableHead className="py-2 text-xs font-semibold">
                                    Exterior Preferred
                                  </TableHead>
                                  <TableHead className="py-2 text-xs font-semibold">
                                    Exterior Deal Breakers
                                  </TableHead>
                                </TableRow>
                                {deals
                                  ?.filter((deal) => {
                                    const today = new Date();
                                    const paidDate = new Date(
                                      deal.arrival_to_client
                                    );
                                    const diffTime =
                                      today.getTime() - paidDate.getTime();
                                    const diffDays =
                                      diffTime / (1000 * 3600 * 24);

                                    return diffDays >= 1;
                                  })
                                  .map((deal, index) => (
                                    <TableRow
                                      key={deal.id}
                                      className="hover:bg-gray-50 transition-colors"
                                    >
                                      <TableCell className="pl-16 border-t border-gray-200">
                                        <Link
                                          href={`/team-profile?id=${deal.id}`}
                                          className="text-blue-600 hover:underline"
                                        >
                                          {index + 1}
                                        </Link>
                                      </TableCell>
                                      <TableCell className="border-t border-gray-200">
                                        {deal.negotiations_Client}
                                      </TableCell>
                                      <TableCell className="border-t border-gray-200">
                                        {deal.negotiations_Phone}
                                      </TableCell>
                                      <TableCell className="border-t border-gray-200">
                                        {deal.negotiations_Zip_Code}
                                      </TableCell>
                                      <TableCell className="border-t border-gray-200">
                                        {deal.negotiations_Brand}
                                      </TableCell>
                                      <TableCell className="border-t border-gray-200">
                                        {allDealNegotiator.find(
                                          (negotiator) =>
                                            negotiator.id ===
                                            deal.negotiations_deal_coordinator
                                        )?.name || "Not Assigned"}
                                      </TableCell>
                                      <TableCell className="border-t border-gray-200">
                                        {deal.negotiations_Model}
                                      </TableCell>
                                      <TableCell className="border-t border-gray-200">
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
                                      <TableCell className="border-t border-gray-200">
                                        {deal.negotiations_Deal_Start_Date}
                                      </TableCell>
                                      <TableCell className="border-t border-gray-200">
                                        {deal.arrival_to_client}
                                      </TableCell>
                                      <TableCell className="border-t border-gray-200">
                                        {deal.arrival_to_dealer}
                                      </TableCell>
                                      <TableCell className="px-4 relative max-w-[100px] truncate py-2 border-t border-gray-200">
                                        {deal?.negotiations_Trade_Details &&
                                        deal?.negotiations_Trade_Details
                                          ?.length > 50
                                          ? `${deal?.negotiations_Trade_Details?.substring(
                                              0,
                                              50
                                            )}...`
                                          : deal.negotiations_Trade_Details ??
                                            "No Trade Details available"}
                                        <button
                                          onClick={() =>
                                            setExpandedTradeInfo({
                                              id: deal.id,
                                              note:
                                                deal.negotiations_Trade_Details ??
                                                "",
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
                                      <TableCell className="px-4 relative max-w-[100px] truncate py-2 border-t border-gray-200">
                                        {deal?.negotiations_Travel_Limit &&
                                        deal?.negotiations_Travel_Limit
                                          ?.length > 50
                                          ? `${deal?.negotiations_Travel_Limit?.substring(
                                              0,
                                              50
                                            )}...`
                                          : deal.negotiations_Travel_Limit ??
                                            "No Travel Limit Info available"}
                                        <button
                                          onClick={() =>
                                            setExpandedNote({
                                              id: deal.id,
                                              note:
                                                deal.negotiations_Travel_Limit ??
                                                "",
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
                                      <TableCell className="px-4 relative max-w-[100px] truncate py-2 border-t border-gray-200">
                                        {deal?.shipping_info &&
                                        deal?.shipping_info?.length > 50
                                          ? `${deal?.shipping_info?.substring(
                                              0,
                                              50
                                            )}...`
                                          : deal.shipping_info ??
                                            "No Shipping Info at the moment"}
                                        <button
                                          onClick={() =>
                                            setExpandedNote({
                                              id: deal.id,
                                              note: deal.shipping_info ?? "",
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
                                      <TableCell className="border-t border-gray-200">
                                        {
                                          deal.negotiations_Color_Options
                                            .interior_preferred
                                        }
                                      </TableCell>
                                      <TableCell className="border-t border-gray-200">
                                        {
                                          deal.negotiations_Color_Options
                                            .interior_deal_breaker
                                        }
                                      </TableCell>
                                      <TableCell className="border-t border-gray-200">
                                        {
                                          deal.negotiations_Color_Options
                                            .exterior_preferred
                                        }
                                      </TableCell>
                                      <TableCell className="border-t border-gray-200">
                                        {
                                          deal.negotiations_Color_Options
                                            .exterior_deal_breakers
                                        }
                                      </TableCell>
                                    </TableRow>
                                  ))}
                              </>
                            )}
                          </React.Fragment>
                        )
                      )}
                  </React.Fragment>
                ))}
            </TableBody>
          )}
        </Table>
        {expandedNote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-4">
              <h2 className="text-lg font-semibold mb-2">Travel Limit</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {expandedNote.note}
              </p>
              <div className="text-right mt-4">
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={() => setExpandedNote(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {shippingInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-4">
              <h2 className="text-lg font-semibold mb-2">Shipping Info</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {shippingInfo.note}
              </p>
              <div className="text-right mt-4">
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={() => setExpandedShippingInfo(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {tradeInfo && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-4">
              <h2 className="text-lg font-semibold mb-2">Trade Info</h2>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {tradeInfo.note}
              </p>
              <div className="text-right mt-4">
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  onClick={() => setExpandedTradeInfo(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default ReceivedCar;
