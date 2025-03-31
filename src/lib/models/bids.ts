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
  bid_id: z.string(),
  clientId: z.string(),
  comments: z.string(),
  dealerId: z.string(),
  discountPrice: z.string(),
  files: z.array(z.string()),
  inventoryStatus: z.string(),
  price: z.union([z.number(), z.string()]),
  timestamp: z.string(),
  client_offer: z.string().optional(),
  vote: z.enum(["like", "dislike", "neutral"]).optional(),
  delete: z.boolean().optional(),
  bidComments: z.array(IncomingBidCommentModel).optional(),
});

export type IncomingBidType = z.infer<typeof IncomingBidModel>;
export type IncomingBidCommentType = z.infer<typeof IncomingBidCommentModel>;
