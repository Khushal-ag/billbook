export type Role = "OWNER" | "STAFF";

export type TaxType = "GST" | "NON_GST";

/** Lightweight user returned inside AuthResponse */
export interface User {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

/** Lightweight business returned inside AuthResponse */
export interface AuthBusiness {
  id: number;
  name: string;
}

/** Full business profile returned by GET /business/profile */
export interface BusinessProfile {
  id: number;
  name: string;
  gstin: string | null;
  pan: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
  taxType: TaxType;
  financialYearStart: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Payload for PUT /business/profile */
export interface UpdateBusinessProfile {
  name: string;
  gstin?: string | null;
  pan?: string | null;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  phone?: string;
  email?: string;
  taxType?: TaxType;
  financialYearStart?: number;
}

/** Business user returned by GET /business/users */
export interface BusinessUser {
  id: number;
  userId: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  isActive: boolean;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResponse {
  user: User;
  business: AuthBusiness;
  tokens: AuthTokens;
}

/** Returned by GET /auth/me */
export interface CurrentUser {
  userId: number;
  email: string;
  businessId: number;
  role: Role;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  businessName: string;
  firstName?: string;
  lastName?: string;
}

export interface SessionUser {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  businessId: number;
  businessName: string;
}
