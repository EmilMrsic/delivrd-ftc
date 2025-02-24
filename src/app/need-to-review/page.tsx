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
  dateFormat,
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
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import ClientDetailsPopup from "@/components/Team/team-detail-popup";
import TeamClientDetailsPopup from "@/components/Team/team-client-detail-popup";
import { statuses } from "@/components/Team/filter-popup";

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
    field: "consult_notes",
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
  const [teamData, setTeamData] = useState<TeamDataType[]>([]);
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
  const [selectedDeal, setSelectedDeal] = useState<NegotiationData | null>(
    null
  );
  const [isOpen, setIsOpen] = useState<boolean>(false);

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
                  (negotiation: any) =>
                    negotiation.negotiations_Status.trim() === "Needs To Review"
                )
            );
          }
        }

        teamMember.negotiations = negotiations;
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

  const updateDealNegotiator = async (id: string, newNegotiatorId: string) => {
    try {
      const dealRef = doc(db, "negotiations", id);
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
        negotiations_deal_coordinator: newNegotiatorId ?? "",
      });

      await updateDoc(negotiatorRef, {
        active_deals: arrayUnion(id),
      });

      if (oldNegotiatorId) {
        const oldNegotiatorRef = doc(db, "team delivrd", oldNegotiatorId);
        await updateDoc(oldNegotiatorRef, {
          active_deals: arrayRemove(id),
        });
      }

      setFilteredDeals((prevDeals) =>
        prevDeals?.map((deal) =>
          deal.id === id
            ? { ...deal, negotiations_deal_coordinator: newNegotiatorId }
            : deal
        )
      );
      setDealsWithoutCoordinator((prevDeals) =>
        prevDeals?.filter((deal) => deal.id !== id)
      );

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

      setOriginalDeals((prevDeals) =>
        prevDeals?.map((deal) =>
          deal.id === id
            ? { ...deal, negotiations_deal_coordinator: newNegotiatorId }
            : deal
        )
      );

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

  const toggleDealNegotiatorDropdown = (id: string, isOpen: boolean) => {
    setOpenDealerNegotiatorState((prev) => ({
      ...prev,
      [id]: isOpen,
    }));
  };

  useEffect(() => {
    fetchTeamAndDeals();
    getReviewDealsWithoutCoordinator().then((res) =>
      setDealsWithoutCoordinator(res as NegotiationData[])
    );
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSelectedDeal(null);
    }
  }, [isOpen]);

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
      <div className="w-full overflow-x-auto ">
        <Table>
          {loading ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={8} className="text-center py-4">
                  <Loader />
                </TableCell>
              </TableRow>
            </TableBody>
          ) : teamData.length > 0 || dealsWithoutCoordinator.length > 0 ? (
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
                        <div className="w-full px-5 overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-left px-4 py-2 border-r">
                                  #
                                </TableHead>
                                <TableHead className="text-left px-4 py-2 border-r">
                                  Client
                                </TableHead>
                                <TableHead className="text-left px-4 py-2 border-r">
                                  Make
                                </TableHead>
                                <TableHead className="text-left px-4 py-2 border-r">
                                  Model
                                </TableHead>
                                <TableHead className="text-left px-4 py-2 border-r">
                                  Deal Negotiator
                                </TableHead>

                                <TableHead className="text-left px-4 py-2 border-r">
                                  Stage
                                </TableHead>
                                <TableHead className="text-left px-4 py-2 border-r">
                                  Phone Number
                                </TableHead>
                                <TableHead className="text-left px-4 py-2 border-r">
                                  Email
                                </TableHead>
                                <TableHead className="text-left px-4 py-2 border-r">
                                  Zip Code
                                </TableHead>
                                <TableHead className="text-left px-4 py-2 border-r">
                                  Trim Package
                                </TableHead>
                                <TableHead className="text-left px-4 py-2 border-r">
                                  Consult Notes
                                </TableHead>
                                <TableHead className="text-left px-4 py-2 border-r">
                                  Drivetrain
                                </TableHead>
                                <TableHead className="text-left px-4 py-2 border-r">
                                  Exterior Deal Breaker
                                </TableHead>
                                <TableHead className="text-left px-4 py-2 border-r">
                                  Exterior Preffered
                                </TableHead>
                                <TableHead className="text-left px-4 py-2 border-r">
                                  Interior Deal Breaker
                                </TableHead>
                                <TableHead className="text-left px-4 py-2 border-r">
                                  Interior Preffered
                                </TableHead>
                                <TableHead className="text-left px-4 py-2">
                                  Date Paid
                                </TableHead>
                              </TableRow>
                            </TableHeader>

                            <TableBody>
                              {dealsWithoutCoordinator.map((deal, index) => (
                                <TableRow
                                  key={deal.id}
                                  className={`cursor-pointer bg-white hover:bg-gray-100 `}
                                >
                                  <TableCell className="px-4 relative py-2 border-r">
                                    <Link href={`/team-profile?id=${deal.id}`}>
                                      <span>{index + 1}</span>
                                    </Link>
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
                                    <span>{deal.negotiations_Client}</span>
                                  </TableCell>
                                  <TableCell className="px-4 py-2 border-r">
                                    {deal.negotiations_Brand}
                                  </TableCell>
                                  <TableCell className="px-4 py-2 border-r">
                                    {deal.negotiations_Model}
                                  </TableCell>
                                  <TableCell className="px-4 py-2 border-r">
                                    <DropdownMenu
                                      open={
                                        openNegotiatorState[deal.id] || false
                                      }
                                      onOpenChange={(isOpen) =>
                                        toggleNegotiatorDropdown(
                                          deal.id,
                                          isOpen
                                        )
                                      }
                                    >
                                      <DropdownMenuTrigger asChild>
                                        <Button
                                          variant="outline"
                                          className={`cursor-pointer p-1 w-fit h-fit text-xs bg-gray-100 text-gray-800 border-gray-300`}
                                        >
                                          {allDealNegotiator.some(
                                            (negotiator) =>
                                              negotiator.id ===
                                              deal.negotiations_deal_coordinator
                                          ) ? (
                                            <p>
                                              {
                                                allDealNegotiator.find(
                                                  (negotiator) =>
                                                    negotiator.id ===
                                                    deal.negotiations_deal_coordinator
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
                                          (
                                            negotiator: DealNegotiator,
                                            index
                                          ) => (
                                            <DropdownMenuItem
                                              key={index}
                                              onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                updateDealNegotiator(
                                                  deal.id,
                                                  negotiator.id
                                                );
                                                toggleNegotiatorDropdown(
                                                  deal.id,
                                                  false
                                                );
                                              }}
                                            >
                                              {negotiator.name}
                                            </DropdownMenuItem>
                                          )
                                        )}
                                      </DropdownMenuContent>
                                    </DropdownMenu>
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
                                        ).textColor, // Set dynamic text color
                                      }}
                                      className="cursor-pointer p-1 w-fit h-fit text-xs border-gray-300"
                                    >
                                      <p>{deal.negotiations_Status}</p>
                                    </Button>
                                  </TableCell>
                                  <TableCell className="px-4 py-2 border-r">
                                    {deal.negotiations_Phone}
                                  </TableCell>
                                  <TableCell className="px-4 py-2 border-r">
                                    {deal.negotiations_Email}
                                  </TableCell>
                                  <TableCell className="px-4 py-2 border-r">
                                    {deal.negotiations_Zip_Code}
                                  </TableCell>
                                  <TableCell className="px-4 relative max-w-[100px] truncate py-2 border-r">
                                    {deal?.negotiations_Trim_Package_Options &&
                                    deal?.negotiations_Trim_Package_Options
                                      ?.length > 50
                                      ? `${deal?.negotiations_Trim_Package_Options?.substring(
                                          0,
                                          50
                                        )}...`
                                      : deal.negotiations_Trim_Package_Options}
                                    <button
                                      onClick={() =>
                                        setTrimDetails({
                                          id: deal.id,
                                          trim:
                                            deal.negotiations_Trim_Package_Options ??
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
                                    </button>{" "}
                                  </TableCell>
                                  <TableCell className="px-4 relative max-w-[100px] truncate py-2 border-r">
                                    {deal?.consult_notes?.length > 50
                                      ? `${deal?.consult_notes?.substring(
                                          0,
                                          50
                                        )}...`
                                      : deal.consult_notes}
                                    <button
                                      onClick={() =>
                                        setExpandedNote({
                                          id: deal.id,
                                          note: deal.consult_notes,
                                        })
                                      }
                                      className="absolute top-[5px] right-[10px] transform  text-gray-500 hover:text-gray-700"
                                      title="Expand"
                                    >
                                      <Expand
                                        size={16}
                                        className="text-gray-500 hover:text-gray-700"
                                      />
                                    </button>{" "}
                                  </TableCell>
                                  <TableCell className="px-4 py-2 border-r">
                                    {deal.negotiations_Drivetrain}
                                  </TableCell>
                                  <TableCell className="px-4 py-2 border-r">
                                    {
                                      deal.negotiations_Color_Options
                                        .exterior_deal_breakers
                                    }
                                  </TableCell>
                                  <TableCell className="px-4 py-2 border-r">
                                    {
                                      deal.negotiations_Color_Options
                                        .exterior_preferred
                                    }
                                  </TableCell>
                                  <TableCell className="px-4 py-2 border-r">
                                    {
                                      deal.negotiations_Color_Options
                                        .interior_deal_breaker
                                    }
                                  </TableCell>
                                  <TableCell className="px-4 py-2 border-r">
                                    {
                                      deal.negotiations_Color_Options
                                        .interior_preferred
                                    }
                                  </TableCell>

                                  <TableCell className="px-4 py-2 border-r">
                                    <div>{dateFormat(deal.date_paid)}</div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
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
                              No of Deals: {team.negotiations.length}
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                      {expandedRows.has(team.id) && (
                        <TableRow>
                          <TableCell colSpan={2} className="p-0">
                            <div className="w-full px-5 overflow-x-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead className="text-left px-4 py-2 border-r">
                                      #
                                    </TableHead>
                                    <TableHead className="text-left px-4 py-2 border-r">
                                      Client
                                    </TableHead>
                                    <TableHead className="text-left px-4 py-2 border-r">
                                      Make
                                    </TableHead>
                                    <TableHead className="text-left px-4 py-2 border-r">
                                      Model
                                    </TableHead>
                                    <TableHead className="text-left px-4 py-2 border-r">
                                      Deal Negotiator
                                    </TableHead>

                                    <TableHead className="text-left px-4 py-2 border-r">
                                      Stage
                                    </TableHead>
                                    <TableHead className="text-left px-4 py-2 border-r">
                                      Phone Number
                                    </TableHead>
                                    <TableHead className="text-left px-4 py-2 border-r">
                                      Email
                                    </TableHead>
                                    <TableHead className="text-left px-4 py-2 border-r">
                                      Zip Code
                                    </TableHead>
                                    <TableHead className="text-left px-4 py-2 border-r">
                                      Trim Package
                                    </TableHead>
                                    <TableHead className="text-left px-4 py-2 border-r">
                                      Consult Notes
                                    </TableHead>
                                    <TableHead className="text-left px-4 py-2 border-r">
                                      Drivetrain
                                    </TableHead>
                                    <TableHead className="text-left px-4 py-2 border-r">
                                      Exterior Deal Breaker
                                    </TableHead>
                                    <TableHead className="text-left px-4 py-2 border-r">
                                      Exterior Preffered
                                    </TableHead>
                                    <TableHead className="text-left px-4 py-2 border-r">
                                      Interior Deal Breaker
                                    </TableHead>
                                    <TableHead className="text-left px-4 py-2 border-r">
                                      Interior Preffered
                                    </TableHead>
                                    <TableHead className="text-left px-4 py-2">
                                      Date Paid
                                    </TableHead>
                                  </TableRow>
                                </TableHeader>

                                <TableBody>
                                  {team.negotiations.map((deal, index) => (
                                    <TableRow
                                      key={deal.id}
                                      className={`cursor-pointer bg-white hover:bg-gray-100 `}
                                    >
                                      <TableCell className="px-4 relative py-2 border-r">
                                        <Link
                                          href={`/team-profile?id=${deal.id}`}
                                        >
                                          <span>{index + 1}</span>
                                        </Link>
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
                                        <span>{deal.negotiations_Client}</span>
                                      </TableCell>
                                      <TableCell className="px-4 py-2 border-r">
                                        {deal.negotiations_Brand}
                                      </TableCell>
                                      <TableCell className="px-4 py-2 border-r">
                                        {deal.negotiations_Model}
                                      </TableCell>
                                      <TableCell className="px-4 py-2 border-r">
                                        <DropdownMenu
                                          open={
                                            openDealerNegotiatorState[
                                              deal.id
                                            ] || false
                                          }
                                          onOpenChange={(isOpen) =>
                                            toggleDealNegotiatorDropdown(
                                              deal.id,
                                              isOpen
                                            )
                                          }
                                        >
                                          <DropdownMenuTrigger asChild>
                                            <Button
                                              variant="outline"
                                              className={`cursor-pointer p-1 w-fit h-fit text-xs bg-gray-100 text-gray-800 border-gray-300`}
                                            >
                                              {allDealNegotiator.some(
                                                (negotiator) =>
                                                  negotiator.id ===
                                                  deal.negotiations_deal_coordinator
                                              ) ? (
                                                <p>
                                                  {
                                                    allDealNegotiator.find(
                                                      (negotiator) =>
                                                        negotiator.id ===
                                                        deal.negotiations_deal_coordinator
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
                                              (
                                                negotiator: DealNegotiator,
                                                index
                                              ) => (
                                                <DropdownMenuItem
                                                  key={index}
                                                  onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    updateDealNegotiator(
                                                      deal.id,
                                                      negotiator.id
                                                    );
                                                    toggleNegotiatorDropdown(
                                                      deal.id,
                                                      false
                                                    );
                                                  }}
                                                >
                                                  {negotiator.name}
                                                </DropdownMenuItem>
                                              )
                                            )}
                                          </DropdownMenuContent>
                                        </DropdownMenu>
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
                                            ).textColor, // Set dynamic text color
                                          }}
                                          className="cursor-pointer p-1 w-fit h-fit text-xs border-gray-300"
                                        >
                                          <p>{deal.negotiations_Status}</p>
                                        </Button>
                                      </TableCell>
                                      <TableCell className="px-4 py-2 border-r">
                                        {deal.negotiations_Phone}
                                      </TableCell>
                                      <TableCell className="px-4 py-2 border-r">
                                        {deal.negotiations_Email}
                                      </TableCell>
                                      <TableCell className="px-4 py-2 border-r">
                                        {deal.negotiations_Zip_Code}
                                      </TableCell>
                                      <TableCell className="px-4 relative max-w-[100px] truncate py-2 border-r">
                                        {deal?.negotiations_Trim_Package_Options &&
                                        deal?.negotiations_Trim_Package_Options
                                          ?.length > 50
                                          ? `${deal?.negotiations_Trim_Package_Options?.substring(
                                              0,
                                              50
                                            )}...`
                                          : deal.negotiations_Trim_Package_Options}
                                        <button
                                          onClick={() =>
                                            setTrimDetails({
                                              id: deal.id,
                                              trim:
                                                deal.negotiations_Trim_Package_Options ??
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
                                        </button>{" "}
                                      </TableCell>
                                      <TableCell className="px-4 relative max-w-[100px] truncate py-2 border-r">
                                        {deal?.consult_notes?.length > 50
                                          ? `${deal?.consult_notes?.substring(
                                              0,
                                              50
                                            )}...`
                                          : deal.consult_notes}
                                        <button
                                          onClick={() =>
                                            setExpandedNote({
                                              id: deal.id,
                                              note: deal.consult_notes,
                                            })
                                          }
                                          className="absolute top-[5px] right-[10px] transform  text-gray-500 hover:text-gray-700"
                                          title="Expand"
                                        >
                                          <Expand
                                            size={16}
                                            className="text-gray-500 hover:text-gray-700"
                                          />
                                        </button>{" "}
                                      </TableCell>
                                      <TableCell className="px-4 py-2 border-r">
                                        {deal.negotiations_Drivetrain}
                                      </TableCell>
                                      <TableCell className="px-4 py-2 border-r">
                                        {
                                          deal.negotiations_Color_Options
                                            .exterior_deal_breakers
                                        }
                                      </TableCell>
                                      <TableCell className="px-4 py-2 border-r">
                                        {
                                          deal.negotiations_Color_Options
                                            .exterior_preferred
                                        }
                                      </TableCell>
                                      <TableCell className="px-4 py-2 border-r">
                                        {
                                          deal.negotiations_Color_Options
                                            .interior_deal_breaker
                                        }
                                      </TableCell>
                                      <TableCell className="px-4 py-2 border-r">
                                        {
                                          deal.negotiations_Color_Options
                                            .interior_preferred
                                        }
                                      </TableCell>

                                      <TableCell className="px-4 py-2 border-r">
                                        <div>{dateFormat(deal.date_paid)}</div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
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
        {selectedDeal && (
          <TeamClientDetailsPopup
            setTeamData={setTeamData}
            open={isOpen}
            onClose={() => setIsOpen(false)}
            deal={selectedDeal}
            fields={fields as any}
          />
        )}
      </div>
    </>
  );
}

export default NeedToReview;
