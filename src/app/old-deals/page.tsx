"use client";
import { Loader } from "@/components/base/loader";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import useTeamDashboard from "@/hooks/useTeamDashboard";
import { fetchAllOldNegotiations, getStatusStyles } from "@/lib/utils";
import { DealNegotiator, NegotiationData } from "@/types";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

const OldDeals = () => {
  const router = useRouter();
  const { negotiatorData, allDealNegotiator } = useTeamDashboard();
  const [loading, setLoading] = useState<boolean>(false);
  const [negotiations, setNegotiations] = useState<NegotiationData[]>([]);

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
      <div className="m-5">
        <Table>
          <TableHeader className="max-w-[1000px] overflow-scroll">
            <TableRow>
              <TableHead></TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Make</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Stage</TableHead>
              <TableHead>Payment Date</TableHead>
              <TableHead>Start Date</TableHead>
              <TableHead>Deal Negotiator</TableHead>
              <TableHead>Trim Package</TableHead>
            </TableRow>
          </TableHeader>
          {loading ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={14} className="text-center py-4">
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
                    className={`cursor-pointer ${
                      index % 2 === 0
                        ? "bg-white hover:bg-gray-100"
                        : "bg-gray-50 hover:bg-gray-200"
                    }`}
                    key={deal.id}
                  >
                    <TableCell>{index + 1}</TableCell>
                    <TableCell className="font-medium max-w-[220px]">
                      <span>{deal.negotiations_Client}</span>
                    </TableCell>

                    <TableCell className="max-w-[180px]">
                      {deal.negotiations_Brand}
                    </TableCell>

                    <TableCell className="max-w-[120px]">
                      {deal.model_of_interest}
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

                    <TableCell>{deal.date_paid}</TableCell>
                    <TableCell>{deal.negotiations_Deal_Start_Date}</TableCell>

                    <TableCell>
                      {allDealNegotiator.some(
                        (negotiator) =>
                          negotiator.id === deal.negotiations_deal_coordinator
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
                    <TableCell className="max-w-[120px]">
                      {deal.negotiations_Trim_Package_Options}
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          ) : (
            <TableBody>
              <TableRow>
                <TableCell colSpan={13} className="text-center py-4">
                  <p>No Data Found</p>
                </TableCell>
              </TableRow>
            </TableBody>
          )}
        </Table>
      </div>
    </>
  );
};

export default OldDeals;
