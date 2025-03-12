"use client";
import { TeamDashboardViewHeader } from "@/components/base/header";
import { Loader } from "@/components/base/loader";
import { TailwindPlusTable } from "@/components/tailwind-plus/table";
import { TeamDashboardViewSelector } from "@/components/Team/dashboard/team-dashboard-view-selector";
import ClientDetailsPopup from "@/components/Team/team-detail-popup";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { sortDataHelper } from "@/lib/helpers/negotiation";
import { DealNegotiatorType } from "@/lib/models/team";
import { fetchAllPaidHoldingNegotiations, getStatusStyles } from "@/lib/utils";
import { DealNegotiator, NegotiationData } from "@/types";
import {
  Car,
  ChevronDown,
  Expand,
  MapPin,
  StickyNote,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

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
  { label: "Status", field: "negotiations_Status" },
  { label: "Deal Coordinator", field: "negotiations_deal_coordinator" },
  { label: "Brand", field: "negotiations_Brand" },
  {
    label: "Client Consult Notes",
    field: "consult_notes",
    icon: <StickyNote size={14} />,
    type: "textarea",
  },
  {
    label: "Vehicle of Interest",
    field: "vehicle_of_interest",
    icon: <Car size={14} />,
  },
  { label: "Model", field: "model_of_interest", icon: <Car size={14} /> },
];
const PaidHolding = () => {
  const { negotiatorData, allDealNegotiator } = useTeamDashboard();
  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [negotiations, setNegotiations] = useState<NegotiationData[]>([]);
  const [hoveredCell, setHoveredCell] = useState<string | null>(null);
  const [expandedNote, setExpandedNote] = useState<{
    id: string;
    note: string;
  } | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<NegotiationData | null>(
    null
  );
  const [sortConfig, setSortConfig] = useState({
    key: "submittedDate", // default sorting by Submitted Date
    direction: "ascending", // default direction
  });

  // const sortWithoutCoordinatorData = (key: string) => {
  //   setSortConfig((prevConfig) => {
  //     const newDirection =
  //       prevConfig.key === key && prevConfig.direction === "ascending"
  //         ? "descending"
  //         : "ascending";

  //     const sortedNegotiations = [...negotiations].sort((a: any, b: any) => {
  //       let aValue = a[key];
  //       let bValue = b[key];

  //       if (typeof aValue === "string") aValue = aValue.toLowerCase();
  //       if (typeof bValue === "string") bValue = bValue.toLowerCase();

  //       if (aValue == null) return newDirection === "ascending" ? 1 : -1;
  //       if (bValue == null) return newDirection === "ascending" ? -1 : 1;

  //       if (!isNaN(Number(aValue)) && !isNaN(Number(bValue))) {
  //         return newDirection === "ascending"
  //           ? Number(aValue) - Number(bValue)
  //           : Number(bValue) - Number(aValue);
  //       }

  //       if (aValue < bValue) return newDirection === "ascending" ? -1 : 1;
  //       if (aValue > bValue) return newDirection === "ascending" ? 1 : -1;
  //       return 0;
  //     });

  //     setNegotiations(sortedNegotiations);

  //     return { key, direction: newDirection };
  //   });
  // };

  useEffect(() => {
    setLoading(true);
    fetchAllPaidHoldingNegotiations()
      .then((res) => {
        setNegotiations(res);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setSelectedDeal(null);
    }
  }, [isOpen]);

  const sortData = sortDataHelper(setNegotiations, negotiations);

  return (
    <div className="container mx-auto p-4 space-y-6 min-h-screen">
      <TeamDashboardViewHeader
        negotiatorData={negotiatorData as DealNegotiatorType}
      />
      <TeamDashboardViewSelector />
      <Card className="bg-white shadow-lg">
        <TailwindPlusTable
          headers={[
            {
              header: "#",
              config: {
                size: 50,
              },
            },
            {
              header: "Client",
              config: {
                sortable: true,
                key: "negotiations_Client",
              },
            },
            {
              header: "Make",
              config: {
                sortable: true,
                key: "negotiations_Brand",
              },
            },
            {
              header: "Model",
              config: {
                sortable: true,
                key: "model_of_interest",
              },
            },
            {
              header: "Stage",
              config: {
                sortable: true,
                key: "negotiations_Status",
              },
            },
            {
              header: "Zip Code",
              config: {
                sortable: true,
                key: "negotiations_Zip_Code",
              },
            },
            {
              header: "Deal Negotiator",
              config: {
                sortable: true,
                key: "negotiations_deal_coordinator",
              },
            },
            {
              header: "Consult Notes",
              config: {
                sortable: true,
                key: "consult_notes",
              },
            },
            {
              header: "Vehicle of Interest",
              config: {
                sortable: true,
                key: "vehicle_of_interest",
              },
            },
            {
              header: "New or Used",
              config: {
                sortable: true,
                key: "negotiations_New_or_Used",
              },
            },
          ]}
          rows={negotiations.map((deal, idx) => [
            {
              text: idx + 1,
              config: {
                link: `/team-profile?id=${deal.id}`,
              },
            },
            {
              text: deal.negotiations_Client,
              config: {
                expandable: true,
                expandedComponent: ({ expanded, setExpanded }: any) => (
                  <ClientDetailsPopup
                    setNegotiations={setNegotiations}
                    open={expanded}
                    onClose={() => setExpanded(false)}
                    deal={deal}
                    fields={fields as any}
                  />
                ),
              },
            },
            deal.negotiations_Brand,
            deal.model_of_interest,
            {
              Component: () => (
                <Button
                  variant="outline"
                  style={{
                    backgroundColor: getStatusStyles(
                      deal?.negotiations_Status ?? ""
                    ).backgroundColor,
                    color: getStatusStyles(deal?.negotiations_Status ?? "")
                      .textColor, // Set dynamic text color
                  }}
                  className="cursor-pointer p-1 w-fit h-fit text-xs rounded-full"
                >
                  <p>{deal.negotiations_Status}</p>
                </Button>
              ),
            },
            deal.negotiations_Zip_Code,
            allDealNegotiator.find(
              (negotiator) =>
                negotiator.id === deal.negotiations_deal_coordinator
            )?.name || "Not Assigned",
            {
              text: deal?.consult_notes?.substring(0, 50) || "",
              config: {
                expandable: deal?.consult_notes?.length > 50,
                expandedComponent: () => (
                  <>
                    <h2 className="text-lg font-semibold mb-2">Consult Note</h2>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {deal.consult_notes}
                    </p>
                  </>
                ),
              },
            },
            deal.vehicle_of_interest,
            {
              Component: () =>
                deal?.negotiations_New_or_Used && (
                  <Button
                    variant="outline"
                    className={`cursor-pointer p-1 w-fit h-fit text-xs rounded-full ${
                      deal?.negotiations_New_or_Used === "New"
                        ? "bg-[#d1e2ff]"
                        : "bg-[#c4ecff]"
                    }`}
                  >
                    <p> {deal?.negotiations_New_or_Used ?? ""}</p>
                  </Button>
                ),
            },
          ])}
          sortConfig={sortConfig}
          setSortConfig={setSortConfig}
          sortData={sortData}
        />
      </Card>
    </div>
  );
};

// export const Test = () => {
//   return (
//     <Table className="min-w-full border-collapse">
//     <TableHeader className="sticky top-0 bg-gray-100 z-10 border-b border-gray-300">
//       <TableRow>
//         <TableHead className="text-left px-4 py-2 border-r">#</TableHead>
//         <TableHead
//           onClick={() =>
//             sortWithoutCoordinatorData("negotiations_Client")
//           }
//           className="text-left px-4 py-2 border-r"
//         >
//           Client
//         </TableHead>
//         <TableHead
//           onClick={() => sortWithoutCoordinatorData("negotiations_Brand")}
//           className="text-left px-4 py-2 border-r"
//         >
//           Make
//         </TableHead>
//         <TableHead
//           onClick={() => sortWithoutCoordinatorData("negotiations_Model")}
//           className="text-left px-4 py-2 border-r"
//         >
//           Model
//         </TableHead>
//         <TableHead className="text-left  px-4 py-2 border-r">
//           Stage
//         </TableHead>
//         <TableHead
//           onClick={() =>
//             sortWithoutCoordinatorData("negotiations_Zip_Code")
//           }
//           className="text-left px-4 py-2 border-r"
//         >
//           Zip Code
//         </TableHead>
//         <TableHead className="text-left px-4 py-2 border-r">
//           Deal Negotiator
//         </TableHead>
//         <TableHead className="text-left px-4 py-2 border-r">
//           Consult Notes
//         </TableHead>
//         <TableHead className="text-left px-4 py-2 border-r">
//           Vehicle of Interest
//         </TableHead>
//         <TableHead className="text-left px-4 py-2">New or Used</TableHead>
//       </TableRow>
//     </TableHeader>

//     {loading ? (
//       <TableBody>
//         <TableRow>
//           <TableCell colSpan={12} className="text-center py-4">
//             <Loader />
//           </TableCell>
//         </TableRow>
//       </TableBody>
//     ) : negotiations?.length ? (
//       <TableBody>
//         {negotiations.map((deal, index) => (
//           <TableRow key={deal.id} className="hover:bg-gray-50 transition">
//             <TableCell className="px-4 py-2 border-r">
//               <Link href={`/team-profile?id=${deal.id}`}>
//                 {index + 1}
//               </Link>
//             </TableCell>

//             <TableCell className="px-4 relative py-2 border-r">
//               {deal.negotiations_Client}
//               <Expand
//                 size={16}
//                 className="text-gray-500 absolute top-[5px] right-[10px] hover:text-gray-700 cursor-pointer"
//                 onClick={() => {
//                   setSelectedDeal(deal);
//                   setIsOpen(true);
//                 }}
//               />
//             </TableCell>

//             <TableCell className="px-4 py-2 border-r">
//               {deal.negotiations_Brand}
//             </TableCell>

//             <TableCell className="px-4 py-2 border-r">
//               {deal.model_of_interest}
//             </TableCell>

//             <TableCell className="px-4 py-2 border-r">
// <Button
//   variant="outline"
//   style={{
//     backgroundColor: getStatusStyles(
//       deal?.negotiations_Status ?? ""
//     ).backgroundColor,
//     color: getStatusStyles(deal?.negotiations_Status ?? "")
//       .textColor, // Set dynamic text color
//   }}
//   className="cursor-pointer p-1 w-fit h-fit text-xs rounded-full"
// >
//   <p>{deal.negotiations_Status}</p>
// </Button>
//             </TableCell>

//             <TableCell className="px-4 py-2 border-r">
//               {deal.negotiations_Zip_Code}
//             </TableCell>

//             <TableCell className="px-4 py-2 border-r">
// {allDealNegotiator.find(
//   (negotiator) =>
//     negotiator.id === deal.negotiations_deal_coordinator
// )?.name || "Not Assigned"}
//             </TableCell>

//             <TableCell
//               className={`px-4 relative py-2 border-r truncate max-w-[150px]  ${
//                 hoveredCell === deal.id ? "bg-gray-100" : ""
//               }`}
//               onMouseEnter={() => setHoveredCell(deal?.id ?? "")}
//               onMouseLeave={() => setHoveredCell(null)}
//               title={deal.consult_notes}
//             >
//               {deal?.consult_notes?.length > 50
//                 ? `${deal?.consult_notes?.substring(0, 50)}...`
//                 : deal.consult_notes}
// <button
//   onClick={() =>
//     setExpandedNote({
//       id: deal.id,
//       note: deal.consult_notes,
//     })
//   }
//   className="absolute top-[5px] right-[10px] transform  text-gray-500 hover:text-gray-700"
//   title="Expand"
// >
//   <Expand
//     size={16}
//     className="text-gray-500 hover:text-gray-700"
//   />
// </button>
//             </TableCell>

//             <TableCell className="px-4 py-2 border-r ">
//               {deal?.vehicle_of_interest ?? ""}
//             </TableCell>
//             <TableCell className="px-4 py-2 w-[100px]">
//               {deal?.negotiations_New_or_Used && (
//                 <Button
//                   variant="outline"
//                   className={`cursor-pointer p-1 w-fit h-fit text-xs rounded-full ${
//                     deal?.negotiations_New_or_Used === "New"
//                       ? "bg-[#d1e2ff]"
//                       : "bg-[#c4ecff]"
//                   }`}
//                 >
//                   <p> {deal?.negotiations_New_or_Used ?? ""}</p>
//                 </Button>
//               )}
//             </TableCell>
//           </TableRow>
//         ))}
//       </TableBody>
//     ) : (
//       <TableBody>
//         <TableRow>
//           <TableCell colSpan={12} className="text-center py-4">
//             No Data Found
//           </TableCell>
//         </TableRow>
//       </TableBody>
//     )}
//   </Table>
//   {expandedNote && (
// <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//     <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-4">
//         <h2 className="text-lg font-semibold mb-2">Consult Note</h2>
//         <p className="text-sm text-gray-700 whitespace-pre-wrap">
//           {expandedNote.note}
//         </p>
// <div className="text-right mt-4">
//   <button
//     className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
//     onClick={() => setExpandedNote(null)}
//   >
//     Close
//   </button>
// </div>
//       </div>
//     </div>
//   )}
//   {selectedDeal && (
// <ClientDetailsPopup
//   setNegotiations={setNegotiations}
//   open={isOpen}
//   onClose={() => setIsOpen(false)}
//   deal={selectedDeal}
//   fields={fields as any}
// />
//   )}
// </div>
//   )
// }

export default PaidHolding;
