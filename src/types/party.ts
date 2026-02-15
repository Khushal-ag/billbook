export type PartyType = "CUSTOMER" | "SUPPLIER";

export interface Party {
  id: number;
  name: string;
  type: PartyType;
  email?: string;
  phone?: string;
  gstin?: string;
  pan?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  outstandingBalance: string;
  deletedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePartyRequest {
  name: string;
  type: PartyType;
  email?: string;
  phone?: string;
  gstin?: string;
  pan?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
}
