"use client";
import { TeamDashboardViewHeader } from "@/components/base/header";
import { Loader } from "@/components/base/loader";
import { TailwindPlusTable } from "@/components/tailwind-plus/table";
import { TeamDashboardViewSelector } from "@/components/Team/dashboard/team-dashboard-view-selector";
import { statuses } from "@/components/Team/filter-popup";
import ClientDetailsPopup from "@/components/Team/team-detail-popup";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropDownMenu,
  DropdownMenuCheckboxItem,
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
import {
  dateFormat,
  fetchAllActiveNegotiations,
  fetchAllPaidHoldingNegotiations,
  getStatusStyles,
  vehicleOfInterest,
} from "@/lib/utils";
import { DealNegotiator, NegotiationData } from "@/types";
import { DropdownMenu } from "@radix-ui/react-dropdown-menu";
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
import React, { useEffect, useRef, useState } from "react";

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
    label: "Phone Number",
    field: "negotiations_Phone",
  },
  {
    label: "Email",
    field: "negotiations_Email",
  },
  {
    label: "Zip Code",
    field: "negotiations_Zip_Code",
    icon: <MapPin size={14} />,
  },
  { label: "Status", field: "negotiations_Status" },
  { label: "Brand", field: "negotiations_Brand" },
  {
    label: "Client Consult Notes",
    field: "consult_notes",
    icon: <StickyNote size={14} />,
    type: "textarea",
  },

  { label: "Model", field: "model_of_interest", icon: <Car size={14} /> },
];
const ViewByBrand = () => {
  const router = useRouter();
  const { negotiatorData } = useTeamDashboard();
  const [loading, setLoading] = useState<boolean>(false);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [negotiations, setNegotiations] = useState<NegotiationData[]>([]);
  const [filteredNegotiations, setFilteredNegotiations] = useState<
    NegotiationData[]
  >([]);
  const [searchMakes, setSearchMakes] = useState("");
  const searchMakeInputRef = useRef<HTMLInputElement>(null);
  const [filters, setFilters] = useState({
    makes: "", // Stores selected car makes
    condition: "", // 'New' or 'Used'
  });

  const [trimDetails, setTrimDetails] = useState<{
    id: string;
    trim: string;
  } | null>(null);

  const [expandedNote, setExpandedNote] = useState<{
    id: string;
    note: string;
  } | null>(null);
  const [selectedDeal, setSelectedDeal] = useState<NegotiationData | null>(
    null
  );

  const [sortConfig, setSortConfig] = useState({
    key: "submittedDate",
    direction: "ascending",
  });

  const sortWithoutCoordinatorData = (key: string) => {
    setSortConfig((prevConfig) => {
      const newDirection =
        prevConfig.key === key && prevConfig.direction === "ascending"
          ? "descending"
          : "ascending";

      const sortedNegotiations = [...negotiations].sort((a: any, b: any) => {
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
      });

      setNegotiations(sortedNegotiations);

      return { key, direction: newDirection };
    });
  };

  useEffect(() => {
    setLoading(true);
    fetchAllActiveNegotiations()
      .then((res) => {
        console.log({ res });
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

  useEffect(() => {
    let filtered = [...negotiations];

    if (filters.makes) {
      filtered = filtered.filter(
        (deal) => deal.negotiations_Brand === filters.makes
      );
    }

    if (filters.condition && filters.condition !== "All") {
      filtered = filtered.filter(
        (deal) => deal.negotiations_New_or_Used === filters.condition
      );
    }

    setFilteredNegotiations(filtered);
  }, [filters, negotiations]);

  const sortData = sortDataHelper(setNegotiations, negotiations);

  return (
    <div className="container mx-auto p-4 space-y-6 min-h-screen">
      <TeamDashboardViewHeader
        negotiatorData={negotiatorData as DealNegotiatorType}
      />
      <div className="flex ml-10 gap-4 items-start">
        <div className="space-y-2">
          <DropDownMenu
            label="Select Makes"
            options={vehicleOfInterest.filter((make) =>
              make.toLowerCase().includes(searchMakes.toLowerCase())
            )}
            checkedItem={filters.makes}
            onFocus={() => searchMakeInputRef.current?.focus()}
            onCheckedChange={(checked, item) => {
              setFilters((prev) => ({
                ...prev,
                makes: checked ? item : "", // Set or clear make
              }));
            }}
          />
        </div>
        <div className="space-y-2">
          <DropDownMenu
            label="Select Condition"
            options={["All", "New", "Used"]}
            checkedItem={filters.condition}
            onFocus={() => searchMakeInputRef.current?.focus()}
            onCheckedChange={(checked, item) => {
              setFilters((prev) => ({
                ...prev,
                condition: checked ? item : "", // Set or clear make
              }));
            }}
          />
        </div>
        <TeamDashboardViewSelector />
      </div>
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
              header: "Phone Number",
              config: {
                sortable: true,
                key: "negotiations_Phone",
              },
            },
            {
              header: "Email",
              config: {
                sortable: true,
                key: "negotiations_Email",
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
              header: "New or Used",
              config: {
                sortable: true,
                key: "negotiations_New_or_Used",
              },
            },
            {
              header: "Trim Package",
              config: {
                sortable: true,
                key: "negotiations_Trim_Package_Options",
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
              header: "Drivetrain",
              config: {
                sortable: true,
                key: "negotiations_Drivetrain",
              },
            },
            {
              header: "Exterior Deal Breaker",
              config: {
                sortable: true,
                key: "negotiations_Color_Options.exterior_deal_breakers",
              },
            },
            {
              header: "Exterior Preffered",
              config: {
                sortable: true,
                key: "negotiations_Color_Options.exterior_preferred",
              },
            },
            {
              header: "Interior Deal Breaker",
              config: {
                sortable: true,
                key: "negotiations_Color_Options.interior_deal_breaker",
              },
            },
            {
              header: "Interior Preffered",
              config: {
                sortable: true,
                key: "negotiations_Color_Options.interior_preferred",
              },
            },
            {
              header: "Date Paid",
              config: {
                sortable: true,
                key: "date_paid",
              },
            },
          ]}
          rows={filteredNegotiations.map((deal, idx) => [
            {
              text: `${idx + 1}`,
              link: `/team-profile?id=${deal.id}`,
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
            deal.negotiations_Phone,
            deal.negotiations_Email,
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
            deal.negotiations_New_or_Used,
            deal.negotiations_Trim_Package_Options,
            {
              text: deal?.consult_notes?.substring(0, 50),
              config: {
                expandable: deal?.consult_notes?.length > 50,
                expandedComponent: ({ expanded, setExpanded }: any) => (
                  <div>{deal.consult_notes}</div>
                ),
              },
            },
            deal.negotiations_Drivetrain,
            deal.negotiations_Color_Options.exterior_deal_breakers,
            deal.negotiations_Color_Options.exterior_preferred,
            deal.negotiations_Color_Options.interior_deal_breaker,
            deal.negotiations_Color_Options.interior_preferred,
            deal.date_paid,
          ])}
          sortConfig={sortConfig}
          setSortConfig={setSortConfig}
          sortData={sortData}
        />
      </Card>
    </div>
  );

  return (
    <>
      <div className="flex ml-10 gap-4 items-start">
        <div className="space-y-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                Select Makes
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-auto">
              <div className="h-56 overflow-scroll">
                {vehicleOfInterest
                  .filter((make) =>
                    make.toLowerCase().includes(searchMakes.toLowerCase())
                  )
                  .map((make: string, index) => (
                    <DropdownMenuCheckboxItem
                      key={index}
                      onFocus={() => searchMakeInputRef.current?.focus()}
                      checked={filters.makes === make}
                      onCheckedChange={(checked) => {
                        setFilters((prev) => ({
                          ...prev,
                          makes: checked ? make : "", // Set or clear make
                        }));
                      }}
                    >
                      {make}
                    </DropdownMenuCheckboxItem>
                  ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full justify-between">
                Select Condition
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-auto">
              <div className="overflow-scroll">
                {["All", "New", "Used"].map((condition: string, index) => (
                  <DropdownMenuCheckboxItem
                    key={index}
                    onFocus={() => searchMakeInputRef.current?.focus()}
                    checked={filters.condition === condition}
                    onCheckedChange={(checked) => {
                      setFilters((prev) => ({
                        ...prev,
                        condition: checked ? condition : "", // Set or clear make
                      }));
                    }}
                  >
                    {condition}
                  </DropdownMenuCheckboxItem>
                ))}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="space-y-2 ">
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
      </div>
      <div className="m-5">
        <Table className="min-w-full border-collapse">
          <TableHeader className="sticky top-0 bg-gray-100 z-10 border-b border-gray-300">
            <TableRow>
              <TableHead className="text-left px-4 py-2 border-r">#</TableHead>
              <TableHead
                onClick={() =>
                  sortWithoutCoordinatorData("negotiations_Client")
                }
                className="text-left px-4 py-2 border-r"
              >
                Client
              </TableHead>
              <TableHead
                onClick={() => sortWithoutCoordinatorData("negotiations_Brand")}
                className="text-left px-4 py-2 border-r"
              >
                Make
              </TableHead>
              <TableHead
                onClick={() => sortWithoutCoordinatorData("model_of_interests")}
                className="text-left px-4 py-2 border-r"
              >
                Model
              </TableHead>
              <TableHead
                onClick={() => sortWithoutCoordinatorData("negotiations_Phone")}
                className="text-left min-w-[150px] px-4 py-2 border-r"
              >
                Phone Number
              </TableHead>
              <TableHead
                onClick={() => sortWithoutCoordinatorData("negotiations_Email")}
                className="text-left px-4 py-2 border-r"
              >
                Email
              </TableHead>
              <TableHead className="text-left  px-4 py-2 border-r">
                Stage
              </TableHead>
              <TableHead
                onClick={() =>
                  sortWithoutCoordinatorData("negotiations_Zip_Code")
                }
                className="text-left px-4 py-2 border-r"
              >
                Zip Code
              </TableHead>

              <TableHead className="text-left px-4 py-2 border-r">
                New or Used
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
              <TableHead
                onClick={() => sortWithoutCoordinatorData("date_paid")}
                className="text-left px-4 py-2"
              >
                Date Paid
              </TableHead>
            </TableRow>
          </TableHeader>

          {loading ? (
            <TableBody>
              <TableRow>
                <TableCell colSpan={18} className="text-center py-4">
                  <Loader />
                </TableCell>
              </TableRow>
            </TableBody>
          ) : filteredNegotiations?.length ? (
            <TableBody>
              {filteredNegotiations.map((deal, index) => (
                <TableRow key={deal.id} className="hover:bg-gray-50 transition">
                  <TableCell className="px-4 py-2 border-r">
                    <Link href={`/team-profile?id=${deal.id}`}>
                      {index + 1}
                    </Link>
                  </TableCell>

                  <TableCell className="px-4 relative py-2 border-r">
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
                    {deal.negotiations_Brand}
                  </TableCell>

                  <TableCell className="px-4 py-2 border-r">
                    {deal.model_of_interest}
                  </TableCell>
                  <TableCell className="px-4 py-2 border-r">
                    {deal.negotiations_Phone}
                  </TableCell>
                  <TableCell className="px-4 py-2 border-r">
                    {deal.negotiations_Email}
                  </TableCell>

                  <TableCell className="px-4 py-2 border-r">
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
                  </TableCell>

                  <TableCell className="px-4 py-2 border-r">
                    {deal.negotiations_Zip_Code}
                  </TableCell>

                  <TableCell className="px-4 py-2 w-[100px] border-r">
                    {deal?.negotiations_New_or_Used ? (
                      <Button
                        variant="outline"
                        className={`cursor-pointer p-1 w-fit h-fit text-xs rounded-full ${
                          deal?.negotiations_New_or_Used === "New"
                            ? "bg-[#d1e2ff]"
                            : "bg-[#c4ecff]"
                        }`}
                      >
                        <p> {deal?.negotiations_New_or_Used}</p>
                      </Button>
                    ) : (
                      <></>
                    )}
                  </TableCell>
                  <TableCell className="px-4 relative max-w-[100px] truncate py-2 border-r">
                    {deal?.negotiations_Trim_Package_Options &&
                    deal?.negotiations_Trim_Package_Options?.length > 50
                      ? `${deal?.negotiations_Trim_Package_Options?.substring(
                          0,
                          50
                        )}...`
                      : deal.negotiations_Trim_Package_Options}
                    <button
                      onClick={() =>
                        setTrimDetails({
                          id: deal.id,
                          trim: deal.negotiations_Trim_Package_Options ?? "",
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
                      ? `${deal?.consult_notes?.substring(0, 50)}...`
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
                    {deal.negotiations_Color_Options.exterior_deal_breakers}
                  </TableCell>
                  <TableCell className="px-4 py-2 border-r">
                    {deal.negotiations_Color_Options.exterior_preferred}
                  </TableCell>
                  <TableCell className="px-4 py-2 border-r">
                    {deal.negotiations_Color_Options.interior_deal_breaker}
                  </TableCell>
                  <TableCell className="px-4 py-2 border-r">
                    {deal.negotiations_Color_Options.interior_preferred}
                  </TableCell>

                  <TableCell className="px-4 py-2 border-r">
                    <div>{dateFormat(deal.date_paid)}</div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          ) : (
            <TableBody>
              <TableRow>
                <TableCell colSpan={12} className="text-center py-4">
                  No Data Found
                </TableCell>
              </TableRow>
            </TableBody>
          )}
        </Table>
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
        {selectedDeal && (
          <ClientDetailsPopup
            setNegotiations={setNegotiations}
            open={isOpen}
            onClose={() => setIsOpen(false)}
            deal={selectedDeal}
            fields={fields as any}
          />
        )}
      </div>
    </>
  );
};

export default ViewByBrand;
