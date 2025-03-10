import { cn } from "@/lib/utils";
import { TableSortButton } from "./table-sort-button";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  Header,
} from "@tanstack/react-table";
import { useState } from "react";

interface HeaderWithConfig {
  header: string;
  config?: {
    sortable?: boolean;
    key?: string;
  };
}

export const TailwindPlusTable = ({
  headers,
  rows,
  sortConfig,
  setSortConfig,
  sortData,
}: {
  headers: (string | HeaderWithConfig)[];
  rows: any[];
  sortConfig: {
    key: string;
    direction: string;
  };
  setSortConfig: (config: { key: string; direction: string }) => void;
  sortData: (key: string, direction: string) => void;
}) => {
  const table = useReactTable({
    data: rows,
    columns: headers.map((header) => ({
      header: typeof header === "string" ? header : header.header,
      accessorKey: typeof header === "string" ? header : header.header,
    })),
    getCoreRowModel: getCoreRowModel(),
  });

  return (
    <div className="-mx-4 -my-2 sm:-mx-6 max-w-full overflow-x-scroll">
      <div className="inline-block min-w-full max-w-full py-2 align-middle">
        <table className="min-w-full border-separate border-spacing-0 divide-y divide-gray-200">
          <thead>
            {table.getHeaderGroups().map((headerGroup, idx) => (
              <tr key={headerGroup.id} className="divide-x divide-gray-200">
                {headerGroup.headers.map((header, idx) => {
                  return (
                    <TailwindTableHeader
                      key={header.id}
                      header={header}
                      headerConfig={headers[idx]}
                      sortConfig={sortConfig}
                      setSortConfig={setSortConfig}
                      sortData={sortData}
                    />
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="divide-x divide-gray-200">
                {row.map((cell, idx) => (
                  <TailwindTableCell key={`table-cell-${idx}`} cell={cell} />
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const TailwindTableHeader = ({
  header,
  headerConfig,
  sortConfig,
  setSortConfig,
  sortData,
}: {
  // header: string | HeaderWithConfig;
  header: Header<any, any>;
  headerConfig: HeaderWithConfig | string;
  sortConfig: {
    key: string;
    direction: string;
  };
  setSortConfig: (config: { key: string; direction: string }) => void;
  sortData: (key: string, direction: string) => void;
}) => {
  return (
    <th
      scope="col"
      className={cn(
        `group sticky top-0 z-10 border-b border-gray-300 bg-white/75 py-3.5 pr-3 text-left text-sm font-semibold text-gray-900 backdrop-blur-sm backdrop-filter py-3 pl-4`
      )}
      style={{
        width: header.column.getSize(),
        minWidth: header.column.getSize(),
      }}
    >
      {typeof headerConfig === "object" && headerConfig?.config?.sortable ? (
        <div
          className="inline-flex items-center cursor-pointer"
          onClick={() => {
            if (headerConfig?.config?.sortable) {
              const direction =
                sortConfig.key === headerConfig?.config?.key &&
                sortConfig.direction === "ascending"
                  ? "descending"
                  : "ascending";

              setSortConfig({ key: headerConfig?.config?.key, direction });
              sortData(headerConfig?.config?.key, direction);
            }
          }}
        >
          {flexRender(header.column.columnDef.header, header.getContext())}
          {typeof headerConfig === "object" &&
            headerConfig?.config?.sortable && (
              <TableSortButton
                direction={
                  sortConfig.key === headerConfig?.config?.key &&
                  sortConfig.direction === "ascending"
                    ? "descending"
                    : "ascending"
                }
              />
            )}
        </div>
      ) : (
        flexRender(header.column.columnDef.header, header.getContext())
      )}
      <div
        {...{
          onMouseDown: header.getResizeHandler(),
          onTouchStart: header.getResizeHandler(),
          className: cn(
            `absolute right-0 top-0 h-full cursor-col-resize bg-[transparent] w-2 mr-[-5px]`,
            header.column.getIsResizing() ? "bg-blue-500" : ""
          ),
        }}
      />
    </th>
  );
};

export const TailwindTableCell = ({ cell }: any) => {
  const text = typeof cell === "object" && cell?.text ? cell.text : cell;
  const Component =
    typeof cell === "object" && cell?.Component ? cell.Component : null;

  return (
    <td
      key={cell}
      className={cn(
        `px-3 py-4 text-sm whitespace-nowrap text-gray-500 sm:table-cell text-wrap`,
        typeof cell === "object" && cell?.config?.maxWidth
          ? `min-w-[${cell.config.maxWidth}]`
          : ""
      )}
    >
      {typeof cell === "object" && cell?.Component ? <Component /> : text}
    </td>
  );
};
