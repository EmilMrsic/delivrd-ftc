import { z } from "zod";

export const NegotiationDataModel = z.object({
  arrivalToClient: z.string(),
  arrivalToDealer: z.string(),
  budget: z.string(),
  desiredInterior: z.string(),
  drivetrain: z.string(),
  dealCoordinatorId: z.string(),
  howToPay: z.string(),
  prefix: z.string(),
  workLogs: z.array(z.any()),
  closeDate: z.string(),
  desiredExterior: z.string(),
  clientFirstName: z.string(),
  clientLastName: z.string(),
  clientNamefull: z.string(),
  shippingInfo: z.string(),
  negotiationId: z.string(),
  clientPhone: z.string(),
  tradeDetails: z.object({
    mileage: z.string(),
    fileUrls: z.array(z.string()),
    comments: z.string(),
    vin: z.string(),
  }),
  userId: z.string(),
  state: z.string(),
  zip: z.string(),
  incomingBids: z.array(z.string()),
  createdAt: z.string(),
  clientEmail: z.string(),
  stage: z.string(),
  invoiceStatus: z.string(),
  model: z.string(),
  updatedAt: z.string(),
  city: z.string(),
  excludedInterior: z.string(),
  source: z.string(),
  internalNotes: z.array(z.any()),
  travelLimit: z.string(),
  condition: z.string(),
  excludedExterior: z.string(),
  invoiceLink: z.string(),
  monthlyBudget: z.number(),
  brand: z.string(),
  invoiceStatusUpdatesLog: z.object({
    created: z.string(),
    paid: z.string(),
  }),
  id: z.string(),
  datePaid: z.string(),
  dealStartDate: z.string(),
  onboardingComplete: z.string(),
  vehicleOfinterest: z.string(),
  trim: z.string(),
  consultNotes: z.string(),

  // these are subject to change after emil
  tradeInInfo: z.string().optional(),
  dealInfo: z
    .object({
      trade_in_files: z.array(z.string()),
    })
    .optional(),
});

export const DealNegotiatorModel = z.object({
  active_deals: z.array(z.string()).default([]),
  negotiations: z.array(NegotiationDataModel).optional(),
  deals: z.array(z.string()).default([]),
  email: z.string(),
  id: z.string(),
  name: z.string(),
  profile_pic: z.string().nullable(),
  role: z.string().nullable(),
  video_link: z.string().nullable(),
  source: z.string(),
  visible: z.boolean().default(true),
});

export const InternalNotesModel = z.object({
  authorId: z.string(),
  createdAt: z.string(),
  mentionedTeammember: z.string(),
  noteId: z.string(),
  text: z.string(),
});

export type DealNegotiatorType = z.infer<typeof DealNegotiatorModel>;
export type NegotiationDataType = z.infer<typeof NegotiationDataModel>;
export type InternalNotesType = z.infer<typeof InternalNotesModel>;
