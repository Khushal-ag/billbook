export type Role = "OWNER" | "STAFF" | "ADMIN";

export type TaxType = "GST" | "NON_GST";
export type TransferType = "NEFT" | "RTGS" | "IMPS" | "UPI";

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

/** Business classification option from business/industry type APIs. */
export interface BusinessClassificationOption {
  id: number;
  name: string;
  isPredefined: boolean;
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
  accountHolderName: string | null;
  bankAccountNumber: string | null;
  confirmAccountNumber: string | null;
  bankName: string | null;
  branchName: string | null;
  bankCity: string | null;
  bankState: string | null;
  ifscCode: string | null;
  transferAmount: string | null;
  transferCurrency: string | null;
  transferType: TransferType | null;
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
  accountHolderName?: string | null;
  bankAccountNumber?: string | null;
  confirmAccountNumber?: string | null;
  bankName?: string | null;
  branchName?: string | null;
  bankCity?: string | null;
  bankState?: string | null;
  ifscCode?: string | null;
  transferAmount?: string | null;
  transferCurrency?: string | null;
  transferType?: TransferType | null;
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
  /** OWNER/STAFF for business users; ADMIN for platform admin login */
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
  /** ISO date-time; when set, used for trial messaging and client-side guards */
  validityEnd?: string | null;
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

/** POST /auth/admin/login — password-based admin access (no OTP). */
export interface AdminLoginRequest {
  email: string;
  password: string;
  organizationCode: string;
}

/** POST /auth/login/request-otp — backend may require password before sending OTP */
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
  /** When false, UI should not prompt for email OTP (e.g. org uses a different login path). */
  requiresOtp?: boolean;
}

/** POST /auth/password/request-otp */
export interface PasswordResetOtpRequest {
  email: string;
  organizationCode: string;
}

/** Response is always success to avoid user enumeration */
export interface PasswordResetOtpResponse {
  success: boolean;
  message?: string;
}

/** POST /auth/password/verify-otp */
export interface PasswordResetVerifyRequest {
  email: string;
  organizationCode: string;
  otp: string;
}

export interface PasswordResetVerifyResponse {
  success: boolean;
  resetToken: string;
  /** TTL in milliseconds (e.g. 600000). Some envs may return seconds; handle defensively in UI. */
  expiresIn: number;
}

/** POST /auth/password/reset */
export interface PasswordResetRequest {
  resetToken: string;
  newPassword: string;
}

export interface PasswordResetResponse {
  success: boolean;
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
  /** From GET /auth/me — trial / plan validity end (ISO string), null if open-ended */
  validityEnd?: string | null;
}
