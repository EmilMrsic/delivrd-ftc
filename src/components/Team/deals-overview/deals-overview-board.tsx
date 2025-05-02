import { TailwindPlusCard } from "@/components/tailwind-plus/card";
import { TailwindPlusModal } from "@/components/tailwind-plus/modal";
import { NegotiationDataType } from "@/lib/models/team";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ClientProfile } from "../profile/client-profile";

export const DealsOverviewBoard = () => {
  const [selectedDeal, setSelectedDeal] = useState<NegotiationDataType | null>(
    null
  );
  const result = useQuery({
    queryKey: ["deals-overview"],
    queryFn: async () => {
      const res = await fetch("/api/overview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({}),
      });
      return res.json();
    },
  });

  if (!result.data) return null;
  console.log("data to work with:", result.data);
  const { metrics, dailyClosedDeals, monthlyClosedDeals } = result.data;

  return (
    <>
      <div className="flex gap-8 w-fit ml-auto mr-auto">
        <MinimalCard>
          <div className="text-lg text-center">Active Deals</div>
          <div className="text-black-500 text-center text-8xl font-bold">
            {result.data.activeDeals}
          </div>
        </MinimalCard>
        <MinimalCard>
          <div className="text-lg text-center">Closed Today</div>
          <RatioDisplay
            numerator={dailyClosedDeals}
            denominator={metrics.dailyGoal}
          />
          <hr />

          <div className="text-lg text-center">Closed This Month</div>
          <RatioDisplay
            numerator={monthlyClosedDeals}
            denominator={metrics.monthlyGoal}
          />
        </MinimalCard>
        <MinimalCard>
          <div className="text-lg text-center mb-4">Picking up today</div>
          <DealsListCard
            deals={result.data.pickingUpToday}
            setSelectedDeal={setSelectedDeal}
          />
        </MinimalCard>
        <MinimalCard>
          <div className="text-lg text-center mb-4">Shipping</div>
          <DealsListCard
            deals={result.data.shippingToday}
            setSelectedDeal={setSelectedDeal}
          />
        </MinimalCard>
      </div>
      {selectedDeal && (
        <TailwindPlusModal
          close={() => setSelectedDeal(null)}
          width={80}
          height={80}
        >
          <ClientProfile negotiationId={selectedDeal.id} />
        </TailwindPlusModal>
      )}
    </>
  );
};

export const MinimalCard = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="-m-2 grid grid-cols-1 rounded-3xl ring-1 shadow-[inset_0_0_2px_1px_#ffffff4d] ring-black/5 max-lg:mx-auto max-lg:w-full max-lg:max-w-md mb-4 p-4 max-w-[200px] w-[200px]">
      {children}
    </div>
  );
};

export const RatioDisplay = ({
  numerator,
  denominator,
}: {
  numerator: number;
  denominator: number;
}) => (
  <div className="text-center text-4xl font-bold mt-2 mb-4">
    {numerator} / <span className="text-blue-500">{denominator}</span>
  </div>
);

export const DealsListCard = ({
  deals,
  setSelectedDeal,
}: {
  deals: NegotiationDataType[];
  setSelectedDeal: (deal: NegotiationDataType) => void;
}) => {
  return (
    <div className="flex flex-col gap-2">
      {deals.map((deal) => (
        <div
          key={deal.id}
          className="text-blue-500 cursor-pointer text-center"
          onClick={() => setSelectedDeal(deal)}
        >
          {deal.clientNamefull}
        </div>
      ))}
    </div>
  );
};
