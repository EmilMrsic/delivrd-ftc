import { string } from "zod";

export interface IUser {
  phone: string;
  trade_details: string;
  revenue: number;
  is_onboarding_complete: boolean | null;
  dealer_id: string[];
  total_budget: number[];
  privilege: string[];
  email: string;
  payment_type: string;
  city: string;
  id: string;
  consult_date: string;
  trim_and_package_options: string;
  negotiation_id: string[];
  deal_created_time: string[];
  name: string;
  deal_negotiator: string[];
  deal_started_date: string[];
  model: string[];
  deals: {
    brand: string;
    city: string;
    color_options: {
      exterior: {
        not_preferred: string;
        preferred: string;
      };
      interior: {
        preferred: string;
        not_preferred: string;
      };
    };
    condition: string;
    consult_date_friendly: string;
    deal_closed_date_friendly: string;
    deal_created_time_friendly: string;
    deal_negotiator: string;
    deal_start_date_friendly: string;
    drive_train: string;
    invoice_status: string;
    is_onboarding_complete: boolean | null;
    negotiation_id: string;
    payment_budget: number;
    payment_type: string;
    state: string;
    trim_and_package_options: string;
    zip_code: string;
    incoming_bids: {
      dealer_name: string;
      negotiation_id: string;
      bid_id: string;
    }[];
  }[];
  drive_train: string;
  condition: string;
  color_options: {
    exterior: {
      not_preferred: string;
      preferred: string;
    };
    interior: {
      preferred: string;
      not_preferred: string;
    };
  };
  brand: string;
  state: string;
  deal_closed_date: string[];
  invoice_status: string;
}

export interface DealNegotiator {
  activeDeals: string[];
  deals: string[];
  email: string;
  id: string;
  name: string;
  profile_pic: string;
  role: string;
  video_link: string;
}

export type ActivityLog = {
  id: string;
  day: string;
  time: string;
  description: string;
  user: string;
  negotiationId: string | null;
}[];

export type DealerData = {
  Brand: string[];
  City: string;
  Dealership: string;
  Position: string;
  SalesPersonName: string;
  SalesPersonPhone: string;
  State: string;
  YourEmail: string;
  YourWebsite: string;
  id: string;
};

export interface NegotiationData {
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

export interface EditNegotiationData {
  id: string;
  clientInfo: {
    negotiations_Client: string;
    negotiations_First_Name: string;
    negotiations_Last_Name: string;
    negotiations_Email: string;
    negotiations_Phone: string;
    negotiations_Zip_Code: string | null;
    negotiations_city: string | null;
    negotiations_state: string | null;
    negotiations_deal_coordinator: string;
    arrival_to_client: string;
    arrival_to_dealer: string;
    close_date: string;
    prefix: string;
    date_paid: string;
  };
  dealInfo: {
    negotiations_Brand: string | null;
    negotiations_Budget: string | null;
    negotiations_Created: string;
    negotiations_Deal_Start_Date: string | null;
    negotiations_Drivetrain: string | null;
    negotiations_Model: string | null;
    negotiations_How_To_Pay: string | null;
    negotiations_Invoice_Link: string | null;
    negotiations_Invoice_Status: string | null;
    negotiations_Invoice_Status_Updates_Log: string | null;
    negotiations_New_or_Used: string | null;
    negotiations_Payment_Budget: string | null;
    negotiations_Privilege_Level_From_Users: string[];
    negotiations_Project_Short_Link: string | null;
    negotiations_Status: string | null;
    negotiations_Status_Updated: string | null;
    negotiations_Trade_Details: string | null;
    negotiations_Travel_Limit: string | null;
    negotiations_Trim: string | null;
    negotiations_Trim_Package_Options: string | null;
    shipping_info: string | null;
    trade_in_info?: string;
    trade_in_vin?: string;
    trade_in_mileage?: string;
    trade_in_comments?: string;
    trade_in_files?: string[];
  };
  otherData: {
    deals: string[];
    incoming_bids: string[];
    negotiations_Address: string | null;
    negotiations_Color_Options: {
      interior_preferred: string;
      exterior_preferred: string;
      interior_deal_breaker: string;
      exterior_deal_breakers: string;
    };
  };
}

export interface BidComments {
  client_phone_number: string;
  bid_id: string;
  client_name: string;
  client: string;
  comment: string;
  deal_coordinator: string;
  deal_coordinator_name: string;
  link_status: string;
  negotiation_id: string;
  time: string;
  client_id: string;
  comment_source: string;
}

export interface notificationType {
  title: string;
  body: string;
  link: string;
}

export interface InternalNotes {
  client: string;
  note: string;
  deal_coordinator: string;
  deal_coordinator_name: string;
  negotiation_id: string;
  time: string;
}

export interface IncomingBid {
  bid_id: string;
  clientId: string;
  comments: string;
  dealerId: string;
  discountPrice: string;
  files: string[];
  inventoryStatus: string;
  price: number;
  timestamp: string;
  client_offer: string;
  vote?: "like" | "dislike" | "neutral";
  delete: boolean;
  accept_offer: boolean;
}

export type Color = {
  name: string;
  preferred: boolean;
};

export type Vehicle = {
  id?: string;
  client?: string;
  carMake?: string;
  carModel?: string;
  price?: number;
  files?: string[];
  notes?: string;
  discountPrice?: string;
  inventoryStatus?: string;
  name?: string;
  brand?: string;
  NewOrUsed?: string;
  zipCode?: string;
  trim?: string;
  exteriorColors?: Color[];
  interiorColors?: Color[];
  drivetrain?: string;
  createdAt?: string;
};

export type Negotiation = {
  id: string;
  negotiations_Client: string | null;
  negotiations_Brand: string | null;
  negotiations_Model: string | null;
  negotiations_Invoice_Status: string | null;
  negotiations_Created: string | null;
  lastUpdated: string;
  negotiations_Status: string;
};
