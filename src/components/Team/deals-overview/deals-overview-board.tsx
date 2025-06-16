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
import { ChevronDown, ChevronRight, ChevronUp } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useLoggedInUser } from "@/hooks/useLoggedInUser";
import { DealsView } from "../deals-view";
import { DropDownMenu } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

// https://thankyuu.notion.site/Dashboards-1e5aa77aecd1805ea5b6c55bdaef2fb9

export const DealsOverviewBoard = ({
  mode,
}: {
  mode: "coordinator" | "owner" | "reviewer";
}) => {
  const user = useLoggedInUser();
  const [expanded, setExpanded] = useState(true);
  const [selectedCoordinator, setSelectedCoordinator] = useState<string | null>(
    "Tomislav Mikula"
  );
  const [selectedDeal, setSelectedDeal] = useState<NegotiationDataType | null>(
    null
  );
  const [dealView, setDealView] = useState<{
    deals: NegotiationDataType[];
  } | null>(null);
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
          const tableName = mode === "coordinator" ? "users" : "metrics";
          const tableRowId =
            mode === "coordinator" ? user?.id : result.data.metrics.id;
          const table = collection(db, tableName);
          const docRef = doc(table, tableRowId);
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
        className="w-fit flex gap-2 mt-4 text-xl font-bold cursor-pointer"
        onClick={() => {
          setExpanded(!expanded);
        }}
      >
        {expanded ? (
          <ChevronUp className="w-8 h-8" />
        ) : (
          <ChevronDown className="w-8 h-8" />
        )}
        Metrics Overview
      </div>
      {expanded && (
        <>
          {mode === "reviewer" && (
            <div className="w-fit ml-auto mr-0 flex gap-2">
              <DropDownMenu
                label="Coordinator"
                checkedItem={selectedCoordinator || undefined}
                options={Object.keys(
                  result.data.shippingAndPickingUpTodayByCoordinator
                ).map((coordinatorName) => coordinatorName)}
                onCheckedChange={(checked, item) => {
                  setSelectedCoordinator(item);
                }}
              />
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedCoordinator(null);
                }}
              >
                Display All
              </Button>
            </div>
          )}
          {mode === "reviewer" && !selectedCoordinator && (
            <div className="w-fit mr-auto ml-auto">
              <ActiveDealsCard result={result} mode={mode} />
            </div>
          )}
          <div
            className={cn(
              `flex gap-8 w-fit ml-auto mr-auto mt-8 flex-wrap`,
              mode === "reviewer" && "mt-[48px]"
            )}
          >
            {(selectedCoordinator || mode !== "reviewer") && (
              <ActiveDealsCard result={result} mode={mode} />
            )}
            {mode === "owner" && (
              <SalesCard result={result} updateField={updateField} />
            )}
            {["owner", "coordinator"].includes(mode) && (
              <ClosedDealsCard
                result={result}
                updateField={updateField}
                setDealView={setDealView}
                mode={mode}
              />
            )}
            {mode === "coordinator" && (
              <PickingUpAndShippingCard
                result={result}
                setSelectedDeal={setSelectedDeal}
              />
            )}
            {mode === "owner" && (
              <CoordinatorClosedDealsCard
                result={result}
                setDealView={setDealView}
              />
            )}
            {mode === "reviewer" && (
              <CoordinatorsMultiPickingUpAndShippingCard
                selectedCoordinator={selectedCoordinator}
                result={result}
                setSelectedDeal={setSelectedDeal}
              />
            )}
          </div>
          {dealView && (
            <TailwindPlusModal
              close={() => setDealView(null)}
              noClose
              closeButton
              width={40}
              height={80}
            >
              <DealsView
                deals={dealView.deals}
                setSelectedDeal={setSelectedDeal}
              />
            </TailwindPlusModal>
          )}
          {selectedDeal && (
            <TailwindPlusModal
              close={() => setSelectedDeal(null)}
              noClose
              closeButton
              width={80}
              height={80}
            >
              <ClientProfile negotiationId={selectedDeal.id} />
            </TailwindPlusModal>
          )}
        </>
      )}
    </>
  );
};

