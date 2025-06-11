import { ClientDataType } from "@/lib/models/client";
import { TailwindPlusTable } from "../tailwind-plus/table";
import { IncomingBidType } from "@/lib/models/bids";
import { MakeButton } from "../Team/make-button";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { FileIcon } from "lucide-react";
import Link from "next/link";
import { Button } from "../ui/button";

type PreviousBidType = IncomingBidType &
  ClientDataType & { bidStatus: string; winningBid: any };

//wherrera@toyotagallatin.com
export const PreviousBidsTable = ({
  dealerBids,
  subTab,
}: {
  dealerBids: PreviousBidType[];
  subTab: string;
}) => {
  const [filteredBids, setFilteredBids] =
    useState<PreviousBidType[]>(dealerBids);
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: string;
  }>({ key: "submittedDate", direction: "desc" });

  const filterVehicles = (incomingVehicles: PreviousBidType[]) => {
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

    if (subTab === "won") {
      return incomingVehicles.filter((vehicle) => {
        return vehicle.bidStatus === "won";
      });
    }

    if (subTab === "lost") {
      return incomingVehicles.filter((vehicle) => {
        return vehicle.bidStatus === "lost";
      });
    }

    return [];
  };

  const sortDataHelper = (
    incomingVehicles: PreviousBidType[],
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
              key: "submittedDate",
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
          console.log("bid", bid.Model, bid.bid_id);
          const subRow: any = {
            descriptor: {},
          };
          if (bid.bidStatus === "won" || bid.bidStatus === "lost") {
            // lost color #FCF2F2
            subRow.descriptor = {
              subRow: {
                Component: () => (
                  <td
                    colSpan={9}
                    className={cn(
                      `p-4`,
                      bid.bidStatus === "won" ? "bg-[#F2FDF5]" : "bg-[#FCF2F2]"
                    )}
                  >
                    <div className="flex gap-2">
                      <div className="mr-[10%]">
                        <div
                          className={cn(
                            `font-bold text-xl`,
                            bid.bidStatus === "won"
                              ? "text-green-700"
                              : "text-red-700"
                          )}
                        >
                          {bid.bidStatus === "won"
                            ? "You Won This Bid!"
                            : "Another Dealer Won This Bid"}
                        </div>
                        <div>
                          <span className="font-bold">Winning Bid Price:</span>{" "}
                          {bid.winningBid?.price || bid.price}
                        </div>
                      </div>
                      <div className="mb-0 mt-auto">
                        <span className="font-bold">Winning discount:</span>{" "}
                        {bid.winningBid?.discountPrice || bid.discountPrice}
                      </div>
                    </div>
                  </td>
                ),
              },
            };
          }

          return [
            subRow,
            {
              Component: () => <MakeButton make={bid.Brand} />,
            },
            bid.Model,
            bid.Trim,
            bid.submittedDate,
            bid.price,
            bid.discountPrice,
            {
              Component: () => {
                console.log(
                  "bid.inventoryStatus:",
                  bid.bid_id,
                  bid.inventoryStatus
                );
                return (
                  <div
                    className={cn(
                      `w-fit px-4 py-2 rounded-full font-bold`,
                      bid.inventoryStatus === "In Stock"
                        ? "bg-black text-white"
                        : "bg-gray text-black"
                    )}
                  >
                    {bid.inventoryStatus}
                  </div>
                );
              },
            },
            bid.comments,
            {
              Component: ({ expand }: any) => (
                <FileIcon
                  onClick={() => {
                    expand();
                  }}
                  className="cursor-pointer"
                />
              ),
              config: {
                expandable: true,
                noExpandButton: true,
                expandedComponent: () => {
                  return (
                    <>
                      {bid.files?.map((file, idx) => {
                        console.log("file:", file);
                        return (
                          <div>
                            <Link target="_blank" href={file}>
                              <img
                                src={file}
                                alt={file}
                                className="w-[100px] h-[100px]"
                              />
                            </Link>
                          </div>
                        );
                      })}
                    </>
                  );
                },
              },
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
