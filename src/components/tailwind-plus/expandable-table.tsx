import { ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { useState } from "react";

export const TailwindPlusExpandableTable = ({
  defaultExpanded,
  rows,
}: {
  defaultExpanded?: number[];
  rows: {
    title?: string;
    Component?: React.ComponentType;
    expandedComponent?: React.ComponentType;
  }[];
}) => {
  const [expanded, setExpanded] = useState<Set<number>>(
    new Set(defaultExpanded ?? [])
  );

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]"></TableHead>
          <TableHead>Name</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, idx) => {
          const {
            Component,
            title,
            expandedComponent: ExpandedComponent,
          } = row;
          const titleDisplay = Component ? <Component /> : row.title;

          return (
            <>
              <TableRow key={row.title}>
                <TableCell className="w-[50px]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setExpanded((prev) => {
                        if (prev.has(idx)) {
                          prev.delete(idx);
                        } else {
                          prev.add(idx);
                        }

                        return new Set(prev);
                      });
                    }}
                  >
                    {expanded.has(idx) ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </Button>
                </TableCell>
                <TableCell key={row.title}>{titleDisplay}</TableCell>
              </TableRow>
              {expanded.has(idx) && row.expandedComponent && (
                <TableRow>
                  <TableCell colSpan={2}>
                    {ExpandedComponent && <ExpandedComponent />}
                  </TableCell>
                </TableRow>
              )}
            </>
          );
        })}
      </TableBody>
    </Table>
  );
};
