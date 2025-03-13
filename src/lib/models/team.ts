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

/**
 * export interface NegotiationData {
  deals: string[]; // Array of strings, where [0: ""]
  id: string;
  arrival_to_client: string;
  arrival_to_dealer: string;
  model_of_interest: string;
  vehicle_of_interest: string;
  consult_notes: string;
  close_date: string;
  date_paid: string;
  incoming_bids: any[]; // Array of any type as the content is not specified
  negotiations_Address: string | null;
  negotiations_Brand: string | null;
  negotiations_Budget: string | null;
  negotiations_Client: string;
  negotiations_Color_Options: {
    interior_preferred: string;
    exterior_preferred: string;
    interior_deal_breaker: string;
    exterior_deal_breakers: string;
  };
  negotiations_Created: string; // ISO date string
  negotiations_Deal_Start_Date: string | null; // null if not provided
  review?: string;
  negotiations_Drivetrain: string | null;
  negotiations_Email: string;
  negotiations_First_Name: string;
  negotiations_How_To_Pay: string | null;
  negotiations_Invoice_Link: string | null;
  negotiations_Invoice_Status: string | null;
  negotiations_Invoice_Status_Updates_Log: string | null;
  negotiations_Last_Name: string;
  negotiations_Model: string | null;
  negotiations_New_or_Used: string | null;
  negotiations_Onboarding_Complete: string;
  negotiations_Payment_Budget: string | null;
  negotiations_Phone: string;
  negotiations_Privilege_Level_From_Users: string[]; // Array of strings, example includes "Client"
  negotiations_Project_Short_Link: string | null;
  negotiations_Status: string | null;
  negotiations_Status_Updated: string | null;
  negotiations_Trade_Details: string | null;
  negotiations_Travel_Limit: string | null;
  negotiations_Trim: string | null;
  negotiations_Trim_Package_Options: string | null;
  negotiations_Zip_Code: string | null;
  negotiations_city: string | null;
  negotiations_state: string | null;
  negotiations_deal_coordinator: string | null;
  shipping_info: string | null;
  trade_in_info?: string;
  trade_in_vin?: string;
  trade_in_mileage?: string;
  trade_in_comments?: string;
  trade_in_files?: string[];
}
 */

export const NegotiationDataModel = z.object({
  deals: z.array(z.string()).default([]),
  id: z.string(),
  arrival_to_client: z.string().nullable(),
  arrival_to_dealer: z.string().nullable(),
  model_of_interest: z.string().nullable().optional(),
  vehicle_of_interest: z.string().nullable().optional(),
  consult_notes: z.string().nullable().optional(),
  close_date: z.string().nullable(),
  date_paid: z.string().nullable(),
  incoming_bids: z.array(z.any()).default([]),
  negotiations_Address: z.string().nullable(),
  negotiations_Brand: z.string().nullable(),
  negotiations_Budget: z.union([z.number(), z.string()]).nullable(),
  negotiations_Client: z.string(),
  negotiations_Color_Options: z.object({
    interior_preferred: z.string(),
    exterior_preferred: z.string(),
    interior_deal_breaker: z.string(),
    exterior_deal_breakers: z.string(),
  }),
  negotiations_Created: z.string(),
  negotiations_Deal_Start_Date: z.string().nullable(),
  review: z.string().nullable().optional(),
  negotiations_Drivetrain: z.string().nullable(),
  negotiations_Email: z.string().nullable(),
  negotiations_First_Name: z.string(),
  negotiations_How_To_Pay: z.string().nullable(),
  negotiations_Invoice_Link: z.string().nullable(),
  negotiations_Invoice_Status: z.string().nullable(),
  negotiations_Invoice_Status_Updates_Log: z.string().nullable(),
  negotiations_Last_Name: z.string().nullable(),
  negotiations_Model: z.string().nullable(),
  negotiations_New_or_Used: z.string().nullable(),
  negotiations_Onboarding_Complete: z.string().nullable(),
  negotiations_Payment_Budget: z.union([z.number(), z.string()]).nullable(),
  negotiations_Phone: z.string().nullable(),
  negotiations_Privilege_Level_From_Users: z.array(z.string()).default([]),
  negotiations_Project_Short_Link: z.string().nullable(),
  negotiations_Status: z.string().nullable(),
  negotiations_Status_Updated: z.string().nullable(),
  negotiations_Trade_Details: z.string().nullable(),
  negotiations_Travel_Limit: z.string().nullable(),
  negotiations_Trim: z.string().nullable(),
  negotiations_Trim_Package_Options: z.string().nullable(),
  negotiations_Zip_Code: z.string().nullable(),
  negotiations_city: z.string().nullable(),
  negotiations_state: z.string().nullable(),
  negotiations_deal_coordinator: z.string().nullable(),
  shipping_info: z.string().nullable(),
  trade_in_info: z.string().nullable().optional(),
  trade_in_vin: z.string().nullable().optional(),
  trade_in_mileage: z.string().nullable().optional(),
  trade_in_comments: z.string().nullable().optional(),
  trade_in_files: z.array(z.string()).default([]),
});

export type DealNegotiatorType = z.infer<typeof DealNegotiatorModel>;
export type NegotiationDataType = z.infer<typeof NegotiationDataModel>;
