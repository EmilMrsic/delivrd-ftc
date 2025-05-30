import { z } from "zod";

export const ClientModel = z.object({
  id: z.string(),
  Brand: z.string(),
  ColorOptions: z.string(),
  Drivetrain: z.string(),
  Model: z.string(),
  NewOrUsed: z.string(),
  Trim: z.string(),
  ZipCode: z.string(),
  city: z.string(),
  createdAt: z.string(),
  desiredExterior: z.string(),
  desiredInterior: z.string(),
  excludedExterior: z.string(),
  excludedInterior: z.string(),
  negotiation_Id: z.string(),
  source: z.string(),
  state: z.string(),
});

export type ClientDataType = z.infer<typeof ClientModel>;
