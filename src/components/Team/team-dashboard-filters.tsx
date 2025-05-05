import { Search } from "lucide-react";
import { Button } from "../ui/button";
import FilterPopup from "./filter-popup";
import SearchAll from "./search-all";
import { Input } from "../ui/input";
import { useRouter } from "next/navigation";
import { Checkbox } from "../ui/checkbox";
import { DealsOverviewBoard } from "./deals-overview/deals-overview-board";

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
  const router = useRouter();
  return (
    <>
      <div className="items-center mb-4 mt-4">
        <div className="flex gap-3">
          <Button onClick={() => router.push("/manager")} newDefault={true}>
            <p>Manager View</p>
          </Button>
          <Button
            onClick={() => router.push("/mode/consult")}
            newDefault={true}
          >
            <p>Consult Mode</p>
          </Button>
        </div>
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
              <div className="flex gap-2 items-center w-fit">
                <Checkbox
                  id="search_all"
                  checked={searchAll}
                  onCheckedChange={setSearchAll}
                />
                <label htmlFor="search_all" className="text-nowrap">
                  All Deals
                </label>
              </div>
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
            <div className="mt-2 mr-0 ml-auto w-fit">
              <Button onClick={clearFilters} newDefault={true}>
                <p>Clear filters</p>
              </Button>
            </div>
          </div>
        </div>
        <DealsOverviewBoard mode="owner" />
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
