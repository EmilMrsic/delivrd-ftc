import { z } from "zod";
import { IncomingBidModel } from "./bids";

export const DealerModel = z.object({
  id: z.string(),
  source: z.string().optional(),
  Brand: z.array(z.string()).optional(),
  Dealership: z.string().optional(),
  Position: z.string().optional(),
  SalesPersonName: z.string().optional(),
  SalesPersonPhone: z.string().optional(),
  City: z.string().optional(),
  State: z.string().optional(),
  YourEmail: z.string().optional(),
  YourWebsite: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  radius: z.string().optional(),
  updated: z.boolean().optional(),
  bids: z.array(IncomingBidModel).optional(),
  lastBid: z.string().optional(),
});

export type DealerDataType = z.infer<typeof DealerModel>;
