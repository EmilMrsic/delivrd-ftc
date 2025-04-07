import { z } from "zod";

export const IncomingBidCommentModel = z.object({
  bid_id: z.string(),
  client: z.string(),
  client_id: z.string(),
  client_name: z.string(),
  client_phone_number: z.string(),
  comment: z.string(),
  comment_source: z.string(),
  deal_coordinator: z.string(),
  deal_coordinator_name: z.string(),
  link_status: z.string(),
  negotiation_id: z.string(),
  time: z.string(),
});

export const IncomingBidModel = z.object({
  bid_id: z.string().optional(),
  clientId: z.string().optional(),
  comments: z.string().optional(),
  dealerId: z.string().optional(),
  discountPrice: z.union([z.number(), z.string()]).optional(),
  files: z.array(z.string()).optional(),
  inventoryStatus: z.string().optional(),
  price: z.union([z.number(), z.string(), z.nan()]).optional(),
  timestamp: z
    .union([
      z.string(),
      z.number(),
      z.object({
        nanoseconds: z.number(),
        seconds: z.number(),
      }),
    ])
    .optional(),
  client_offer: z.string().optional(),
  vote: z.enum(["like", "dislike", "neutral"]).optional(),
  delete: z.boolean().optional(),
  bidComments: z.array(IncomingBidCommentModel).optional(),
});

export type IncomingBidType = z.infer<typeof IncomingBidModel>;
export type IncomingBidCommentType = z.infer<typeof IncomingBidCommentModel>;
