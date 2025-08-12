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
import {
  Car,
  Check,
  ChevronDown,
  ChevronRight,
  Expand,
  MapPin,
  StickyNote,
  User,
  X,
} from "lucide-react";
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
  getDealsWithoutCoordinator,
  getReviewDealsWithoutCoordinator,
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
import { TailwindPlusTable } from "@/components/tailwind-plus/table";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";
import { TeamHeader } from "@/components/base/header";
import { TeamDashboardViewSelector } from "@/components/Team/dashboard/team-dashboard-view-selector";
import { mapNegotiationsToTeam } from "@/lib/helpers/negotiation";
import { dateFormat } from "@/lib/helpers/dates";
import { DEFAULT_SORTED_COLUMN } from "@/lib/constants/negotiations";

// type TeamDataType = {
//   activeDeals: string[];
//   deals: string[];
//   email: string;
//   id: string;
//   name: string;
//   profile_pic: string;
//   role: string;
//   video_link: string;
//   negotiations: NegotiationData[];
// };

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
  { label: "Email", field: "negotiations_Email" },
  { label: "Phone Numbe", field: "negotiations_Phone" },
  { label: "Deal Negotiator", field: "negotiations_deal_coordinator" },

  { label: "Status", field: "negotiations_Status" },
  { label: "Brand", field: "negotiations_Brand" },
  {
    label: "Client Consult Notes",
    field: "consultNotes",
    icon: <StickyNote size={14} />,
    type: "textarea",
  },
  {
    label: "Trim Package",
    field: "negotiations_Trim_Package_Options",
  },
  {
    label: "Drivetrain",
    field: "negotiations_Drivetrain",
  },
];

