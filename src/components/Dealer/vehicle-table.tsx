import { ClientDataType } from "@/lib/models/client";
import { CellDescriptor, TailwindPlusTable } from "../tailwind-plus/table";
import { useEffect, useMemo, useState } from "react";
import { DealerDataType } from "@/lib/models/dealer";
import { Button } from "../ui/button";
import { ModalForm } from "../tailwind-plus/modal-form";
import { DealerBidForm } from "./dealer-bid-form";
import { MakeButton } from "../Team/make-button";
import { Loader } from "../base/loader";
import { useIsMobile } from "@/hooks/useIsMobile";

export const VehicleTable = ({
  vehicles,
  subTab,
  dealer,
  refetch,
}: {
  vehicles: (ClientDataType & { bidNum: number; trade: boolean })[];
  subTab: string;
  dealer: DealerDataType;
  refetch: () => void;
}) => {
  const isMobile = useIsMobile();
  const [selectedVehicle, setSelectedVehicle] = useState<
    (ClientDataType & { bidNum: number; trade: boolean }) | null
  >(null);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: string;
  }>({ key: "bidNum", direction: "desc" });
  const [filteredVehicles, setFilteredVehicles] =
    useState<(ClientDataType & { bidNum: number; trade: boolean })[]>(vehicles);

  const filterVehicles = (
    incomingVehicles: (ClientDataType & { bidNum: number; trade: boolean })[]
  ) => {
    if (!incomingVehicles) return [];

    if (subTab === "all") return incomingVehicles;
    if (subTab === "new") {
      return incomingVehicles.filter((vehicle) => {
        if (!dealer.Brand) return false;
        const result =
          vehicle.NewOrUsed === "New" && dealer.Brand.includes(vehicle.Brand);
        if (!result) {
          if (vehicle.NewOrUsed === "New") {
            console.log("vehicle", vehicle.Brand);
          }
        }
        return result;
      });
    }
    if (subTab === "used") {
      return incomingVehicles.filter((vehicle) => {
        return vehicle.NewOrUsed === "Used";
      });
    }
    return [];
  };

  const sortDataHelper = (
    incomingVehicles: (ClientDataType & { bidNum: number; trade: boolean })[],
    key: string,
    direction: string
  ) => {
    // @ts-ignore
    return filteredVehicles.sort((a: any, b: any) => {
      const aValue = a[key as keyof ClientDataType];
      const bValue = b[key as keyof ClientDataType];

      if (aValue === undefined && bValue === undefined) return 0;
      if (aValue === undefined) return 1;
      if (bValue === undefined) return -1;

      // Handle string values
      if (typeof aValue === "string" && typeof bValue === "string") {
        return direction === "ascending"
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      if (typeof aValue === "number" && typeof bValue === "number") {
        return direction === "ascending" ? aValue - bValue : bValue - aValue;
      }

      // Default case - convert to string and compare
      const aStr = String(aValue);
      const bStr = String(bValue);
      return direction === "ascending"
        ? aStr.localeCompare(bStr)
        : bStr.localeCompare(aStr);
    });
  };

  const sortData = (key: string, direction: string) => {
    setSortConfig({ key, direction });
    const sorted = sortDataHelper(filteredVehicles, key, direction);
    setFilteredVehicles(sorted);
  };

  useEffect(() => {
    const filtered = filterVehicles(vehicles);
    setFilteredVehicles(filtered);
  }, [subTab, vehicles, dealer.Brand]);

  const headers = useMemo(() => {
    let useableHeaders: any = [];

    if (!isMobile) {
      useableHeaders = [
        "Bid",
        {
          header: "Make",
          config: {
            sortable: true,
            key: "Brand",
          },
        },
        {
          header: "Model",
          config: {
            sortable: true,
            key: "Model",
          },
        },
      ];
    }

    if (!isMobile) {
      useableHeaders = [
        ...useableHeaders,
        {
          header: "Trim",
          config: {
            sortable: true,
            key: "Trim",
          },
        },
      ];
    }

    useableHeaders = [
      ...useableHeaders,
      {
        header: "Zip Code",
        config: {
          sortable: true,
          key: "ZipCode",
        },
      },
      {
        header: "Desired Exterior Color",
        config: {
          sortable: true,
          key: "desiredExterior",
        },
      },
      {
        header: "Desired Interior Color",
        config: {
          sortable: true,
          key: "desiredInterior",
        },
      },
      {
        header: "Drive Train",
        config: {
          sortable: true,
          key: "Drivetrain",
        },
      },
      {
        header: "Current Bids",
        config: {
          sortable: true,
          key: "bidNum",
        },
      },
      {
        header: "Trade In",
        config: {
          sortable: true,
          key: "trade",
        },
      },
    ];

    if (isMobile) {
      useableHeaders = [
        ...useableHeaders,
        {
          header: "Trim",
          config: {
            sortable: true,
            key: "Trim",
          },
        },
      ];
    }

    return useableHeaders;
  }, [isMobile]);

  const useableVehicleRows = useMemo(() => {
    if (!filteredVehicles) return [];
    const output = filteredVehicles
      // .filter((vehicle) => {
      //   return vehicle.negotiation_Id === "recH85js7w4MRVDru";
      // })
      .map((vehicle) => {
        const configObj = {
          descriptor: {} as CellDescriptor,
        };

        if (isMobile) {
          configObj.descriptor.mobileHeader = () => (
            <>
              <div>
                {vehicle.Brand} {vehicle.Model}
              </div>
            </>
          );
          configObj.descriptor.cta = () => (
            <Button
              variant="outline"
              className="bg-blue-500 text-white hover:bg-blue-500 hover:text-white"
              onClick={() => setSelectedVehicle(vehicle)}
            >
              Submit Bid
            </Button>
          );
        }

        let row: any[] = [configObj];

        if (!isMobile) {
          row = [
            ...row,
            {
              Component: () => (
                <Button
                  variant="outline"
                  className="bg-blue-500 text-white hover:bg-blue-500 hover:text-white"
                  onClick={() => setSelectedVehicle(vehicle)}
                >
                  Submit Bid
                </Button>
              ),
            },
            {
              Component: () => <MakeButton make={vehicle.Brand} />,
            },
            vehicle.Model,
          ];
        }

        if (!isMobile) {
          row = [...row, vehicle.Trim];
        }

        row = [
          ...row,
          vehicle.ZipCode,
          vehicle.desiredExterior,
          vehicle.desiredInterior,
          vehicle.Drivetrain,
          vehicle.bidNum ?? 0,
          vehicle.trade ? "Yes" : "No",
        ];

        if (isMobile) {
          row = [
            ...row,
            {
              text: vehicle.Trim,
              config: {
                mobileSingleRow: true,
                topDivider: true,
              },
            },
          ];
        }

        return row;
      });

    return output;
  }, [filterVehicles, isMobile]);

  if (!filteredVehicles)
    return (
      <div>
        <Loader />
      </div>
    );

  return (
    <>
      <TailwindPlusTable
        headers={headers}
        rows={useableVehicleRows}
        sortConfig={sortConfig}
        setSortConfig={setSortConfig}
        sortData={sortData}
      />

      {selectedVehicle && (
        <DealerBidForm
          vehicle={selectedVehicle}
          onClose={() => setSelectedVehicle(null)}
          dealer={dealer}
          refetch={refetch}
        />
      )}
    </>
  );
};
