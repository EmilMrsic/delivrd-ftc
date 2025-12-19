import { Search } from "lucide-react";
import { Button } from "../ui/button";
import FilterPopup from "./filter-popup";
import SearchAll from "./search-all";
import { Input } from "../ui/input";
import { useRouter } from "next/navigation";
import { Checkbox } from "../ui/checkbox";
import { DealsOverviewBoard } from "./deals-overview/deals-overview-board";
import { useLoggedInUser } from "@/hooks/useLoggedInUser";
import { useIsMobile } from "@/hooks/useIsMobile";
import { useTeamDashboardFiltersState } from "@/lib/state/team-dashboard-filters";

export const TeamDashboardFilters = ({
  allDealNegotiator,
  filters,
  handleFilterChange,
  clearFilters,
  searchTerm,
  handleSearch,
  searchAll,
  setSearchAll,
  archive,
  setArchive,
}: any) => {
  const updateFilter = useTeamDashboardFiltersState(
    (state) => state.updateFilter
  );
  const hasIncomingBids = useTeamDashboardFiltersState(
    (state) => state.hasIncomingBids
  );
  const hasTradeInBids = useTeamDashboardFiltersState(
    (state) => state.hasTradeInBids
  );

  const hasFastLane = useTeamDashboardFiltersState(
    (state) => state.hasFastLane
  );
  // const clearFilterState = useTeamDashboardFiltersState(
  //   (state) => state.clearFilters
  // );
  const user = useLoggedInUser();
  const router = useRouter();
  const isMobile = useIsMobile();

  if (!user) return null;
  const overviewMode =
    process.env.NEXT_PUBLIC_TESTING_METRICS_DASHBOARD_OVERRIDE ??
    (user?.mode || "coordinator");

  return (
    <>
      <div className="items-center mb-4 mt-4">
        <div className="flex gap-3 mx-auto w-fit">
          <Button onClick={() => router.push("/manager")} newDefault={true}>
            <p>Manager {isMobile ? "" : "View"}</p>
          </Button>
          <Button
            onClick={() => router.push("/mode/consult")}
            newDefault={true}
          >
            <p>Consult {isMobile ? "" : "Mode"}</p>
          </Button>
          <Button
            onClick={() => router.push("/mode/dealers")}
            newDefault={true}
          >
            <p>FTC {isMobile ? "" : "Table"}</p>
          </Button>
        </div>
        <DealsOverviewBoard mode={overviewMode} />
        <div className="flex gap-3 mt-4">
          <div className="w-fit mr-0 ml-auto gap-2">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Search deals..."
                value={searchTerm}
                onChange={handleSearch}
                className="pl-8 max-w-[300px] mt-auto mb-auto"
              />
              {/* <div className="flex gap-2 items-center w-fit">
                <Checkbox
                  id="search_all"
                  checked={searchAll}
                  onCheckedChange={setSearchAll}
                />
                <label htmlFor="search_all" className="text-nowrap">
                  All Deals
                </label>
              </div> */}
              <div className="flex gap-2 items-center w-fit">
                <Checkbox
                  id="search_all"
                  checked={archive}
                  onCheckedChange={setArchive}
                />
                <label htmlFor="search_all" className="text-nowrap">
                  Archive
                </label>
              </div>
            </div>
            <div className="flex w-fit mr-0 ml-auto gap-2">
              <Checkbox
                id="incoming_bids"
                checked={hasIncomingBids}
                onCheckedChange={(checked) =>
                  updateFilter({ hasIncomingBids: checked as boolean })
                }
              />
              <label htmlFor="incoming_bids" className="text-nowrap">
                Has Incoming Bids
              </label>
              <Checkbox
                id="trade_ins"
                checked={hasTradeInBids}
                onCheckedChange={(checked) =>
                  updateFilter({ hasTradeInBids: checked as boolean })
                }
              />
              <label htmlFor="trade_ins" className="text-nowrap">
                Has Trade-In Bids
              </label>
              <Checkbox
                id="fast_lane"
                checked={hasFastLane}
                onCheckedChange={(checked) =>
                  updateFilter({ hasFastLane: checked as boolean })
                }
              />
              <label htmlFor="fast_lane" className="text-nowrap">
                Fast Lane
              </label>
            </div>
            <div className="mt-2 mr-0 ml-auto w-fit">
              <Button onClick={clearFilters} newDefault={true}>
                <p>Clear filters</p>
              </Button>
            </div>
          </div>
        </div>
        <div className="w-fit ml-auto mr-auto mt-4 flex">
          <FilterPopup
            dealCoordinators={allDealNegotiator}
            handleFilterChange={handleFilterChange}
            filters={filters}
          />
        </div>
      </div>
    </>
  );
};
