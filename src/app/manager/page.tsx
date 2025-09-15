"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import {
  mapNegotiationsToTeam,
  sortDataHelper,
} from "@/lib/helpers/negotiation";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";
import { TailwindPlusTable } from "@/components/tailwind-plus/table";
import { TeamHeader } from "@/components/base/header";
import { DealNegotiatorDropdown } from "@/components/Team/deal-negotiator-dropdown";
import { updateDealNegotiator } from "@/lib/helpers/dealCoordinator";
import { StageButton } from "@/components/Team/stage-button";
import { MakeButton } from "@/components/Team/make-button";
import { StageDropdown } from "@/components/Team/stage-dropdown";
import { ClientProfile } from "@/components/Team/profile/client-profile";
import { DEFAULT_SORTED_COLUMN } from "@/lib/constants/negotiations";
import { useDealNegotiators } from "@/hooks/useDealNegotiators";
import { useNegotiations } from "@/hooks/useNegotiations";
import Link from "next/link";

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
  const [unpaidExpanded, setUnpaidExpanded] = useState<boolean>(true);
  const router = useRouter();
  const [userData, setUserData] = useState<IUser>();
  const [sortConfig, setSortConfig] = useState({
    key: DEFAULT_SORTED_COLUMN, // default sorting by Submitted Date
    direction: "ascending", // default direction
  });

  const [openNegotiatorState, setOpenNegotiatorState] = useState<
    Record<string, boolean>
  >({});
  const [dealsWithoutCoordinator, setDealsWithoutCoordinator] = useState<
    NegotiationDataType[]
  >([]);
  const { dealNegotiators: allDealNegotiator } = useDealNegotiators();
  const teamFromTeamDashboard = allDealNegotiator;

  // const {
  //   negotiations: negotiationsFromTeamDashboard,
  //   refetch,
  //   isLoading,
  //   team: teamFromTeamDashboard,
  // } = useNegotiations({
  //   all: true,
  // });

  const [loading, setLoading] = useState(false);
  const configToPass = useMemo(
    () => ({
      all: true,
    }),
    []
  );
  const {
    // allDealNegotiator,
    // setFilteredDeals,
    // setOriginalDeals,
    // negotiatorData,
    negotiations: negotiationsFromTeamDashboard,
    // team: teamFromTeamDashboard,
    refetch,
  } = useTeamDashboard(configToPass);

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
  }, [negotiationsFromTeamDashboard, teamFromTeamDashboard]);

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

  const toggleNegotiatorDropdown = (id: string, isOpen: boolean) => {
    setOpenNegotiatorState((prev) => ({
      ...prev,
      [id]: isOpen,
    }));
  };

  const sortData = (key: string, direction: string) => {
    setSortConfig((prevConfig) => {
      const sortedTeams = [...teamData].map((team) => {
        const sortedNegotiations = sortDataHelper(team.negotiations ?? [])(
          key,
          direction
        );

        return { ...team, negotiations: sortedNegotiations };
      });

      setTeamData(sortedTeams);

      return { key, direction: direction };
    });
  };

  const sortWithoutCoordinatorData = (key: string, direction: string) => {
    setSortConfig((prevConfig) => {
      const sortedNegotiations = sortDataHelper(dealsWithoutCoordinator)(
        key,
        direction
      );

      setDealsWithoutCoordinator(sortedNegotiations as NegotiationDataType[]);

      return { key, direction: direction };
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
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setUnpaidExpanded(!unpaidExpanded)}
                        >
                          {unpaidExpanded ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
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

                    {unpaidExpanded && (
                      <TableRow>
                        <TableCell colSpan={2} className="p-0">
                          <div className="w-full px-5 overflow-x-auto">
                            <ManagerTable
                              deals={dealsWithoutCoordinator}
                              sortConfig={sortConfig}
                              setSortConfig={setSortConfig}
                              sortData={sortWithoutCoordinatorData}
                              openNegotiatorState={openNegotiatorState}
                              toggleNegotiatorDropdown={
                                toggleNegotiatorDropdown
                              }
                              updateDealNegotiator={(id, newNegotiatorId) =>
                                updateDealNegotiator(
                                  id,
                                  newNegotiatorId,
                                  refetch
                                )
                              }
                              allDealNegotiator={allDealNegotiator}
                              refetch={refetch}
                            />
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
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
                                updateDealNegotiator={(id, newNegotiatorId) =>
                                  updateDealNegotiator(
                                    id,
                                    newNegotiatorId,
                                    refetch
                                  )
                                }
                                allDealNegotiator={allDealNegotiator}
                                refetch={refetch}
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
  refetch,
}: {
  deals: NegotiationDataType[];
  sortConfig: { key: string; direction: string };
  setSortConfig: (config: { key: string; direction: string }) => void;
  sortData: (key: string, direction: string) => void;
  openNegotiatorState: Record<string, boolean>;
  toggleNegotiatorDropdown: (id: string, isOpen: boolean) => void;
  updateDealNegotiator: (id: string, newNegotiatorId: string) => void;
  allDealNegotiator: DealNegotiatorType[];
  refetch: () => void;
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
        {
          Component: () => (
            <Link
              href={`/team-profile?id=${deal.id}`}
              className="text-blue-700"
            >
              {deal.clientNamefull}
            </Link>
          ),
          config: {
            expandable: true,
            expandedComponent: () => <ClientProfile negotiationId={deal.id} />,
            expandedSize: "full",
          },
        },
        {
          Component: () => <MakeButton make={deal.brand} />,
        },
        deal.model,
        {
          Component: () => (
            <StageDropdown
              deal={deal}
              setNegotiation={(negotiation) => {
                refetch();
              }}
            />
          ),
        },
        deal.zip,
        {
          Component: () => (
            <DealNegotiatorDropdown
              deal={deal}
              allDealNegotiator={allDealNegotiator}
              updateDealNegotiator={updateDealNegotiator}
            />
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
