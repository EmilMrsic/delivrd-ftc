import { ChevronDownIcon } from "@heroicons/react/24/outline";

export const TableSortButton = () => {
  return (
    <span className="ml-2 flex-none rounded-sm text-gray-400 group-hover:visible group-focus:visible bg-gray-200 border-rounded-sm border-gray-300">
      <ChevronDownIcon aria-hidden="true" className="size-5" />
    </span>
  );
};
