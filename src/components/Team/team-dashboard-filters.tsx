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
      <div className="flex gap-3 items-center mb-4 mt-4">
        <div className="relative ">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-500" />
          <Input
            type="text"
            placeholder="Search deals..."
            value={searchTerm}
            onChange={handleSearch}
            className="pl-8"
          />
        </div>
        <Button
          onClick={() => router.push("/manager")}
          variant="outline"
          className={`cursor-pointer p-1 w-fit h-fit text-xs bg-gray-100 text-gray-800 border-gray-300`}
        >
          <p>Manager View</p>
        </Button>

        <FilterPopup
          dealCoordinators={allDealNegotiator}
          handleFilterChange={handleFilterChange}
          filters={filters}
        />
        <Button
          onClick={clearFilters}
          variant="outline"
          className={`cursor-pointer p-1 w-fit h-fit text-xs bg-gray-100 text-gray-800 border-gray-300`}
        >
          <p>Clear filters</p>
        </Button>
        <SearchAll setCurrentDeals={setCurrentDeals} />
      </div>
    </>
  );
};
