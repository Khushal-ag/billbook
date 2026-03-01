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
  organizationCode?: string;
}

/** Extra detail key-value for business profile */
export interface ExtraDetail {
  key: string;
  value: string;
}

/** Profile completion breakdown for "other details" (email, signature, taxId, businessClassification) */
export interface ProfileCompletionOtherBreakdown {
  email: number;
  signatureUrl: number;
  taxId: number;
  businessClassification: number;
}

/** Single section in profile completion breakdown */
export interface ProfileCompletionSection {
  complete: boolean;
  percentage: number;
  breakdown?: ProfileCompletionOtherBreakdown;
}

/** Full profile completion from GET /business/profile */
export interface ProfileCompletion {
  percentage: number;
  breakdown: {
    registration?: ProfileCompletionSection;
    address?: ProfileCompletionSection;
    phone?: ProfileCompletionSection;
    logo?: ProfileCompletionSection;
    otherDetails?: ProfileCompletionSection;
  };
  canCreateInvoice: boolean;
}

/** Full business profile returned by GET /business/profile */
export interface BusinessProfile {
  id: number;
  name: string;
  country: string | null;
  phone: string | null;
  email: string | null;
  businessType: string | null;
  industryType: string | null;
  registrationType: string | null;
  street: string | null;
  area: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  gstin: string | null;
  pan: string | null;
  financialYearStart: number;
  extraDetails: ExtraDetail[] | null;
  signatureUrl: string | null;
  logoUrl: string | null;
  taxType: TaxType;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  /** Profile completion; present when API returns it */
  profileCompletion?: ProfileCompletion;
}

/** Payload for PUT /business/profile */
export interface UpdateBusinessProfile {
  name: string;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  businessType?: string | null;
  industryType?: string | null;
  registrationType?: string | null;
  street?: string | null;
  area?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  gstin?: string | null;
  pan?: string | null;
  financialYearStart?: number;
  extraDetails?: ExtraDetail[] | null;
  signatureUrl?: string | null;
  logoUrl?: string | null;
  taxType?: TaxType;
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

/** User object in GET /auth/me response */
export interface AuthMeUser {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
}

/** Business object in GET /auth/me response */
export interface AuthMeBusiness {
  id: number;
  name: string;
  organizationCode?: string;
  signatureUrl?: string | null;
  logoUrl?: string | null;
  email?: string | null;
}

/** Returned by GET /auth/me (API response data) */
export interface AuthMeResponse {
  user: AuthMeUser;
  business: AuthMeBusiness;
}

export interface LoginRequest {
  email: string;
  password: string;
}

/** POST /auth/login/request-otp – password required (backend validates before sending OTP) */
export interface LoginOtpRequest {
  email: string;
  organizationCode: string;
  password: string;
}

/** POST /auth/login/verify-otp – no password in body */
export interface LoginOtpVerifyRequest {
  email: string;
  otp: string;
  organizationCode: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  businessName: string;
  firstName?: string;
  lastName?: string;
}

export interface SignupOtpVerifyRequest extends SignupRequest {
  otp: string;
}

export interface OtpRequestResponse {
  success: boolean;
  message: string;
  email: string;
  expiresIn: number;
}

export interface SessionUser {
  id: number;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: Role;
  businessId: number;
  businessName: string;
  organizationCode?: string;
  /** Business logo URL from /auth/me; used in header when available */
  businessLogoUrl?: string | null;
}
