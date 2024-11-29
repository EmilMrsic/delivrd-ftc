import React from "react";
import { dealStageOptions, vehicleOfInterest } from "@/lib/utils";

import { Button } from "../ui/button";

type TeamTablePaginationProps = {
  totalPages: number;
  currentPage: number;
  setCurrentPage: (item: number) => void;
  itemsPerPage: number;
  handleItemsPerPageChange: (
    item: React.ChangeEvent<HTMLSelectElement>
  ) => void;
};

const TeamTablePagination = ({
  totalPages,
  currentPage,
  setCurrentPage,
  itemsPerPage,
  handleItemsPerPageChange,
}: TeamTablePaginationProps) => {
  const handlePageChange = (page: number) => {
    if (page > 0 && page <= totalPages) {
      setCurrentPage(page);
    }
  };
  const itemsPerPageOptions = [25, 50, 75, 100];

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
