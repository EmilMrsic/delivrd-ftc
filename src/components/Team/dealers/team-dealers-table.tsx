import { TailwindPlusTable } from "@/components/tailwind-plus/table";
import { DealerDataType } from "@/lib/models/dealer";
import { MakeButton } from "../make-button";
import { RadiusButton } from "@/components/base/radius-button";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const TeamDealersTable = ({
  dealers,
  loading,
  sortConfig,
  setSortConfig,
  sortData,
}: {
  dealers: DealerDataType[];
  loading: boolean;
  sortConfig: {
    key: string;
    direction: string;
  };
  setSortConfig: (config: { key: string; direction: string }) => void;
  sortData: (key: string, direction: string) => void;
}) => {
  console.log("got dealers:", dealers);
  return (
    <div>
      <TailwindPlusTable
        pagination={true}
        pageLimit={100}
        isLoading={loading}
        headers={[
          "Brand",
          {
            header: "City",
            config: {
              sortable: true,
              key: "City",
            },
          },
          {
            header: "State",
            config: {
              sortable: true,
              key: "State",
            },
          },
          {
            header: "Dealership",
            config: {
              sortable: true,
              key: "Dealership",
            },
          },
          {
            header: "Sales Person",
            config: {
              sortable: true,
              key: "SalesPersonName",
            },
          },
          {
            header: "Contact",
            config: {
              sortable: true,
              key: "SalesPersonPhone",
            },
          },
          {
            header: "Radius",
            config: {
              sortable: true,
              key: "radius",
            },
          },
          {
            header: "Number of Bids",
            config: {
              sortable: true,
              key: "bids",
            },
          },
          {
            header: "Last Bid",
            config: {
              sortable: true,
              key: "lastBid",
            },
          },
          "Actions",
        ]}
        rows={dealers.map((dealer) => [
          {
            Component: () => {
              return (
                <div>
                  {dealer.Brand?.map((brand) => (
                    <MakeButton make={brand} />
                  ))}
                </div>
              );
            },
          },
          dealer.City ?? "",
          dealer.State ?? "",
          {
            Component: () => <b>{dealer.Dealership ?? ""}</b>,
          },
          dealer.SalesPersonName ?? "",
          {
            Component: () => (
              <span className="text-blue-500">
                {dealer.SalesPersonPhone ?? ""}
              </span>
            ),
          },
          {
            Component: () => <RadiusButton radius={dealer.radius ?? ""} />,
          },
          dealer.bids?.length?.toString() ?? "0",
          {
            Component: () =>
              dealer.lastBid ? (
                <Button variant="outline" className="text-xs" disabled>
                  {dealer.lastBid
                    ? new Date(dealer.lastBid).toLocaleDateString()
                    : ""}
                </Button>
              ) : (
                <></>
              ),
          },
          {
            Component: () => {
              return dealer.YourWebsite ? (
                <Link
                  href={dealer.YourWebsite}
                  target="_blank"
                  className="text-blue-500"
                >
                  Website
                </Link>
              ) : (
                "N/A"
              );
            },
          },
        ])}
        sortConfig={sortConfig}
        setSortConfig={setSortConfig}
        sortData={sortData}
      />
    </div>
  );
};
