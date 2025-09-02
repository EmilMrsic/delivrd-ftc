import { TableExpandedRowState } from "@/types/state";
import { create } from "zustand";

export const useTableExpandedRow = create<TableExpandedRowState>(
  (set, get) => ({
    tableId: null,
    expanded: null,
    setExpanded: (tableId, expanded, cell) => set({ tableId, expanded, cell }),
    cell: null,
  })
);