function NeedToReview() {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [teamData, setTeamData] = useState<DealNegotiatorType[]>([]);
  const router = useRouter();
  const [userData, setUserData] = useState<IUser>();
  const [expandedNote, setExpandedNote] = useState<{
    id: string;
    note: string;
  } | null>(null);

  const [trimDetails, setTrimDetails] = useState<{
    id: string;
    trim: string;
  } | null>(null);

  const [openNegotiatorState, setOpenNegotiatorState] = useState<
    Record<string, boolean>
  >({});
  const [openDealerNegotiatorState, setOpenDealerNegotiatorState] = useState<
    Record<string, boolean>
  >({});
  const [selectedDeal, setSelectedDeal] = useState<NegotiationDataType | null>(
    null
  );
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const [dealsWithoutCoordinator, setDealsWithoutCoordinator] = useState<
    NegotiationDataType[]
  >([]);
  const [loading, setLoading] = useState(false);
  const {
    allDealNegotiator,
    // setFilteredDeals,
    // setOriginalDeals,
    negotiatorData,
    negotiations,
    team,
    refetch,
  } = useTeamDashboard({
    all: true,
    filter: {
      stage: "Needs To Review",
    },
  });

  const [sortConfig, setSortConfig] = useState({
    key: DEFAULT_SORTED_COLUMN, // default sorting by Submitted Date
    direction: "ascending", // default direction
  });

  const sortData = (key: string, direction: string) => {
    setSortConfig((prevConfig) => {
      const sortedTeams = [...teamData].map((team) => {
        const sortableNegotiations = team?.negotiations ?? [];
        const sortedNegotiations = sortableNegotiations.sort(
          (a: any, b: any) => {
            let aValue = a[key];
            let bValue = b[key];

            if (typeof aValue === "string") aValue = aValue.toLowerCase();
            if (typeof bValue === "string") bValue = bValue.toLowerCase();

            if (aValue == null) return direction === "ascending" ? 1 : -1;
            if (bValue == null) return direction === "ascending" ? -1 : 1;

            if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
              return direction === "ascending"
                ? Number(aValue) - Number(bValue)
                : Number(bValue) - Number(aValue);
            }

            if (aValue < bValue) return direction === "ascending" ? -1 : 1;
            if (aValue > bValue) return direction === "ascending" ? 1 : -1;
            return 0;
          }
        );

        return { ...team, negotiations: sortedNegotiations };
      });

      setTeamData(sortedTeams);

      return { key, direction };
    });
  };

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

  // const fetchTeamAndDeals = async () => {
  //   try {
  //     setLoading(true);
  //     const teamQuery = collection(db, "team delivrd");
  //     const teamSnapshot = await getDocs(teamQuery);

  //     let teamsWithDeals = [];

  //     for (const teamDoc of teamSnapshot.docs) {
  //       const teamMember: any = { id: teamDoc.id, ...teamDoc.data() };
  //       const activeDeals = teamMember.active_deals?.filter(Boolean) || [];

  //       let negotiations = [];

  //       if (activeDeals.length > 0) {
  //         const chunkedDeals = [];
  //         for (let i = 0; i < activeDeals.length; i += 30) {
  //           const chunk = activeDeals.slice(i, i + 30).filter(Boolean);
  //           if (chunk.length > 0) chunkedDeals.push(chunk);
  //         }

  //         for (const chunk of chunkedDeals) {
  //           const negotiationsQuery = query(
  //             collection(db, "negotiations"),
  //             where("__name__", "in", chunk)
  //           );
  //           const negotiationsSnapshot = await getDocs(negotiationsQuery);
  //           negotiations.push(
  //             ...negotiationsSnapshot.docs
  //               .map((doc) => ({
  //                 id: doc.id,
  //                 ...doc.data(),
  //               }))
  //               .filter(
  //                 (negotiation: any) =>
  //                   negotiation.negotiations_Status.trim() === "Needs To Review"
  //               )
  //           );
  //         }
  //       }

  //       teamMember.negotiations = negotiations;
  //       teamsWithDeals.push(teamMember);
  //     }
  //     setLoading(false);
  //     setTeamData(teamsWithDeals);
  //   } catch (error) {
  //     setLoading(false);
  //     console.error("Error fetching data:", error);
  //   }
  // };

  useEffect(() => {
    if (negotiations) {
      const { team: teamWithNegotiations, dealsWithoutCoordinator } =
        mapNegotiationsToTeam(negotiations, team);

      setTeamData(teamWithNegotiations);
      setDealsWithoutCoordinator(dealsWithoutCoordinator);
      setLoading(false);
    }
  }, [negotiations]);

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
      const dealSnap = await getDoc(dealRef);
      if (!dealSnap.exists()) {
        throw new Error("Deal not found");
      }

      const oldNegotiatorId = dealSnap.data().negotiations_deal_coordinator;
      const negotiatorRef = doc(db, "team delivrd", newNegotiatorId);

      const movedDeal = dealsWithoutCoordinator?.find((deal) => deal.id === id);
      if (!movedDeal)
        return console.error("Deal not found in unassigned deals");

      await updateDoc(dealRef, {
        dealCoordinatorId: newNegotiatorId ?? "",
      });

      // await updateDoc(negotiatorRef, {
      //   active_deals: arrayUnion(id),
      // });

      if (oldNegotiatorId) {
        const oldNegotiatorRef = doc(db, "team delivrd", oldNegotiatorId);
        // await updateDoc(oldNegotiatorRef, {
        //   active_deals: arrayRemove(id),
        // });
      }

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

      refetch();

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

      toast({ title: "Negotiator updated successfully" });
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

  const toggleDealNegotiatorDropdown = (id: string, isOpen: boolean) => {
    setOpenDealerNegotiatorState((prev) => ({
      ...prev,
      [id]: isOpen,
    }));
  };

  // useEffect(() => {
  //   setDealsWithoutCoordinator(negotiations);
  // }, [negotiations]);

  useEffect(() => {
    if (!isOpen) {
      setSelectedDeal(null);
    }
  }, [isOpen]);

  return (
    <>
      <div className="container mx-auto p-4 space-y-6 min-h-screen">
        <TeamHeader />
        <TeamDashboardViewSelector />
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
                  <>
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
                        <ReviewTable
                          negotiations={dealsWithoutCoordinator}
                          allDealNegotiator={allDealNegotiator}
                          openDealerNegotiatorState={openDealerNegotiatorState}
                          toggleDealNegotiatorDropdown={
                            toggleDealNegotiatorDropdown
                          }
                          updateDealNegotiator={updateDealNegotiator}
                          toggleNegotiatorDropdown={toggleNegotiatorDropdown}
                          sortConfig={sortConfig}
                          setSortConfig={setSortConfig}
                          sortData={sortData}
                        />
                      </TableCell>
                    </TableRow>
                  </>
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
                    <>
                      <TableRow
                        className="border border-gray-300 rounded-lg"
                        key={team.id}
                      >
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
                              No of Deals: {team?.negotiations?.length ?? 0}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(team.id) && (
                        <TableRow>
                          <TableCell colSpan={2} className="p-0">
                            <ReviewTable
                              negotiations={team?.negotiations ?? []}
                              allDealNegotiator={allDealNegotiator}
                              openDealerNegotiatorState={
                                openDealerNegotiatorState
                              }
                              toggleDealNegotiatorDropdown={
                                toggleDealNegotiatorDropdown
                              }
                              updateDealNegotiator={updateDealNegotiator}
                              toggleNegotiatorDropdown={
                                toggleNegotiatorDropdown
                              }
                              sortConfig={sortConfig}
                              setSortConfig={setSortConfig}
                              sortData={sortData}
                            />
                          </TableCell>
                        </TableRow>
                      )}
                    </>
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
        {expandedNote && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-4">
              <h2 className="text-lg font-semibold mb-2">Consult Note</h2>
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
      </div>
    </>
  );
}

