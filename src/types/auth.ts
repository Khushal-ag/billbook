export type Role = "OWNER" | "STAFF";

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

export interface Business {
  id: number;
  name: string;
  gstin?: string;
  pan?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  phone?: string;
  email?: string;
  gstEnabled?: boolean;
  taxType?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: string;
}

export interface AuthResponse {
  user: User;
  business: Business;
  tokens: AuthTokens;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  businessName: string;
}

export interface SessionUser extends User {
  role: Role;
  businessId: number;
  businessName: string;
}
