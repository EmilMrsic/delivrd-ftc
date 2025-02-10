import React, { useEffect } from "react";
import { dealStageOptions, vehicleOfInterest } from "@/lib/utils";

import { Button } from "../ui/button";
import { NegotiationData } from "@/types";

type TeamTablePaginationProps = {
  totalPages: number;
  currentPage: number;
  setCurrentPage: (item: number) => void;
  itemsPerPage: number;
  handleItemsPerPageChange: (
    item: React.ChangeEvent<HTMLSelectElement>
  ) => void;
  filteredDeal: NegotiationData[];
  setCurrentDeal: (item: NegotiationData[]) => void;
};

const TeamTablePagination = ({
  totalPages,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  handleItemsPerPageChange,
  filteredDeal,
  setCurrentDeal,
}: TeamTablePaginationProps) => {
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  const itemsPerPageOptions = [25, 50, 75, 100];

  useEffect(() => {
    const startIdx = (currentPage - 1) * itemsPerPage;
    const endIdx = currentPage * itemsPerPage;
    const currentDeals = filteredDeal.slice(startIdx, endIdx);
    setCurrentDeal(currentDeals);
  }, [currentPage, itemsPerPage, filteredDeal]);

  return (
    <div className="flex justify-between items-center mt-4">
      <Button
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="px-4 py-2 text-white bg-black rounded disabled:opacity-50"
      >
        Previous
      </Button>
      <span className="flex items-center gap-5">
        Page {currentPage} of {totalPages}
        <div className="flex items-center justify-end gap-3">
          <select
            id="items-per-page"
            value={itemsPerPage}
            onChange={handleItemsPerPageChange}
            className="border border-gray-300 rounded px-2 py-1"
          >
            {itemsPerPageOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <label htmlFor="items-per-page" className="mr-2">
            Items per page
          </label>
        </div>
      </span>
      <Button
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="px-4 py-2 text-white bg-black rounded disabled:opacity-50"
      >
        Next
      </Button>
    </div>
  );
};

export default TeamTablePagination;
