import { cn } from "@/lib/utils";
import { TableSortButton } from "./table-sort-button";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  Header,
} from "@tanstack/react-table";
import { useEffect, useRef, useState } from "react";
import { Expand } from "lucide-react";
import Link from "next/link";
import { TailwindPlusModal } from "./modal";

interface HeaderConfig {
  sortable?: boolean;
  key?: string;
  size?: number;
}

interface HeaderWithConfig {
  header: string;
  config?: HeaderConfig;
}

interface CellConfig {
  expandable?: boolean;
  expandedComponent?: React.ComponentType<any>;
  expandedSize?: "full" | "normal";
  link?: string;
}

interface Cell {
  text?: string | null | number;
  Component?: React.ComponentType<any>;
  config?: CellConfig;
}

interface RowConfig {
  backgroundColor?: string;
}

export const TailwindPlusTable = ({
  headers,
  rows,
  sortConfig,
  setSortConfig,
  sortData,
  rowConfigs,
}: {
  headers: (string | HeaderWithConfig)[];
  rows: (Cell | string | undefined | null)[][];
  sortConfig: {
    key: string;
    direction: string;
  };
  setSortConfig: (config: { key: string; direction: string }) => void;
  sortData: (key: string, direction: string) => void;
  rowConfigs?: RowConfig[];
}) => {
  const [expanded, setExpanded] = useState<null | [number, number]>(null);

  const table = useReactTable({
    data: rows,
    columns: headers.map((header) => {
      const headerObj: {
        header: string;
        accessorKey: string;
        size?: number;
      } = {
        header: typeof header === "string" ? header : header.header,
        accessorKey: typeof header === "string" ? header : header.header,
      };

      if (typeof header === "object" && header.config?.size) {
        headerObj.size = header.config.size;
      }

      return headerObj;
    }),
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: "onChange",
    enableColumnResizing: true,
  });

  return (
    <>
      <div className="min-w-full max-w-full w-full overflow-x-scroll">
        <div className="w-full py-2 align-middle">
          <table className="min-w-full border-separate border-spacing-0 divide-y divide-x divide-gray-200">
            <thead>
              {table.getHeaderGroups().map((headerGroup, idx) => (
                <tr key={headerGroup.id}>
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
              {rows.map((row, rowIdx) => {
                const rowConfig = rowConfigs?.[rowIdx] ?? {};
                const { backgroundColor } = rowConfig;
                return (
                  <tr
                    key={`row-${rowIdx}`}
                    className={cn(
                      `divide-x divide-gray-200`,
                      backgroundColor
                        ? backgroundColor
                        : rowIdx % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50"
                    )}
                  >
                    {row.map((cell, cellIdx) => (
                      <TailwindTableCell
                        key={`table-cell-${rowIdx}-${cellIdx}`}
                        cell={cell}
                        rowIdx={rowIdx}
                        cellIdx={cellIdx}
                        setExpanded={setExpanded}
                      />
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
      {expanded && (
        <TailwindTableExpandedPopover
          cell={rows[expanded[0]][expanded[1]] as Cell}
          setExpanded={setExpanded}
          expanded={expanded}
        />
      )}
    </>
  );
};

export const TailwindTableExpandedPopover = ({
  cell,
  setExpanded,
  expanded,
}: {
  cell: Cell;
  setExpanded: (expanded: [number, number] | null) => void;
  expanded: [number, number] | null;
}) => {
  const Component = cell.config?.expandedComponent;

  return (
    <TailwindPlusModal close={() => setExpanded(null)} width={90} height={90}>
      {Component && <Component setExpanded={setExpanded} expanded={expanded} />}
      <div className="text-right mt-4">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => setExpanded(null)}
        >
          Close
        </button>
      </div>
    </TailwindPlusModal>
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
            if (headerConfig?.config?.sortable && headerConfig?.config?.key) {
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

export const TailwindTableCell = ({
  cell,
  rowIdx,
  cellIdx,
  setExpanded,
}: {
  cell: Cell | string | null | undefined;
  rowIdx: number;
  cellIdx: number;
  setExpanded: (expanded: [number, number] | null) => void;
}) => {
  let text: string;
  if (typeof cell === "object") {
    if (cell?.text !== undefined && cell?.text !== null) {
      text = cell?.text.toString();
    } else {
      text = "";
    }
  } else {
    text = cell ?? "";
  }

  const Component =
    typeof cell === "object" && cell?.Component ? cell.Component : null;

  const TDContents = (
    <>
      {typeof cell === "object" && cell?.config?.expandable && (
        <div className="w-fit mr-0 ml-auto">
          <button
            className="transform  text-gray-500 hover:text-gray-700"
            title="Expand"
            onClick={() => {
              setExpanded([rowIdx, cellIdx]);
            }}
          >
            <Expand size={16} className="text-gray-500 hover:text-gray-700" />
          </button>
        </div>
      )}
      {Component ? <Component /> : text}
    </>
  );

  return (
    <td
      key={`cell-${rowIdx}-${cellIdx}`}
      className={cn(
        `px-3 py-4 text-sm whitespace-nowrap text-gray-500 sm:table-cell text-wrap`
      )}
    >
      {typeof cell === "object" && cell?.config?.link ? (
        <Link href={cell.config.link}>{TDContents}</Link>
      ) : (
        TDContents
      )}
    </td>
  );
};
