import { DealerDataType } from "@/lib/models/dealer";
import Header from "../base/header";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { useEffect, useState } from "react";
import { CardContent } from "../ui/card";
import { VehicleTable } from "../Dealer/vehicle-table";
import { PreviousBidsTable } from "../Dealer/previous-bids-table";
import { useVehicles } from "@/hooks/useVehicles";
import { useDealerBids } from "@/hooks/useDealerBids";
import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

export const BidScreen = ({
  dealer,
  user,
  refresh,
}: {
  dealer: DealerDataType;
  user: any;
  refresh: boolean;
}) => {
  const [tab, setTab] = useState("available");
  const [subTab, setSubTab] = useState("new");
  const vehicles = useVehicles();
  const dealerBids = useDealerBids({ dealerId: dealer.id });
  const isMobile = useIsMobile();

  useEffect(() => {
    if (tab === "available" && ["won", "lost"].includes(subTab)) {
      setSubTab("all");
    }
  }, [tab, subTab]);

  useEffect(() => {
    dealerBids.refetch();
    vehicles.refetch();
  }, [refresh]);

  return (
    <div
      className={cn(
        `mx-auto space-y-6 min-h-screen w-full`,
        !isMobile && `p-4`
      )}
    >
      <Header user={user} />
      <div className="block md:bg-transparent bg-white md:border-none border-b top-[145px] md:pt-0 pt-8 md:static sticky z-50">
        <Tabs
          value={tab}
          defaultValue="account"
          className="md:text-start text-center mb-2"
          onValueChange={(value) => setTab(value)}
        >
          <TabsList>
            <TabsTrigger value="available">Available</TabsTrigger>
            <TabsTrigger value="previous">Previous Bids</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      <div className="bg-white shadow-lg">
        <CardContent>
          <div className="flex justify-end">
            <Tabs
              value={subTab}
              defaultValue="all"
              className="ml-0 md:ml-8"
              onValueChange={(value) => setSubTab(value)}
            >
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="new">New</TabsTrigger>
                <TabsTrigger value="used">Used</TabsTrigger>
                {tab === "previous" && (
                  <>
                    <TabsTrigger value="won">Won</TabsTrigger>
                    <TabsTrigger value="lost">Lost</TabsTrigger>
                  </>
                )}
              </TabsList>
            </Tabs>
          </div>
          {tab === "available" ? (
            <VehicleTable
              vehicles={vehicles?.data?.clients}
              subTab={subTab}
              dealer={dealer}
              refetch={vehicles?.refetch}
            />
          ) : (
            <PreviousBidsTable dealerBids={dealerBids?.bids} subTab={subTab} />
          )}
        </CardContent>
      </div>
    </div>
  );
};
