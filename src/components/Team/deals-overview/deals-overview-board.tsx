import { TailwindPlusCard } from "@/components/tailwind-plus/card";
import { TailwindPlusModal } from "@/components/tailwind-plus/modal";
import { NegotiationDataType } from "@/lib/models/team";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { ClientProfile } from "../profile/client-profile";
import { backendRequest } from "@/lib/request";
import { TailwindPlusProgressBar } from "@/components/tailwind-plus/progress-bar";
import { EditableText } from "@/components/tailwind-plus/editable-text";
import { collection, doc, getDocs, query, updateDoc } from "firebase/firestore";
import { db } from "@/firebase/config";

// https://thankyuu.notion.site/Dashboards-1e5aa77aecd1805ea5b6c55bdaef2fb9

export const DealsOverviewBoard = ({
  mode,
}: {
  mode: "coordinator" | "owner" | "idk";
}) => {
  const [selectedDeal, setSelectedDeal] = useState<NegotiationDataType | null>(
    null
  );
  const result = useQuery({
    queryKey: ["deals-overview"],
    queryFn: async () => {
      const res = await backendRequest("overview", "POST", {
        mode: mode,
      });
      return res;
    },
  });

  const updateField = useCallback(
    (field: string, value: string) => {
      (async () => {
        if (result.data.metrics[field] !== value) {
          const metricsTable = collection(db, "metrics");
          const docRef = doc(metricsTable, result.data.metrics.id);
          updateDoc(docRef, {
            [field]: value,
          });
        }
      })();
    },
    [result.data]
  );

  if (!result.data) return null;
  console.log("data to work with:", result.data);

  return (
    <>
      <div className="flex gap-8 w-fit ml-auto mr-auto">
        <ActiveDealsCard result={result} />
        {mode === "owner" && (
          <SalesCard result={result} updateField={updateField} />
        )}
        <ClosedDealsCard result={result} updateField={updateField} />
        {mode === "coordinator" && (
          <PickingUpAndShippingCard
            result={result}
            setSelectedDeal={setSelectedDeal}
          />
        )}
        {mode === "owner" && <CoordinatorClosedDealsCard result={result} />}
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

export const CoordinatorClosedDealsCard = ({ result }: { result: any }) => {
  return (
    <MinimalCard>
      <div className="text-lg text-center">Deal Coordinators</div>
      <div>
        {Object.keys(result.data.coordinatorSalesThisWeek).map(
          (coordinatorId) => (
            <div key={coordinatorId} className="mb-2">
              <div className="flex justify-between">
                <div>
                  {
                    result.data.coordinatorSalesThisWeek[coordinatorId]
                      .coordinatorName
                  }
                </div>
                <div>
                  {result.data.coordinatorSalesThisWeek[coordinatorId].sales}
                </div>
              </div>
              <TailwindPlusProgressBar
                numerator={
                  result.data.coordinatorSalesThisWeek[coordinatorId].sales
                }
                denominator={15}
              />
            </div>
          )
        )}
      </div>
    </MinimalCard>
  );
};

export const ClosedDealsCard = ({
  result,
  updateField,
}: {
  result: any;
  updateField: (field: string, value: string) => void;
}) => {
  const { metrics, dailyClosedDeals, monthlyClosedDeals } = result.data;
  return (
    <MinimalCard>
      <div className="text-lg text-center">Closed Today</div>
      <RatioDisplay
        numerator={dailyClosedDeals}
        denominator={metrics.dailyGoal}
        onUpdate={(value) => {
          updateField("dailyGoal", value);
        }}
      />
      <hr />

      <div className="text-lg text-center">Closed This Month</div>
      <RatioDisplay
        numerator={monthlyClosedDeals}
        denominator={metrics.monthlyGoal}
        onUpdate={(value) => {
          updateField("monthlyGoal", value);
        }}
      />
    </MinimalCard>
  );
};

export const SalesCard = ({
  result,
  updateField,
}: {
  result: any;
  updateField: (field: string, value: string) => void;
}) => {
  return (
    <MinimalCard>
      <div className="text-lg text-center">Sales</div>
      <div className="text-black-500 text-center text-6xl font-bold">
        {result.data.salesThisWeek}
      </div>
      <div className="border border-gray-200 p-4">
        <div className="flex justify-between">
          <div>Goal</div>
          <div>
            <EditableText
              value={result.data.metrics.monthlySalesGoal.toString()}
              size="sm"
              color="black"
              onUpdate={(value) => {
                updateField("monthlySalesGoal", value);
              }}
            />
          </div>
        </div>
        <TailwindPlusProgressBar
          numerator={result.data.salesThisMonth}
          denominator={2}
        />
        <div className="w-fit ml-auto mr-0">{result.data.salesThisMonth}</div>
      </div>
    </MinimalCard>
  );
};

export const ActiveDealsCard = ({ result }: { result: any }) => {
  return (
    <MinimalCard>
      <div className="text-lg text-center">Active Deals</div>
      <div className="text-black-500 text-center text-8xl font-bold">
        {result.data.activeDeals}
      </div>
    </MinimalCard>
  );
};

export const PickingUpAndShippingCard = ({
  result,
  setSelectedDeal,
}: {
  result: any;
  setSelectedDeal: (deal: NegotiationDataType) => void;
}) => {
  return (
    <>
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
  onUpdate,
}: {
  numerator: number;
  denominator: number;
  onUpdate?: (value: string) => void;
}) => (
  <div className="text-4xl font-bold mt-2 mb-4 flex justify-center">
    {/* <div className="flex justify-center"> */}
    {numerator} /{" "}
    <EditableText
      value={denominator.toString()}
      size="4xl"
      color="blue-500"
      onUpdate={onUpdate}
      className="ml-2"
    />
    {/* </div> */}
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
