import { cn } from "@/lib/utils";
import { TableSortButton } from "./table-sort-button";

interface HeaderWithConfig {
  header: string;
  config: {
    sortable: boolean;
  };
}

export const TailwindPlusTable = ({
  headers,
  rows,
}: {
  headers: (string | HeaderWithConfig)[];
  rows: any[];
}) => {
  return (
    <div className="-mx-4 -my-2 sm:-mx-6 ">
      <div className="inline-block min-w-full py-2 align-middle">
        <table className="min-w-full border-separate border-spacing-0">
          <thead>
            <tr>
              {headers.map((header) => {
                const headerText =
                  typeof header === "string" ? header : header.header;

                return (
                  <th
                    scope="col"
                    className="group sticky top-0 z-10 border-b border-gray-300 bg-white/75 py-3.5 pr-3 text-left text-sm font-semibold text-gray-900 backdrop-blur-sm backdrop-filter py-3 pl-4"
                    key={headerText}
                  >
                    {typeof header === "object" && header?.config?.sortable ? (
                      <a href="#" className="inline-flex items-center">
                        {headerText}
                        {typeof header === "object" &&
                          header?.config?.sortable && <TableSortButton />}
                      </a>
                    ) : (
                      headerText
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {row.map((cell) => {
                  const text =
                    typeof cell === "object" && cell?.text ? cell.text : cell;
                  const Component =
                    typeof cell === "object" && cell?.Component
                      ? cell.Component
                      : null;

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
                      {typeof cell === "object" && cell?.Component ? (
                        <Component />
                      ) : (
                        text
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
