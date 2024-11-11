export interface IUser {
  phone: string;
  trade_details: string;
  revenue: number;
  is_onboarding_complete: boolean | null;
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

export interface IncomingBid {
  clientId: string;
  comments: string;
  dealerId: string;
  discountPrice: string;
  files: string[];
  inventoryStatus: string;
  price: number;
  timestamp: string;
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
  isNew?: boolean;
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
};
