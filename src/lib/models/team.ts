import { z } from "zod";

export const WorkLogModel = z.object({
  id: z.string(),
  timestamp: z.string(),
  content: z.string(),
  attachments: z.array(z.string()).optional(),
  user: z.string(),
  negotiation_id: z.string(),
  deal_coordinator_id: z.string(),
  userAvatar: z.union([z.string(), z.null()]).optional(),
});

export const NegotiationDataModel = z.object({
  arrivalToClient: z.string().optional(),
  arrivalToDealer: z.string().optional(),
  budget: z.union([z.number(), z.string()]).optional(),
  desiredInterior: z.string().optional(),
  drivetrain: z.string().optional(),
  dealCoordinatorId: z.string().optional(),
  howToPay: z.string().optional(),
  prefix: z.string().optional(),
  workLogs: z.array(WorkLogModel).optional(),
  closeDate: z.string().optional(),
  desiredExterior: z.string().optional(),
  clientFirstName: z.string().optional(),
  clientLastName: z.string().optional(),
  clientNamefull: z.string().optional(),
  shippingInfo: z.string().optional(),
  negotiationId: z.string().optional(),
  clientPhone: z.string().optional(),
  tradeDetails: z
    .object({
      mileage: z.string().optional(),
      fileUrls: z.array(z.string()).optional(),
      comments: z.string().optional(),
      vin: z.string().optional(),
      year: z.string().optional(),
    })
    .optional(),
  userId: z.string(),
  state: z.string(),
  zip: z.string(),
  incomingBids: z.array(z.string()).optional(),
  createdAt: z.string(),
  clientEmail: z.string(),
  stage: z.string().optional(),
  invoiceStatus: z.string().optional(),
  model: z.string().optional(),
  updatedAt: z.string().optional(),
  city: z.string(),
  excludedInterior: z.string().optional(),
  source: z.string().optional(),
  internalNotes: z.array(z.any()).optional(),
  travelLimit: z.string().optional(),
  condition: z.string().optional(),
  excludedExterior: z.string().optional(),
  invoiceLink: z.string().optional(),
  monthlyBudget: z.union([z.number(), z.string()]).optional(),
  brand: z.string().optional(),
  invoiceStatusUpdatesLog: z
    .object({
      created: z.string(),
      paid: z.string(),
    })
    .optional(),
  id: z.string(),
  datePaid: z.string().optional(),
  dealStartDate: z.string().optional(),
  onboardingComplete: z.string().optional(),
  onboardingLink: z.string().optional(),
  vehicleOfinterest: z.string().optional(),
  trim: z.string().optional(),
  consultNotes: z.string().optional(),
  city_state: z.string().optional(),
  address: z.string().optional(),
  // these are subject to change after emil
  tradeInInfo: z.string().optional(),
  trade_in_files: z.array(z.string()).optional(),
  purchaseTimeline: z.string().optional(),
  dealershipExperience: z.string().optional(),
  trade: z.boolean().optional(),
  client_source: z.string().optional(),
  consultDate: z.string().optional(),
  shippingSelectedCoordinatorId: z.union([z.string(), z.null()]).optional(),
  pickingUpSelectedCoordinatorId: z.union([z.string(), z.null()]).optional(),
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
  privilege: z.string().optional(),
});

export const InternalNotesModel = z.object({
  author: z.record(z.any()),

  createdAt: z.string(),
  mentionedTeammember: z.string(),
  noteId: z.string(),
  text: z.string(),
});

export type NegotiationDataType = z.infer<typeof NegotiationDataModel>;
export type DealNegotiatorType = z.infer<typeof DealNegotiatorModel> & {
  negotiationsGrouped?: {
    [key: string]: NegotiationDataType[];
  };
};
export type InternalNotesType = z.infer<typeof InternalNotesModel>;
export type WorkLogType = z.infer<typeof WorkLogModel>;
