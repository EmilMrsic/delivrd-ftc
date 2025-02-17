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
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase/config";
import { NegotiationData } from "@/types";
import { dateFormat, getStatusColor } from "@/lib/utils";
import { Loader } from "@/components/base/loader";
import useTeamDashboard from "@/hooks/useTeamDashboard";

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
  const [loading, setLoading] = useState(false);
  const { allDealNegotiator } = useTeamDashboard();

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
    fetchTeamAndDeals();
  }, []);

  return (
    <>
      <div className="flex justify-between items-center bg-[#202125] p-6 mb-5 shadow-lg">
        <div className="flex flex-col items-start">
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
              Tabarak Sohail
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
          ) : teamData.length > 0 ? (
            <>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>Name</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamData.map((team) => (
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
                      <TableCell>{team.name}</TableCell>
                      <TableCell>{team.negotiations.length}</TableCell>
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
                                {team.negotiations.map((deal, index) => (
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
                                          backgroundColor: getStatusColor(
                                            deal?.negotiations_Status ?? ""
                                          ),
                                        }}
                                        className={`cursor-pointer p-1 w-fit h-fit text-xs  text-gray-800 border-gray-300`}
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
                                      )}{" "}
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