export const CoordinatorsMultiPickingUpAndShippingCard = ({
  result,
  setSelectedDeal,
  selectedCoordinator,
}: {
  result: any;
  setSelectedDeal: (deal: NegotiationDataType) => void;
  selectedCoordinator: string | null;
}) => {
  return Object.keys(result.data.shippingAndPickingUpTodayByCoordinator)
    .filter((coordinatorName) => {
      if (!selectedCoordinator) return true;
      return coordinatorName === selectedCoordinator;
    })
    .map((coordinatorName) => {
      const { pickingUpToday, shippingToday } =
        result.data.shippingAndPickingUpTodayByCoordinator[coordinatorName];
      return (
        <div key={coordinatorName} className="flex-shrink-1 max-w-[400px]">
          <div className="text-xl text-black-500 font-bold text-center mt-[-35px] mb-4">
            {coordinatorName}
          </div>
          <div className="flex gap-6 flex-shrink-1">
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
    });
};

export const CoordinatorClosedDealsCard = ({
  result,
  setDealView,
}: {
  result: any;
  setDealView: (deals: { deals: NegotiationDataType[] }) => void;
}) => {
  return (
    <MinimalCard>
      <div className="text-lg text-center">Deal Coordinators</div>
      <div>
        {Object.keys(result.data.coordinatorSalesThisWeek).map(
          (coordinatorId) => (
            <div
              key={coordinatorId}
              className="mb-2 cursor-pointer"
              onClick={() =>
                setDealView({
                  deals:
                    result.data.coordinatorSalesThisWeek[coordinatorId].sales
                      .deals,
                })
              }
            >
              <div className="flex justify-between">
                <div>
                  {
                    result.data.coordinatorSalesThisWeek[coordinatorId]
                      .coordinatorName
                  }
                </div>
                <div>
                  {
                    result.data.coordinatorSalesThisWeek[coordinatorId].sales
                      .count
                  }
                </div>
              </div>
              <TailwindPlusProgressBar
                numerator={
                  result.data.coordinatorSalesThisWeek[coordinatorId].sales
                    .count
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
  setDealView,
}: {
  result: any;
  updateField: (field: string, value: string) => void;
  mode: "coordinator" | "owner" | "reviewer";
  setDealView: (deals: { deals: NegotiationDataType[] }) => void;
}) => {
  const { metrics, dailyClosedDeals, weeklyClosedDeals } = result.data;

  return (
    <MinimalCard>
      <div className="text-lg text-center">Closed Today</div>
      <RatioDisplay
        numerator={dailyClosedDeals.count}
        numeratorAction={() =>
          setDealView({
            deals: dailyClosedDeals.deals,
          })
        }
        denominator={metrics.dailyGoal}
        onUpdate={(value) => {
          updateField("dailyGoal", value);
        }}
      />
      <hr />

      <div className="text-lg text-center">Closed This Week</div>
      <RatioDisplay
        numerator={weeklyClosedDeals.count}
        numeratorAction={() =>
          setDealView({
            deals: weeklyClosedDeals.deals,
          })
        }
        denominator={metrics?.weeklyGoal || metrics?.monthlyGoal || 0}
        onUpdate={(value) => {
          updateField("weeklyGoal", value);
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
          denominator={result.data.metrics.monthlySalesGoal}
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
      {(mode === "owner" || mode === "reviewer") && (
        <>
          <div className="border-t border-black pt-4">
            <div key="unassigned">
              Unassigned: {result.data.activeDealsByNegotiator["Unassigned"]}
            </div>
            {(Object.keys(result.data.activeDealsByNegotiator || {}) || [])
              .filter(
                (coordinatorName: string) => coordinatorName !== "Unassigned"
              )
              .map((coordinatorName: string, idx: number) => (
                <div key={coordinatorName}>
                  {coordinatorName}:{" "}
                  {result.data.activeDealsByNegotiator[coordinatorName]}
                </div>
              ))}
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
  numeratorAction,
  onUpdate,
}: {
  numerator: number;
  denominator: number;
  numeratorAction?: () => void;
  onUpdate?: (value: string) => void;
}) => (
  <div className="text-4xl font-bold mt-2 mb-4 flex justify-center">
    {/* <div className="flex justify-center"> */}
    <span
      className={`mr-2 ${numeratorAction ? "cursor-pointer" : ""}`}
      onClick={numeratorAction}
    >
      {numerator}
    </span>{" "}
    /{" "}
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

  console.log("checked:", checked ? false : true);

  return (
    <div
      key={deal.id}
      className="text-blue-500 cursor-pointer rounded ring-1 shadow-[inset_0_0_2px_1px_#ffffff4d] p-2 flex gap-2"
    >
      <Checkbox
        className="mt-auto mb-auto data-[state=checked]:bg-blue-500 border-blue-500 border-2 w-6 h-6"
        checked={checked ? true : false}
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
