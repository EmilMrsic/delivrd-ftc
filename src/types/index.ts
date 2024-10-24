export interface IUser {
  id: string;
  displayName: string;
  email: string;
  brand: string;
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
