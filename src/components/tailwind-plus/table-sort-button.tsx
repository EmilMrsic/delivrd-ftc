import { ChevronDownIcon, ChevronUpIcon } from "@heroicons/react/24/outline";

export const TableSortButton = ({ direction }: { direction: string }) => {
  return (
    <span className="ml-2 flex-none rounded-sm text-gray-400 group-hover:visible group-focus:visible bg-gray-200 border-rounded-sm border-gray-300">
      {direction === "ascending" ? (
        <ChevronDownIcon aria-hidden="true" className="size-5" />
      ) : (
        <ChevronUpIcon aria-hidden="true" className="size-5" />
      )}
    </span>
  );
};
