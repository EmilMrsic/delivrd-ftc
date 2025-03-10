import { Search } from "lucide-react";
import { Button } from "../ui/button";
import FilterPopup from "./filter-popup";
import SearchAll from "./search-all";
import { Input } from "../ui/input";
import { useRouter } from "next/navigation";

export const TeamDashboardFilters = ({
  allDealNegotiator,
  filters,
  handleFilterChange,
  clearFilters,
  setCurrentDeals,
  searchTerm,
  handleSearch,
}: any) => {
  const router = useRouter();
  return (
    <>
      <div className="items-center mb-4 mt-4">
        <div>
          <Button onClick={() => router.push("/manager")} newDefault={true}>
            <p>Manager View</p>
          </Button>
        </div>
        <div className="flex gap-3 mt-4">
          <div className="w-fit mr-0 ml-auto flex gap-2">
            <Input
              type="text"
              placeholder="Search deals..."
              value={searchTerm}
              onChange={handleSearch}
              className="pl-8 max-w-[300px] mt-auto mb-auto"
            />
            <Button onClick={clearFilters} newDefault={true}>
              <p>Clear filters</p>
            </Button>
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
