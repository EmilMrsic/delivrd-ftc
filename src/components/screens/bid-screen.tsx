import { DealerDataType } from "@/lib/models/dealer";
import Header from "../base/header";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { useState } from "react";
import { CardContent } from "../ui/card";
import { VehicleTable } from "../Dealer/vehicle-table";
import { PreviousBidsTable } from "../Dealer/previous-bids-table";
import { useVehicles } from "@/hooks/useVehicles";

export const BidScreen = ({
  dealer,
  user,
}: {
  dealer: DealerDataType;
  user: any;
}) => {
  const [tab, setTab] = useState("available");
  const vehicles = useVehicles();

  return (
    <div className="mx-auto p-4 space-y-6 min-h-screen w-full">
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
          {tab === "available" ? (
            <VehicleTable vehicles={vehicles?.data?.clients} />
          ) : (
            <>previous</> // <PreviousBidsTable dealerBids={} />
          )}
        </CardContent>
      </div>
    </div>
  );
};
