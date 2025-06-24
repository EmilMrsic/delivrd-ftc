import { createContext } from "react";
import { DealerDataType } from "../models/dealer";

export const DealerContext = createContext<DealerDataType | null>(null);
