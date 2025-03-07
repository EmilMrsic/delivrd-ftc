import { cn } from "@/lib/utils";
import { TableSortButton } from "./table-sort-button";

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
  return (
    <div className="-mx-4 -my-2 sm:-mx-6 max-w-full overflow-x-scroll">
      <div className="inline-block min-w-full max-w-full py-2 align-middle">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr>
              {headers.map((header) => (
                <TailwindTableHeader
                  header={header}
                  sortConfig={sortConfig}
                  setSortConfig={setSortConfig}
                  sortData={sortData}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {row.map((cell) => (
                  <TailwindTableCell cell={cell} />
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
  sortConfig,
  setSortConfig,
  sortData,
}: {
  header: string | HeaderWithConfig;
  sortConfig: {
    key: string;
    direction: string;
  };
  setSortConfig: (config: { key: string; direction: string }) => void;
  sortData: (key: string, direction: string) => void;
}) => {
  const headerText = typeof header === "string" ? header : header.header;

  return (
    <th
      scope="col"
      className={cn(
        `group sticky top-0 z-10 border-b border-gray-300 bg-white/75 py-3.5 pr-3 text-left text-sm font-semibold text-gray-900 backdrop-blur-sm backdrop-filter py-3 pl-4`
      )}
      key={headerText}
      onClick={() => {
        if (header?.config?.sortable) {
          const direction =
            sortConfig.key === header?.config?.key &&
            sortConfig.direction === "ascending"
              ? "descending"
              : "ascending";

          setSortConfig({ key: header?.config?.key, direction });
          sortData(header?.config?.key, direction);
        }
      }}
    >
      {typeof header === "object" && header?.config?.sortable ? (
        <div className="inline-flex items-center cursor-pointer">
          {headerText}
          {typeof header === "object" && header?.config?.sortable && (
            <TableSortButton
              direction={
                sortConfig.key === header?.config?.key &&
                sortConfig.direction === "ascending"
                  ? "descending"
                  : "ascending"
              }
            />
          )}
        </div>
      ) : (
        headerText
      )}
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
