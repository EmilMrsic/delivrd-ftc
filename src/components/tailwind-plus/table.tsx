import { cn } from "@/lib/utils";
import { TableSortButton } from "./table-sort-button";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  Header,
} from "@tanstack/react-table";
import { useEffect, useState } from "react";
import { Expand } from "lucide-react";
import Link from "next/link";
import { TailwindPlusModal } from "./modal";
import { useIsMobile } from "@/hooks/useIsMobile";

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
  onExpandedClose?: () => void;
  link?: string;
  noExpandButton?: boolean;
  noCloseButton?: boolean;
  mobileSingleRow?: boolean;
  topDivider?: boolean;
}

export interface CellDescriptor {
  mobileHeader?: string | React.ComponentType<any>;
  cta?: React.ComponentType<any>;
  subRow?: {
    Component: React.ComponentType<any>;
  };
}

interface Cell {
  text?: string | null | number;
  Component?: React.ComponentType<any>;
  config?: CellConfig;
  descriptor?: CellDescriptor;
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
  isLoading,
  pagination,
  pageLimit,
}: {
  headers: (string | HeaderWithConfig)[];
  rows: (Cell | string | number | undefined | null | any)[][];
  sortConfig?: {
    key: string;
    direction: string;
  };
  setSortConfig?: (config: { key: string; direction: string }) => void;
  sortData?: (key: string, direction: string) => void;
  rowConfigs?: RowConfig[];
  isLoading?: boolean;
  pagination?: boolean;
  pageLimit?: number;
}) => {
  const isMobile = useIsMobile();
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

  const useableRows = pagination ? rows.slice(0, pageLimit) : rows;

  return (
    <>
      <div className="min-w-full max-w-full w-full overflow-x-scroll">
        <div className="w-full py-2 align-middle">
          <table className="min-w-full border-separate border-spacing-0 divide-y divide-x divide-gray-200">
            {!isMobile && (
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
            )}
            <tbody>
              {isLoading ? (
                <>Loading</>
              ) : (
                useableRows.map((row, rowIdx) => {
                  const rowConfig = rowConfigs?.[rowIdx] ?? {};
                  const { backgroundColor } = rowConfig;
                  let useableRow = row;
                  let SubRow: any = null;
                  if (row[0]?.descriptor) {
                    // useableRow = row.slice(1);
                    if (row[0]?.descriptor?.subRow?.Component) {
                      SubRow = row[0]?.descriptor?.subRow?.Component;
                    }
                  }

                  let hasDescriptor = false;
                  const rowCells = (
                    <>
                      {row.map((cell, cellIdx) => {
                        if (cell?.descriptor) {
                          hasDescriptor = true;
                          return <></>;
                        }

                        const useableCellIndex = hasDescriptor
                          ? cellIdx - 1
                          : cellIdx;

                        return (
                          <TailwindTableCell
                            key={`table-cell-${rowIdx}-${cellIdx}`}
                            cell={cell}
                            rowIdx={rowIdx}
                            cellIdx={cellIdx}
                            setExpanded={setExpanded}
                            isMobile={isMobile}
                            headerName={
                              headers &&
                              typeof headers[useableCellIndex] === "string"
                                ? headers[useableCellIndex]
                                : (
                                    headers[
                                      useableCellIndex
                                    ] as HeaderWithConfig
                                  )?.header
                            }
                          />
                        );
                      })}
                    </>
                  );

                  const CTA = row[0]?.descriptor?.cta;
                  const MobileHeader = row[0]?.descriptor?.mobileHeader;
                  return isMobile ? (
                    <div className="border-2 rounded-md border-gray-200 mb-4 relative">
                      <div className="flex flex-wrap mb-4 bg-[#F9FAFB] p-2">
                        {row[0]?.descriptor?.mobileHeader && (
                          <div
                            className={cn(
                              `font-bold text-normal`,
                              row[0].descriptor.cta && "w-[50%]"
                            )}
                          >
                            {typeof MobileHeader === "string" ? (
                              MobileHeader
                            ) : (
                              <MobileHeader />
                            )}
                          </div>
                        )}
                        {row[0]?.descriptor?.cta && (
                          <div className="absolute right-2 top-2">
                            <CTA />
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap">{rowCells}</div>
                      {SubRow && (
                        <div className="mt-4">
                          <SubRow />
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
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
                        {rowCells}
                      </tr>
                      {SubRow && (
                        <tr>
                          <SubRow />
                        </tr>
                      )}
                    </>
                  );
                })
              )}
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
  console.log("expandedComponent:", cell);

  return (
    <TailwindPlusModal
      close={() => setExpanded(null)}
      width={cell.config?.expandedSize === "full" ? 90 : 40}
      height={90}
      onCloseTrigger={cell.config?.onExpandedClose}
    >
      {Component && <Component setExpanded={setExpanded} expanded={expanded} />}
      {!cell.config?.noCloseButton && (
        <div className="text-right mt-4">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            onClick={() => {
              setExpanded(null);
              cell.config?.onExpandedClose?.();
            }}
          >
            Close
          </button>
        </div>
      )}
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
  sortConfig?: {
    key: string;
    direction: string;
  };
  setSortConfig?: (config: { key: string; direction: string }) => void;
  sortData?: (key: string, direction: string) => void;
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
                sortConfig?.key === headerConfig?.config?.key &&
                sortConfig?.direction === "ascending"
                  ? "descending"
                  : "ascending";

              setSortConfig?.({
                key: headerConfig?.config?.key,
                direction,
              });
              sortData?.(headerConfig?.config?.key, direction);
            }
          }}
        >
          {flexRender(header.column.columnDef.header, header.getContext())}
          {typeof headerConfig === "object" &&
            headerConfig?.config?.sortable && (
              <TableSortButton
                direction={
                  sortConfig?.key === headerConfig?.config?.key &&
                  sortConfig?.direction === "ascending"
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
  isMobile,
  headerName,
}: {
  cell: Cell | string | number | null | undefined;
  rowIdx: number;
  cellIdx: number;
  setExpanded: (expanded: [number, number] | null) => void;
  isMobile: boolean;
  headerName: string;
}) => {
  let text: string | number;
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
      {typeof cell === "object" &&
        cell?.config?.expandable &&
        !cell?.config?.noExpandButton && (
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
      {Component ? (
        <Component
          expand={() => {
            setExpanded([rowIdx, cellIdx]);
          }}
        />
      ) : (
        text
      )}
    </>
  );

  const cellContent = (
    <>
      {typeof cell === "object" && cell?.config?.link ? (
        <Link href={cell.config.link}>{TDContents}</Link>
      ) : (
        TDContents
      )}
    </>
  );

  return isMobile ? (
    <div
      className={cn(
        `p-2`,
        typeof cell === "object" && cell?.config?.mobileSingleRow
          ? "basis-full"
          : "basis-1/2",
        typeof cell === "object" && cell?.config?.topDivider
          ? "border-t border-gray-200"
          : ""
      )}
    >
      <div className="text-gray-500 font-bold mr-4 uppercase text-xs">
        {headerName}
      </div>
      <span className="text-sm">{cellContent}</span>
    </div>
  ) : (
    <td
      key={`cell-${rowIdx}-${cellIdx}`}
      className={cn(
        `px-3 py-4 text-sm whitespace-nowrap text-gray-500 sm:table-cell text-wrap`
      )}
    >
      {cellContent}
    </td>
  );
};
