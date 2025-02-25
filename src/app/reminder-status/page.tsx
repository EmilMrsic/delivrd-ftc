"use client";
import { Loader } from "@/components/base/loader";
import { statuses } from "@/components/Team/filter-popup";
import ClientDetailsPopup from "@/components/Team/team-detail-popup";
import { Button } from "@/components/ui/button";
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
import { fetchAllProposalSendNegotiations, getStatusStyles } from "@/lib/utils";
import { NegotiationData } from "@/types";
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
];

const ReminderStatus = () => {
  const router = useRouter();
  const { negotiatorData, allDealNegotiator } = useTeamDashboard();
  const [loading, setLoading] = useState<boolean>(false);
  const [negotiations, setNegotiations] = useState<NegotiationData[]>([]);

  const [selectedDeal, setSelectedDeal] = useState<NegotiationData | null>(
    null
  );
  const [isOpen, setIsOpen] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);
    fetchAllProposalSendNegotiations()
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
              <TableHead className="text-left px-4 py-2 border-r">
                Client
              </TableHead>

              <TableHead className="text-left px-4 py-2 border-r">
                Stage
              </TableHead>
              <TableHead className="text-left px-4 py-2 border-r">
                Invoice Status
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
              {negotiations.map((deal, index) => (
                <TableRow key={deal.id} className="hover:bg-gray-50 transition">
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
                  </TableCell>
                  <TableCell className="px-4 py-2 border-r">
                    <Button
                      variant="outline"
                      className="cursor-pointer p-1 w-fit h-fit text-xs rounded-full"
                    >
                      <p>{deal.negotiations_Invoice_Status}</p>
                    </Button>
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

export default ReminderStatus;
