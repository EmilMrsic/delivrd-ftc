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
  arrivalToClient: z.string(),
  arrivalToDealer: z.string(),
  budget: z.union([z.number(), z.string()]),
  desiredInterior: z.string(),
  drivetrain: z.string(),
  dealCoordinatorId: z.string(),
  howToPay: z.string(),
  prefix: z.string().optional(),
  workLogs: z.array(WorkLogModel).optional(),
  closeDate: z.string(),
  desiredExterior: z.string(),
  clientFirstName: z.string(),
  clientLastName: z.string(),
  clientNamefull: z.string(),
  shippingInfo: z.string(),
  negotiationId: z.string(),
  clientPhone: z.string(),
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
  stage: z.string(),
  invoiceStatus: z.string(),
  model: z.string(),
  updatedAt: z.string().optional(),
  city: z.string(),
  excludedInterior: z.string(),
  source: z.string(),
  internalNotes: z.array(z.any()).optional(),
  travelLimit: z.string(),
  condition: z.string(),
  excludedExterior: z.string(),
  invoiceLink: z.string().optional(),
  monthlyBudget: z.union([z.number(), z.string()]).optional(),
  brand: z.string(),
  invoiceStatusUpdatesLog: z
    .object({
      created: z.string(),
      paid: z.string(),
    })
    .optional(),
  id: z.string(),
  datePaid: z.string(),
  dealStartDate: z.string(),
  onboardingComplete: z.string(),
  onboardingLink: z.string().optional(),
  vehicleOfinterest: z.string(),
  trim: z.string(),
  consultNotes: z.string(),
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
  priority: z.boolean().default(false),
  totalTradeInBids: z.number().default(0),
  totalRegularBids: z.number().default(0),
  supportAgentId: z.union([z.string(), z.null()]).optional(),
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
