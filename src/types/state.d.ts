import { ClientDataType } from "@/lib/models/client";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";

export interface NegotiationState {
  negotiations: Record<string, NegotiationDataType>;
  setNegotiation: (id: string, data: NegotiationDataType) => void;
  getNegotiation: (id: string) => NegotiationDataType | undefined;
  mergeInNegotiations: (byId: Record<string, NegotiationDataType>) => void;
  hasNegotiation: (id: string) => boolean;
  removeNegotiation: (id: string) => void;
  clearNegotiations: () => void;
}

/**
 * negotiations, allNegotiations contain ids that are stored in the main negotiations state.
 */
export interface TeamDashboardState {
  allNegotiations: string[];
  setAllNegotiations: (negotiations: string[]) => void;
  negotiations: string[];
  setNegotiations: (negotiations: string[]) => void;
}

export interface DealNegotiatorsState {
  dealNegotiators: Record<string, DealNegotiatorType>;
  setDealNegotiators: (
    dealNegotiators: Record<string, DealNegotiatorType>
  ) => void;
  getDealNegotiators: () => DealNegotiatorType[];
}

export interface TableExpandedRowState {
  tableId: string | null;
  expanded: null | [number, number];
  setExpanded: (
    tableId: null | string,
    expanded: null | [number, number],
    cell?: any | null
  ) => void;
  cell: any | null;
}

export interface DealerVehiclesState {
  vehicles: Record<string, ClientDataType>;
  setVehicle: (id: string, data: ClientDataType) => void;
  getVehicle: (id: string) => ClientDataType | undefined;
  mergeInVehicles: (byId: Record<string, ClientDataType>) => void;
  hasVehicle: (id: string) => boolean;
}
