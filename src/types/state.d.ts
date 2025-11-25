import { ClientDataType } from "@/lib/models/client";
import { NotificationDataType } from "@/lib/models/notification";
import { DealNegotiatorType, NegotiationDataType } from "@/lib/models/team";

export interface NegotiationState {
  refreshedAt: number | null;
  negotiations: Record<string, NegotiationDataType>;
  setRefreshedAt: (time: number) => void;
  setNegotiation: (id: string, data: NegotiationDataType) => void;
  getNegotiation: (id: string) => NegotiationDataType | undefined;
  mergeInNegotiations: (byId: Record<string, NegotiationDataType>) => void;
  hasNegotiation: (id: string) => boolean;
  removeNegotiation: (id: string) => void;
  clearNegotiations: () => void;
  pruneNegotiations: () => void;
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

interface DealerVehicleType extends ClientDataType {
  bidNum: number;
  trade: boolean;
}

export interface DealerVehiclesState {
  vehicles: Record<string, DealerVehicleType>;
  setVehicle: (id: string, data: DealerVehicleType) => void;
  getVehicle: (id: string) => DealerVehicleType | undefined;
  mergeInVehicles: (byId: Record<string, DealerVehicleType>) => void;
  hasVehicle: (id: string) => boolean;
}

export interface TeamDashboardFiltersState {
  hasIncomingBids: boolean;
  hasTradeInBids: boolean;
  updateFilter: (filter: Partial<TeamDashboardFiltersState>) => void;
  clearFilters: () => void;
}

export interface NotificationsState {
  lastPolledTime: number | null;
  setLastPolledTime: (time: number) => void;
  notifications: NotificationDataType[];
  setNotifications: (notifications: NotificationDataType[]) => void;
  notificationCount: number;
  setNotificationCount: (count: number) => void;
  pruneNotifications: () => void;
}

export interface UserState {
  loginId?: string;
  setLoginId: (id: string) => void;
  userId?: string;
  setUserId: (id: string) => void;
  name: string;
  setName: (name: string) => void;
}

export interface FiltersState {
  supportAgent: string | null;
  setSupportAgent: (agent: string | null) => void;
}
