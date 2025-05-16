import { z } from "zod";

export const NotificationModel = z.object({
  id: z.string(),
  userId: z.string(),
  createdAt: z.string(),
  read: z.boolean(),
  type: z.string(),
  data: z.any(),
});

export type NotificationDataType = z.infer<typeof NotificationModel>;
