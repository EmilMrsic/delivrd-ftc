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
import { Check, ChevronDown, ChevronRight, X } from "lucide-react";
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
import { useRouter } from "next/navigation";
import { TeamDashboardViewSelector } from "@/components/Team/dashboard/team-dashboard-view-selector";
import { mapNegotiationsToTeam } from "@/lib/helpers/negotiation";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";
import { TailwindPlusTable } from "@/components/tailwind-plus/table";
import { TeamHeader } from "@/components/base/header";

type TeamDataType = {
  activeDeals: string[];
  deals: string[];
  email: string;
  id: string;
  name: string;
  profile_pic: string;
  role: string;
  video_link: string;
  negotiations: NegotiationData[];
};

function Manager() {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [teamData, setTeamData] = useState<DealNegotiatorType[]>([]);
  const router = useRouter();
  const [userData, setUserData] = useState<IUser>();
  const [sortConfig, setSortConfig] = useState({
    key: "submittedDate", // default sorting by Submitted Date
    direction: "ascending", // default direction
  });

  const [openNegotiatorState, setOpenNegotiatorState] = useState<
    Record<string, boolean>
  >({});
  const [dealsWithoutCoordinator, setDealsWithoutCoordinator] = useState<
    NegotiationDataType[]
  >([]);
  const [loading, setLoading] = useState(false);
  const {
    allDealNegotiator,
    // setFilteredDeals,
    // setOriginalDeals,
    // negotiatorData,
    negotiations: negotiationsFromTeamDashboard,
    team: teamFromTeamDashboard,
    refetch,
  } = useTeamDashboard({
    all: true,
  });

  const toggleRow = (teamId: string) => {
    setExpandedRows((prevExpandedRows) => {
      const newExpandedRows = new Set(prevExpandedRows);
      if (newExpandedRows.has(teamId)) {
        newExpandedRows.delete(teamId);
      } else {
        newExpandedRows.add(teamId);
      }
      return newExpandedRows;
    });
  };

  useEffect(() => {
    if (negotiationsFromTeamDashboard) {
      const { team: teamWithNegotiations, dealsWithoutCoordinator } =
        mapNegotiationsToTeam(
          negotiationsFromTeamDashboard,
          teamFromTeamDashboard
        );

      setTeamData(teamWithNegotiations);
      setDealsWithoutCoordinator(dealsWithoutCoordinator);
      setLoading(false);
    }
  }, [negotiationsFromTeamDashboard]);

  // const fetchTeamAndDeals = async () => {
  //   try {
  //     setLoading(true);

  //     // Fetch all team members
  //     const teamSnapshot = await getDocs(collection(db, "team delivrd"));

  //     // Map teams and fetch negotiations in parallel
  //     const teamsWithDeals = await Promise.all(
  //       teamSnapshot.docs.map(async (teamDoc) => {
  //         const teamMember = { id: teamDoc.id, ...teamDoc.data() } as any;
  //         const activeDeals = teamMember.active_deals?.filter(Boolean) || [];

  //         if (activeDeals.length === 0) {
  //           return { ...teamMember, negotiations: [] };
  //         }

  //         // Chunk the activeDeals array to avoid Firestore query limit issues
  //         const chunkedDeals = Array.from(
  //           { length: Math.ceil(activeDeals.length / 30) },
  //           (_, i) => activeDeals.slice(i * 30, i * 30 + 30)
  //         );

  //         // Fetch negotiations for each chunk in parallel
  //         const negotiations = (
  //           await Promise.all(
  //             chunkedDeals.map(async (chunk) => {
  //               const negotiationsSnapshot = await getDocs(
  //                 query(
  //                   collection(db, "negotiations"),
  //                   where("__name__", "in", chunk)
  //                 )
  //               );
  //               return negotiationsSnapshot.docs.map((doc) => ({
  //                 id: doc.id,
  //                 ...doc.data(),
  //               }));
  //             })
  //           )
  //         ).flat(); // Flatten the results

  //         return { ...teamMember, negotiations };
  //       })
  //     );

  //     setTeamData(teamsWithDeals);
  //   } catch (error) {
  //     console.error("Error fetching data:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

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

  const updateDealNegotiator = async (id: string, newNegotiatorId: string) => {
    try {
      const dealRef = doc(db, "delivrd_negotiations", id);
      const negotiatorRef = doc(db, "team delivrd", newNegotiatorId);
      const dealSnap = await getDoc(dealRef);
      if (!dealSnap.exists()) {
        throw new Error("Deal not found");
      }

      const oldNegotiatorId = dealSnap.data().negotiations_deal_coordinator;

      const movedDeal = dealsWithoutCoordinator?.find(
        (deal) => deal?.id === id
      );
      if (!movedDeal)
        return console.error("Deal not found in unassigned deals");

      await updateDoc(dealRef, {
        dealCoordinatorId: newNegotiatorId ?? "",
      });

      // await updateDoc(negotiatorRef, {
      //   active_deals: arrayUnion(id),
      // });
      // if (oldNegotiatorId) {
      //   const oldNegotiatorRef = doc(db, "team delivrd", oldNegotiatorId);
      //   await updateDoc(oldNegotiatorRef, {
      //     active_deals: arrayRemove(id),
      //   });
      // }

      // setFilteredDeals((prevDeals) =>
      //   prevDeals?.map((deal) =>
      //     deal.id === id
      //       ? { ...deal, negotiations_deal_coordinator: newNegotiatorId }
      //       : deal
      //   )
      // );
      // setDealsWithoutCoordinator((prevDeals) =>
      //   prevDeals?.filter((deal) => deal.id !== id)
      // );

      setTeamData((prevTeams) =>
        prevTeams.map((team) => {
          if (team.id === newNegotiatorId) {
            return {
              ...team,
              negotiations: [...(team.negotiations || []), movedDeal],
            };
          }
          return team;
        })
      );

      // setOriginalDeals((prevDeals) =>
      //   prevDeals?.map((deal) =>
      //     deal.id === id
      //       ? { ...deal, negotiations_deal_coordinator: newNegotiatorId }
      //       : deal
      //   )
      // );

      refetch();

      toast({ title: "Negotiator updated successfully" });
      console.log("Negotiator updated successfully!");
    } catch (error) {
      console.error("Error updating negotiator: ", error);
    }
  };

  const toggleNegotiatorDropdown = (id: string, isOpen: boolean) => {
    setOpenNegotiatorState((prev) => ({
      ...prev,
      [id]: isOpen,
    }));
  };

  const sortData = (key: string) => {
    setSortConfig((prevConfig) => {
      const newDirection =
        prevConfig.key === key && prevConfig.direction === "ascending"
          ? "descending"
          : "ascending";

      const sortedTeams = [...teamData].map((team) => {
        const sortedNegotiations = [...(team.negotiations ?? [])].sort(
          (a: any, b: any) => {
            let aValue = a[key];
            let bValue = b[key];

            if (typeof aValue === "string") aValue = aValue.toLowerCase();
            if (typeof bValue === "string") bValue = bValue.toLowerCase();

            if (aValue == null) return newDirection === "ascending" ? 1 : -1;
            if (bValue == null) return newDirection === "ascending" ? -1 : 1;

            if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
              return newDirection === "ascending"
                ? Number(aValue) - Number(bValue)
                : Number(bValue) - Number(aValue);
            }

            if (aValue < bValue) return newDirection === "ascending" ? -1 : 1;
            if (aValue > bValue) return newDirection === "ascending" ? 1 : -1;
            return 0;
          }
        );

        return { ...team, negotiations: sortedNegotiations };
      });

      setTeamData(sortedTeams);

      return { key, direction: newDirection };
    });
  };

  const sortWithoutCoordinatorData = (key: string) => {
    setSortConfig((prevConfig) => {
      const newDirection =
        prevConfig.key === key && prevConfig.direction === "ascending"
          ? "descending"
          : "ascending";

      const sortedNegotiations = [...dealsWithoutCoordinator].sort(
        (a: any, b: any) => {
          let aValue = a[key];
          let bValue = b[key];

          if (typeof aValue === "string") aValue = aValue.toLowerCase();
          if (typeof bValue === "string") bValue = bValue.toLowerCase();

          if (aValue == null) return newDirection === "ascending" ? 1 : -1;
          if (bValue == null) return newDirection === "ascending" ? -1 : 1;

          if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
            return newDirection === "ascending"
              ? Number(aValue) - Number(bValue)
              : Number(bValue) - Number(aValue);
          }

          if (aValue < bValue) return newDirection === "ascending" ? -1 : 1;
          if (aValue > bValue) return newDirection === "ascending" ? 1 : -1;
          return 0;
        }
      );

      setDealsWithoutCoordinator(sortedNegotiations);

      return { key, direction: newDirection };
    });
  };

  return (
    <div className="container mx-auto p-4 space-y-6 min-h-screen">
      <TeamHeader />
      <TeamDashboardViewSelector />
      <div className="w-full overflow-x-auto">
        <Table>
          {loading ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  <Loader />
                </TableCell>
              </TableRow>
            </TableBody>
          ) : teamData?.length > 0 || dealsWithoutCoordinator?.length > 0 ? (
            <>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {dealsWithoutCoordinator.length > 0 && (
                  <React.Fragment>
                    <TableRow>
                      <TableCell className="w-[50px]">
                        <Button variant="ghost" size="sm">
                          <ChevronDown className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <p>Unassigned Deals</p>
                          <p className="text-xs">
                            No of Deals: {dealsWithoutCoordinator.length}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>

                    <TableRow>
                      <TableCell colSpan={2} className="p-0">
                        <div className="w-full px-5 overflow-x-auto">
                          <ManagerTable
                            deals={dealsWithoutCoordinator}
                            sortConfig={sortConfig}
                            setSortConfig={setSortConfig}
                            sortData={sortWithoutCoordinatorData}
                            openNegotiatorState={openNegotiatorState}
                            toggleNegotiatorDropdown={toggleNegotiatorDropdown}
                            updateDealNegotiator={updateDealNegotiator}
                            allDealNegotiator={allDealNegotiator}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                )}
                {/* Mapping Team Deals */}
                {teamData
                  .filter(
                    (item) =>
                      item.name !== "Tabarak Sohail" &&
                      item.name.trim() !== "Emil Mrsic Negotiator" &&
                      item.name !== "Crystal Watts" &&
                      item.name !== "Schalaschly Marrero"
                  )
                  .map((team) => (
                    <React.Fragment key={team.id}>
                      <TableRow>
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
                        <TableCell>
                          <div className="flex flex-col">
                            <p>{team.name}</p>
                            <p className="text-xs">
                              No of Deals:{" "}
                              {
                                team.negotiations?.filter(
                                  (item) =>
                                    item.stage === "Deal Started" ||
                                    item.stage === "Actively Negotiating" ||
                                    item.stage === "Paid"
                                ).length
                              }
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(team.id) && (
                        <TableRow>
                          <TableCell colSpan={2} className="p-0">
                            <div className="w-full px-5 overflow-x-auto">
                              <ManagerTable
                                deals={team.negotiations ?? []}
                                sortConfig={sortConfig}
                                setSortConfig={setSortConfig}
                                sortData={sortData}
                                openNegotiatorState={openNegotiatorState}
                                toggleNegotiatorDropdown={
                                  toggleNegotiatorDropdown
                                }
                                updateDealNegotiator={updateDealNegotiator}
                                allDealNegotiator={allDealNegotiator}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
              </TableBody>
            </>
          ) : (
            <TableBody>
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  <p>No Data Found</p>
                </TableCell>
              </TableRow>
            </TableBody>
          )}
        </Table>
      </div>
    </div>
  );
}

const ManagerTable = ({
  deals,
  sortConfig,
  setSortConfig,
  sortData,
  openNegotiatorState,
  toggleNegotiatorDropdown,
  updateDealNegotiator,
  allDealNegotiator,
}: {
  deals: NegotiationDataType[];
  sortConfig: { key: string; direction: string };
  setSortConfig: (config: { key: string; direction: string }) => void;
  sortData: (key: string, direction: string) => void;
  openNegotiatorState: Record<string, boolean>;
  toggleNegotiatorDropdown: (id: string, isOpen: boolean) => void;
  updateDealNegotiator: (id: string, newNegotiatorId: string) => void;
  allDealNegotiator: DealNegotiatorType[];
}) => {
  return (
    <TailwindPlusTable
      headers={[
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
          header: "Onboarding Complete",
          config: {
            sortable: true,
            key: "onboardingComplete",
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
      rows={deals.map((deal, idx) => [
        deal.clientNamefull,
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
              className="cursor-pointer p-1 w-fit h-fit text-xs border-gray-300"
            >
              <p>{deal.stage}</p>
            </Button>
          ),
        },
        deal.zip,
        {
          Component: () => (
            <DropdownMenu
              open={openNegotiatorState[deal.id] || false}
              onOpenChange={(isOpen) =>
                toggleNegotiatorDropdown(deal.id, isOpen)
              }
            >
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className={`cursor-pointer p-1 w-fit h-fit text-xs bg-gray-100 text-gray-800 border-gray-300`}
                >
                  {allDealNegotiator.some(
                    (negotiator) => negotiator.id === deal.dealCoordinatorId
                  ) ? (
                    <p>
                      {
                        allDealNegotiator.find(
                          (negotiator) =>
                            negotiator.id === deal.dealCoordinatorId
                        )?.name
                      }
                    </p>
                  ) : (
                    <p>Not Assigned</p>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 h-56 overflow-scroll">
                {allDealNegotiator.map(
                  (negotiator: DealNegotiatorType, index) => (
                    <DropdownMenuItem
                      key={index}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        updateDealNegotiator(deal.id, negotiator.id);
                        toggleNegotiatorDropdown(deal.id, false);
                      }}
                    >
                      {negotiator.name}
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ),
        },
        {
          Component: () =>
            deal.onboardingComplete?.toLowerCase() === "yes" ? (
              <Check className="text-green-500" />
            ) : (
              <X className="text-red-500" />
            ),
        },
        dateFormat(deal.datePaid),
      ])}
      sortConfig={sortConfig}
      setSortConfig={setSortConfig}
      sortData={sortData}
    />
  );
};

export default Manager;
