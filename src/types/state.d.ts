import { NegotiationDataType } from "@/lib/models/team";

export interface NegotiationState {
  negotiations: Record<string, NegotiationDataType>;
  setNegotiation: (id: string, data: NegotiationDataType) => void;
  getNegotiation: (id: string) => NegotiationDataType | undefined;
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
