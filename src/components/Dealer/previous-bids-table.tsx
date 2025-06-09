import { ClientDataType } from "@/lib/models/client";
import { TailwindPlusTable } from "../tailwind-plus/table";
import { IncomingBidType } from "@/lib/models/bids";
import { MakeButton } from "../Team/make-button";
import { useEffect, useState } from "react";

//wherrera@toyotagallatin.com
export const PreviousBidsTable = ({
  dealerBids,
  subTab,
}: {
  dealerBids: (IncomingBidType & ClientDataType)[];
  subTab: string;
}) => {
  const [filteredBids, setFilteredBids] =
    useState<(IncomingBidType & ClientDataType)[]>(dealerBids);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: string;
  }>({ key: "submittedDate", direction: "desc" });

  const filterVehicles = (
    incomingVehicles: (IncomingBidType & ClientDataType)[]
  ) => {
    if (subTab === "all") return incomingVehicles;
    if (subTab === "new") {
      return incomingVehicles.filter((vehicle) => {
        const result = vehicle.NewOrUsed === "New";
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
    incomingVehicles: (IncomingBidType & ClientDataType)[],
    key: string,
    direction: string
  ) => {
    // @ts-ignore
    return filteredBids.sort((a: any, b: any) => {
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
    const sorted = sortDataHelper(filteredBids, key, direction);
    setFilteredBids(sorted);
  };

  useEffect(() => {
    const filtered = filterVehicles(dealerBids);
    setFilteredBids(filtered);
  }, [subTab, dealerBids]);

  if (!dealerBids) return <></>;

  return (
    <>
      <TailwindPlusTable
        headers={[
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
          {
            header: "Trim",
            config: {
              sortable: true,
              key: "Trim",
            },
          },
          {
            header: "Submitted Date",
            config: {
              sortable: true,
              key: "timestamps",
            },
          },
          {
            header: "Price",
            config: {
              sortable: true,
              key: "price",
            },
          },
          {
            header: "Discounted Price",
            config: {
              sortable: true,
              key: "discountPrice",
            },
          },
          {
            header: "Inventory Status",
            config: {
              sortable: true,
              key: "inventoryStatus",
            },
          },
          {
            header: "Additional Comments",
          },
          {
            header: "Files",
          },
        ]}
        rows={filteredBids.map((bid) => {
          return [
            {
              Component: () => <MakeButton make={bid.Brand} />,
            },
            bid.Model,
            bid.Trim,
            bid.timestamps || bid.timestamp,
            bid.price,
            bid.discountPrice,
            bid.inventoryStatus,
            bid.comments,
            {
              Component: () => bid.files,
            },
          ];
        })}
        sortConfig={sortConfig}
        setSortConfig={setSortConfig}
        sortData={sortData}
      />
    </>
  );
};
