import { useIsMobile } from "@/hooks/useIsMobile";
import { cn } from "@/lib/utils";

interface GridColumn {
  title: string;
  value: any;
  config?: {
    bold?: boolean;
  };
}

export const GridDisplay = ({
  columns,
  title,
}: {
  columns: (GridColumn | GridColumn[])[];
  title?: string;
}) => {
  const isMobile = useIsMobile();
  return (
    <>
      {title && (
        <p className="text-xl font-semibold text-gray-900 pl-1 mb-2">{title}</p>
      )}
      <div className={cn(`w-full`, !isMobile && `grid grid-cols-2 gap-4`)}>
        <GridColumnDisplay columns={columns} isMobile={isMobile} />
      </div>
    </>
  );
};

export const GridColumnDisplay = ({
  columns,
  doubleColumn = false,
  isMobile = false,
}: {
  columns: (GridColumn | GridColumn[])[];
  doubleColumn?: boolean;
  isMobile?: boolean;
}) => {
  return (
    <>
      {columns.map((column, index) => {
        if (Array.isArray(column)) {
          return (
            <GridColumnDisplay
              columns={column}
              doubleColumn={true}
              key={index}
            />
          );
        }

        return <GridColumn column={column} doubleColumn={doubleColumn} />;
      })}
    </>
  );
};

export const GridColumn = ({
  column,
  doubleColumn,
  isMobile,
}: {
  column: GridColumn;
  doubleColumn: boolean;
  isMobile?: boolean;
}) => {
  const { title, value } = column;
  return (
    <div
      className={cn(
        `bg-gray-50 rounded-lg border border-gray-200 p-4`,
        !doubleColumn && `col-span-2`,
        isMobile && "mb-2"
      )}
    >
      <p className="text-xs text-blue-600 font-semibold tracking-wide uppercase">
        {title}
      </p>{" "}
      <p
        className={cn(
          `text-xl text-gray-900`,
          (column.config?.bold || column.config?.bold === undefined) &&
            `font-semibold`
        )}
      >
        {value}
      </p>
    </div>
  );
};

<div className="bg-gray-50 rounded-lg border border-gray-200 p-4 w-fit">
  <p className="">Mileage:</p>
  <p className="text-xl font-semibold text-gray-900">19,872</p>
</div>;