const ReviewTable = ({
  negotiations,
  allDealNegotiator,
  openDealerNegotiatorState,
  toggleDealNegotiatorDropdown,
  updateDealNegotiator,
  toggleNegotiatorDropdown,
  sortConfig,
  setSortConfig,
  sortData,
}: {
  negotiations: NegotiationDataType[];
  allDealNegotiator: DealNegotiatorType[];
  openDealerNegotiatorState: Record<string, boolean>;
  toggleDealNegotiatorDropdown: (id: string, isOpen: boolean) => void;
  updateDealNegotiator: (id: string, newNegotiatorId: string) => void;
  toggleNegotiatorDropdown: (id: string, isOpen: boolean) => void;
  sortConfig: {
    key: string;
    direction: string;
  };
  setSortConfig: (config: { key: string; direction: string }) => void;
  sortData: (key: string, direction: string) => void;
}) => {
  return (
    <TailwindPlusTable
      headers={[
        {
          header: "#",
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
          header: "Deal Negotiator",
          config: {
            sortable: true,
            key: "dealCoordinatorId",
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
          header: "Zip Code",
          config: {
            sortable: true,
            key: "zip",
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
            key: "consultNotes",
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
            key: "excludedInterior",
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
      rows={(negotiations ?? [])?.map((deal, index) => [
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
          text: deal.brand,
        },
        {
          text: deal.model,
        },
        {
          Component: () => (
            <DropdownMenu
              open={openDealerNegotiatorState[deal.id] || false}
              onOpenChange={(isOpen) =>
                toggleDealNegotiatorDropdown(deal.id, isOpen)
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
        {
          text: deal.clientPhone,
        },
        {
          text: deal.clientEmail,
        },
        {
          text: deal.zip,
        },
        {
          text: deal.trim?.substring(0, 50) || "",
          config: {
            expandable: typeof deal.trim === "string" && deal.trim?.length > 50,
            expandedComponent: () => <p>{deal.trim}</p>,
          },
        },
        {
          text: deal?.consultNotes?.substring(0, 50) || "",
          config: {
            expandable:
              typeof deal.consultNotes === "string" &&
              deal.consultNotes.length > 50,
            expandedComponent: () => <p>{deal.consultNotes}</p>,
          },
        },
        {
          text: deal.drivetrain,
        },
        {
          text: deal.excludedExterior,
        },
        {
          text: deal.desiredExterior,
        },
        {
          text: deal.excludedInterior,
        },
        {
          text: deal.desiredInterior,
        },
        {
          text: dateFormat(deal.datePaid),
        },
      ])}
      sortConfig={sortConfig}
      setSortConfig={setSortConfig}
      sortData={sortData}
    />
  );
};

export default NeedToReview;
