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
import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useLoggedInUser } from "@/hooks/useLoggedInUser";

// https://thankyuu.notion.site/Dashboards-1e5aa77aecd1805ea5b6c55bdaef2fb9

export const DealsOverviewBoard = ({
  mode,
}: {
  mode: "coordinator" | "owner" | "reviewer";
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

  return (
    <>
      <div
        className={cn(
          `flex flex-wrap gap-8 w-fit ml-auto mr-auto`,
          mode === "reviewer" && "mt-[48px]"
        )}
      >
        <ActiveDealsCard result={result} mode={mode} />
        {mode === "owner" && (
          <SalesCard result={result} updateField={updateField} />
        )}
        {["owner", "coordinator"].includes(mode) && (
          <ClosedDealsCard
            result={result}
            updateField={updateField}
            mode={mode}
          />
        )}
        {mode === "coordinator" && (
          <PickingUpAndShippingCard
            result={result}
            setSelectedDeal={setSelectedDeal}
          />
        )}
        {mode === "owner" && <CoordinatorClosedDealsCard result={result} />}
        {mode === "reviewer" && (
          <CoordinatorsMultiPickingUpAndShippingCard
            result={result}
            setSelectedDeal={setSelectedDeal}
          />
        )}
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

export const CoordinatorsMultiPickingUpAndShippingCard = ({
  result,
  setSelectedDeal,
}: {
  result: any;
  setSelectedDeal: (deal: NegotiationDataType) => void;
}) => {
  return Object.keys(result.data.shippingAndPickingUpTodayByCoordinator).map(
    (coordinatorName) => {
      const { pickingUpToday, shippingToday } =
        result.data.shippingAndPickingUpTodayByCoordinator[coordinatorName];
      return (
        <div key={coordinatorName}>
          <div className="text-xl text-black-500 font-bold text-center mt-[-35px] mb-4">
            {coordinatorName}
          </div>
          <div className="flex gap-6">
            <MinimalCard>
              <div className="border-l-4 border-blue-500 pl-2 h-full">
                <div className="text-lg text-center mb-4">Picking up today</div>
                <DealsListCard
                  deals={pickingUpToday}
                  setSelectedDeal={setSelectedDeal}
                  type="pickingUp"
                />
              </div>
            </MinimalCard>
            <MinimalCard>
              <div className="border-l-4 border-blue-500 pl-2 h-full">
                <div className="text-lg text-center mb-4">Shipping</div>
                <DealsListCard
                  deals={shippingToday}
                  setSelectedDeal={setSelectedDeal}
                  type="shipping"
                />
              </div>
            </MinimalCard>

            {/* <div>{coordinatorName}</div> */}
          </div>
        </div>
      );
    }
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
  mode,
}: {
  result: any;
  updateField: (field: string, value: string) => void;
  mode: "coordinator" | "owner" | "reviewer";
}) => {
  const { metrics, dailyClosedDeals, weeklyClosedDeals } = result.data;
  return (
    <MinimalCard>
      <div className="text-lg text-center">Closed Today</div>
      <RatioDisplay
        numerator={dailyClosedDeals}
        denominator={metrics.dailyGoal}
        onUpdate={
          mode === "owner"
            ? (value) => {
                updateField("dailyGoal", value);
              }
            : undefined
        }
      />
      <hr />

      <div className="text-lg text-center">Closed This Week</div>
      <RatioDisplay
        numerator={weeklyClosedDeals}
        denominator={metrics.monthlyGoal}
        onUpdate={
          mode === "owner"
            ? (value) => {
                updateField("weeklyGoal", value);
              }
            : undefined
        }
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

export const ActiveDealsCard = ({
  result,
  mode,
}: {
  result: any;
  mode: "coordinator" | "owner" | "reviewer";
}) => {
  return (
    <MinimalCard>
      <div className="text-lg text-center">Active Deals</div>
      <div
        className={cn(
          `text-black-500 text-center font-bold`,
          mode === "owner" ? "text-4xl mb-4" : "text-8xl"
        )}
      >
        {result.data.activeDeals}
      </div>
      {mode === "owner" && (
        <>
          <div className="border-t border-black pt-4">
            {(Object.keys(result.data.activeDealsByNegotiator || {}) || []).map(
              (coordinatorName, idx) => (
                <div key={coordinatorName}>
                  {coordinatorName}:{" "}
                  {result.data.activeDealsByNegotiator[coordinatorName]}
                </div>
              )
            )}
          </div>
        </>
      )}
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
      <MinimalCard noGrid>
        <div className="border-l-4 border-blue-500 pl-2 h-full">
          <div className="text-lg text-center mb-4">Picking up today</div>
          <DealsListCard
            deals={result.data.pickingUpToday}
            setSelectedDeal={setSelectedDeal}
            type="pickingUp"
          />
        </div>
      </MinimalCard>
      <MinimalCard noGrid>
        <div className="border-l-4 border-blue-500 pl-2 h-full">
          <div className="text-lg text-center mb-4">Shipping</div>
          <DealsListCard
            deals={result.data.shippingToday}
            setSelectedDeal={setSelectedDeal}
            type="shipping"
          />
        </div>
      </MinimalCard>
    </>
  );
};

export const MinimalCard = ({
  children,
  noGrid,
}: {
  children: React.ReactNode;
  noGrid?: boolean;
}) => {
  return (
    <div
      className={cn(
        `-m-2 rounded-3xl ring-1 shadow-[inset_0_0_2px_1px_#ffffff4d] ring-black/5 max-lg:mx-auto max-lg:w-full max-lg:max-w-md mb-4 p-4 max-w-[250px] w-[250px] min-h-[200px]`,
        !noGrid && "grid grid-cols-1"
      )}
    >
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
  type,
}: {
  deals: NegotiationDataType[];
  setSelectedDeal: (deal: NegotiationDataType) => void;
  type: "pickingUp" | "shipping";
}) => {
  return (
    <div className="flex flex-col gap-2 border-t border-black pt-4 max-h-[200px] overflow-y-auto pr-2 pl-2 pb-4">
      {deals?.length ? (
        deals.map((deal) => (
          <DealDisplay
            key={deal.id}
            deal={deal}
            setSelectedDeal={setSelectedDeal}
            type={type}
          />
        ))
      ) : (
        <div className="text-center">No deals</div>
      )}
    </div>
  );
};

export const DealDisplay = ({
  deal,
  setSelectedDeal,
  type,
}: {
  deal: NegotiationDataType;
  setSelectedDeal: (deal: NegotiationDataType) => void;
  type: "pickingUp" | "shipping";
}) => {
  const [checked, setChecked] = useState(
    deal.pickingUpSelectedCoordinatorId ||
      deal.shippingSelectedCoordinatorId ||
      false
  );
  const user = useLoggedInUser();

  const updateCheckState = (isChecked: boolean) => {
    const negotiations = collection(db, "delivrd_negotiations");
    const docRef = doc(negotiations, deal.id);
    if (user.id) {
      updateDoc(docRef, {
        [`${type}SelectedCoordinatorId`]: isChecked ? user?.id : null,
      });
    }
  };

  return (
    <div
      key={deal.id}
      className="text-blue-500 cursor-pointer rounded ring-1 shadow-[inset_0_0_2px_1px_#ffffff4d] p-2 flex gap-2"
    >
      <Checkbox
        className="mt-auto mb-auto data-[state=checked]:bg-blue-500 border-blue-500 border-2 w-6 h-6"
        checked={checked ? false : true}
        onCheckedChange={() => {
          setChecked(!checked);
          updateCheckState(!checked);
        }}
      />
      <div
        className="flex justify-between w-full"
        onClick={() => setSelectedDeal(deal)}
      >
        <span className="flex-shrink-1">{deal.clientNamefull}</span>
        <ChevronRight className="w-6 h-6 mr-0 ml-auto flex-shrink-0" />
      </div>
    </div>
  );
};
