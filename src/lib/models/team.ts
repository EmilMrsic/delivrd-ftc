import { z } from "zod";

export const DealNegotiatorModel = z.object({
  active_deals: z.array(z.string()).default([]),
  deals: z.array(z.string()).default([]),
  email: z.string(),
  id: z.string(),
  name: z.string(),
  profile_pic: z.string().nullable(),
  role: z.string().nullable(),
  video_link: z.string().nullable(),
  source: z.string(),
});

export type DealNegotiatorType = z.infer<typeof DealNegotiatorModel>;
