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
import React, { useEffect, useMemo, useRef, useState } from "react";

export const TailwindPlusExpandableTable = ({
  name,
  defaultExpanded,
  rows,
}: {
  name?: string;
  defaultExpanded?: number[];
  rows: {
    title?: string;
    Component?: React.ComponentType;
    expandedComponent?: React.ComponentType | React.FC<any>;
    expandedComponentProps?: Record<string, any>;
  }[];
}) => {
  const uniqueId = useState(() => Math.random().toString(36).substring(2, 9));
  const [expanded, setExpanded] = useState<Set<number>>(
    new Set(defaultExpanded ?? [])
  );

  useEffect(() => {
    if (defaultExpanded || defaultExpanded === 0) {
      setExpanded(new Set(defaultExpanded));
    }
  }, [defaultExpanded]);

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]"></TableHead>
          <TableHead>Name</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, idx) => (
          <ExpandableTableRow
            key={`${idx}-${row.title}-${uniqueId}`}
            row={row}
            idx={idx}
            setExpanded={setExpanded}
            expanded={expanded}
          />
        ))}
      </TableBody>
    </Table>
  );
};

export const ExpandableTableRow = ({
  row,
  idx,
  setExpanded,
  expanded,
}: {
  row: {
    Component?: React.ComponentType;
    title?: string;
    expandedComponent?: React.ComponentType;
    expandedComponentProps?: Record<string, any>;
  };
  idx: number;
  setExpanded: (expanded: Set<number>) => void;
  expanded: Set<number>;
}) => {
  const { Component, title, expandedComponent, expandedComponentProps } = row;
  const titleDisplay = Component ? <Component /> : row.title;
  const ExpandedComponent = useMemo(() => {
    return expandedComponent;
  }, [row]);

  const passableExpandedComponentProps = expandedComponentProps ?? {};

  return (
    <React.Fragment key={idx}>
      <TableRow key={`${idx}-listing`}>
        <TableCell className="w-[50px]">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const newState = new Set(expanded);
              if (newState.has(idx)) {
                newState.delete(idx);
              } else {
                newState.add(idx);
              }
              setExpanded(newState);
            }}
          >
            {expanded.has(idx) ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </TableCell>
        <TableCell>{titleDisplay}</TableCell>
      </TableRow>
      {expanded.has(idx) && row.expandedComponent && (
        <TableRow key={`${idx}-expanded`}>
          <TableCell colSpan={2}>
            {ExpandedComponent && (
              <ExpandedComponent {...passableExpandedComponentProps} />
            )}
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
};
