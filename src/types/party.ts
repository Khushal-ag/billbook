export type PartyType = "CUSTOMER" | "SUPPLIER";

export interface Party {
  id: number;
  businessId: number;
  name: string;
  type: PartyType;
  gstin: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  openingBalance: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface CreatePartyRequest {
  name: string;
  type?: PartyType;
  gstin?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  openingBalance?: string;
}

/** GET /parties response */
export interface PartyListResponse {
  parties: Party[];
  count: number;
}
