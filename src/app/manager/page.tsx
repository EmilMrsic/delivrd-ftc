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
  const [teamData, setTeamData] = useState<TeamDataType[]>([]);
  const router = useRouter();
  const [userData, setUserData] = useState<IUser>();

  const [openNegotiatorState, setOpenNegotiatorState] = useState<
    Record<string, boolean>
  >({});
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
              ...negotiationsSnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
              }))
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
      const negotiatorRef = doc(db, "team delivrd", newNegotiatorId);
      const dealSnap = await getDoc(dealRef);
      if (!dealSnap.exists()) {
        throw new Error("Deal not found");
      }

      const oldNegotiatorId = dealSnap.data().negotiations_deal_coordinator;

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
  useEffect(() => {
    fetchTeamAndDeals();
    getDealsWithoutCoordinator().then((res) =>
      setDealsWithoutCoordinator(res as NegotiationData[])
    );
  }, []);

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
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Client</TableHead>
                                <TableHead>Make</TableHead>
                                <TableHead>Model</TableHead>
                                <TableHead>Stage</TableHead>
                                <TableHead>Zip Code</TableHead>
                                <TableHead>Deal Negotiator</TableHead>
                                <TableHead>Onboarding Complete</TableHead>
                                <TableHead>Date Paid</TableHead>
                              </TableRow>
                            </TableHeader>

                            <TableBody>
                              {dealsWithoutCoordinator.map((deal, index) => (
                                <TableRow
                                  key={deal.id}
                                  className={`cursor-pointer ${
                                    index % 2 === 0
                                      ? "bg-white hover:bg-gray-100"
                                      : "bg-gray-50 hover:bg-gray-200"
                                  }`}
                                >
                                  <TableCell className="font-medium max-w-[220px]">
                                    <span>{deal.negotiations_Client}</span>
                                  </TableCell>
                                  <TableCell className="max-w-[180px]">
                                    {deal.negotiations_Brand}
                                  </TableCell>
                                  <TableCell>
                                    {deal.negotiations_Model}
                                  </TableCell>
                                  <TableCell>
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
                                  <TableCell>
                                    {deal.negotiations_Zip_Code}
                                  </TableCell>
                                  <TableCell>
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
                                  </TableCell>{" "}
                                  <TableCell className="text-center">
                                    {deal.negotiations_Onboarding_Complete?.toLowerCase() ===
                                    "yes" ? (
                                      <Check className="text-green-500" />
                                    ) : (
                                      <X className="text-red-500" />
                                    )}
                                  </TableCell>
                                  <TableCell>
                                    <div>{dateFormat(deal.date_paid)}</div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
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
                                team.negotiations.filter(
                                  (item) =>
                                    item.negotiations_Status ===
                                      "Deal Started" ||
                                    item.negotiations_Status ===
                                      "Actively Negotiating" ||
                                    item.negotiations_Status === "Paid"
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
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Make</TableHead>
                                    <TableHead>Model</TableHead>
                                    <TableHead>Stage</TableHead>
                                    <TableHead>Zip Code</TableHead>
                                    <TableHead>Deal Negotiator</TableHead>
                                    <TableHead>Onboarding Complete</TableHead>
                                    <TableHead>Date Paid</TableHead>
                                  </TableRow>
                                </TableHeader>

                                <TableBody>
                                  {team.negotiations
                                    .filter(
                                      (item) =>
                                        item.negotiations_Status ===
                                          "Deal Started" ||
                                        item.negotiations_Status ===
                                          "Actively Negotiating" ||
                                        item.negotiations_Status === "Paid"
                                    )
                                    .map((deal, index) => (
                                      <TableRow
                                        key={deal.id}
                                        className={`cursor-pointer ${
                                          index % 2 === 0
                                            ? "bg-white hover:bg-gray-100"
                                            : "bg-gray-50 hover:bg-gray-200"
                                        }`}
                                      >
                                        <TableCell className="font-medium max-w-[220px]">
                                          <span>
                                            {deal.negotiations_Client}
                                          </span>
                                        </TableCell>
                                        <TableCell className="max-w-[180px]">
                                          {deal.negotiations_Brand}
                                        </TableCell>
                                        <TableCell>
                                          {deal.negotiations_Model}
                                        </TableCell>
                                        <TableCell>
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
                                        <TableCell>
                                          {deal.negotiations_Zip_Code}
                                        </TableCell>
                                        <TableCell>
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
                                        </TableCell>
                                        <TableCell className="text-center">
                                          {deal.negotiations_Onboarding_Complete?.toLowerCase() ===
                                          "yes" ? (
                                            <Check className="text-green-500" />
                                          ) : (
                                            <X className="text-red-500" />
                                          )}
                                        </TableCell>
                                        <TableCell>
                                          <div>
                                            {dateFormat(deal.date_paid)}
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    ))}
                                </TableBody>
                              </Table>
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
    </>
  );
}

export default Manager;
