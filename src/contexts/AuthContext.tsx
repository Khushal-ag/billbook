import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import type {
  SessionUser,
  LoginOtpRequest,
  LoginOtpVerifyRequest,
  SignupRequest,
  SignupOtpVerifyRequest,
  OtpRequestResponse,
  AuthResponse,
  AuthMeResponse,
  AdminLoginRequest,
} from "@/types/auth";
import { AUTH_EXPIRED_EVENT } from "@/constants/auth-events";
import { ACCESS_BLOCKED_EVENT, REFRESH_PERMISSIONS_EVENT } from "@/constants/access-events";
import { LAST_ORGANIZATION_CODE_KEY } from "@/constants/auth-storage";
import { api, setAccessToken, setRefreshToken, ApiClientError } from "@/api";
import {
  extractRoleGroupFromAuthMeBusiness,
  extractRoleGroupFromAuthMeUser,
} from "@/lib/auth-me-user";
import { parseAuthMePayload } from "@/lib/parse-auth-me-payload";

interface AuthState {
  user: SessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  requestLoginOtp: (data: LoginOtpRequest) => Promise<OtpRequestResponse>;
  verifyLoginOtp: (data: LoginOtpVerifyRequest) => Promise<void>;
  requestSignupOtp: (data: SignupRequest) => Promise<OtpRequestResponse>;
  verifySignupOtp: (data: SignupOtpVerifyRequest) => Promise<void>;
  adminLogin: (data: AdminLoginRequest) => Promise<void>;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
  /** When set, scoped access is blocked (e.g. inactive role group) — show full-screen message. */
  accessBlockedMessage: string | null;
  clearAccessBlocked: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = "billbook_session";

const AUTH_ERROR_MESSAGES: Record<string, string> = {
  INVALID_OTP: "Invalid or expired OTP. Please request a new OTP and try again.",
  INVALID_CREDENTIALS: "Invalid email or password.",
  CONFLICT: "Account already exists with this email.",
  FORBIDDEN: "You do not have access to this organization.",
  NOT_FOUND: "Organization not found. Check your organization code.",
};

function getAuthErrorCode(error: ApiClientError): string | null {
  const normalizedMessage = error.message.trim().toUpperCase();
  if (AUTH_ERROR_MESSAGES[normalizedMessage]) return normalizedMessage;

  if (error.details && typeof error.details === "object") {
    const maybeCode = (error.details as { code?: unknown }).code;
    if (typeof maybeCode === "string") {
      const normalizedCode = maybeCode.trim().toUpperCase();
      if (AUTH_ERROR_MESSAGES[normalizedCode]) return normalizedCode;
    }
  }

  return null;
}

function toAuthError(error: unknown, fallbackMessage: string): Error {
  if (error instanceof ApiClientError) {
    const code = getAuthErrorCode(error);
    const idNote = error.requestId
      ? `\n\nSupport reference: ${error.requestId}\n(Share this if you contact support.)`
      : "";
    if (code) return new Error(AUTH_ERROR_MESSAGES[code] + idNote);
    return new Error((error.message || fallbackMessage) + idNote);
  }

  if (error instanceof Error && error.message) {
    return new Error(error.message);
  }

  return new Error(fallbackMessage);
}

function toSessionUser(auth: AuthResponse, role: "OWNER" | "STAFF" = "OWNER"): SessionUser {
  return {
    id: auth.user.id,
    email: auth.user.email,
    firstName: auth.user.firstName,
    lastName: auth.user.lastName,
    role,
    businessId: auth.business.id,
    businessName: auth.business.name,
    organizationCode: auth.business.organizationCode,
    permissions: [],
  };
}

function persistLastOrganizationCode(code: string | undefined) {
  if (typeof window === "undefined") return;
  const trimmed = code?.trim();
  if (trimmed) {
    localStorage.setItem(LAST_ORGANIZATION_CODE_KEY, trimmed.toUpperCase());
  }
}

function sessionUserFromMe(me: AuthMeResponse): SessionUser {
  const { user: meUser, business: meBusiness } = me;
  const permissions = Array.isArray(meUser.permissions) ? meUser.permissions.slice() : [];
  const rg = extractRoleGroupFromAuthMeUser(meUser);
  const rgMembership =
    meUser && typeof meUser === "object" && "membership" in meUser
      ? extractRoleGroupFromAuthMeUser((meUser as Record<string, unknown>).membership)
      : { roleGroupId: null, roleGroupName: null };
  const rgBiz = extractRoleGroupFromAuthMeBusiness(meBusiness);
  return {
    id: meUser.id,
    email: meUser.email,
    firstName: meUser.firstName,
    lastName: meUser.lastName,
    role: meUser.role,
    businessId: meBusiness.id,
    businessName: meBusiness.name,
    organizationCode: meBusiness.organizationCode,
    businessLogoUrl: meBusiness.logoUrl ?? null,
    validityEnd: meBusiness.validityEnd ?? null,
    permissions,
    roleGroupId:
      rg.roleGroupId ?? rgMembership.roleGroupId ?? rgBiz.roleGroupId ?? meUser.roleGroupId ?? null,
    roleGroupName:
      rg.roleGroupName ??
      rgMembership.roleGroupName ??
      rgBiz.roleGroupName ??
      meUser.roleGroupName ??
      null,
  };
}

function persistSession(sessionUser: SessionUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
}

/** Persist and return the session derived from GET /auth/me (single code path for hydration). */
function commitSessionFromMe(me: AuthMeResponse): SessionUser {
  const sessionUser = sessionUserFromMe(me);
  persistSession(sessionUser);
  persistLastOrganizationCode(sessionUser.organizationCode);
  return sessionUser;
}

function clearSession() {
  setAccessToken(null);
  setRefreshToken(null);
  localStorage.removeItem(SESSION_KEY);
}

function authMeFromApiGet(res: unknown): AuthMeResponse | null {
  return parseAuthMePayload(res) ?? parseAuthMePayload((res as { data?: unknown }).data);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessBlockedMessage, setAccessBlockedMessage] = useState<string | null>(null);
  const refreshPermissionsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isAuthenticated = user !== null;

  const clearAccessBlocked = useCallback(() => {
    setAccessBlockedMessage(null);
  }, []);

  useEffect(() => {
    function onAuthExpired() {
      clearSession();
      setUser(null);
      setIsLoading(false);
      setAccessBlockedMessage(null);
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
    };
  }, []);

  useEffect(() => {
    function onAccessBlocked(e: Event) {
      const detail = (e as CustomEvent<{ message?: string }>).detail;
      const msg =
        typeof detail?.message === "string" && detail.message.trim() ? detail.message.trim() : null;
      setAccessBlockedMessage(
        msg ??
          "Your role group is no longer active. Please contact the business owner to restore access.",
      );
    }

    window.addEventListener(ACCESS_BLOCKED_EVENT, onAccessBlocked);
    return () => {
      window.removeEventListener(ACCESS_BLOCKED_EVENT, onAccessBlocked);
    };
  }, []);

  // Session check on every app load: GET /auth/me with credentials (cookie token sent).
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      try {
        const res = await api.get<AuthMeResponse>("/auth/me");
        const me = authMeFromApiGet(res);
        if (!me) throw new Error("Invalid /auth/me response");
        if (!cancelled) {
          setUser(commitSessionFromMe(me));
        }
      } catch {
        if (!cancelled) {
          clearSession();
          setUser(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAuthSuccess = useCallback(async (auth: AuthResponse) => {
    setAccessToken(auth.tokens.accessToken);
    setRefreshToken(auth.tokens.refreshToken);

    // Fetch /auth/me to get accurate role, validity, and branding
    try {
      const res = await api.get<AuthMeResponse>("/auth/me");
      const me = authMeFromApiGet(res);
      if (!me) throw new Error("Invalid /auth/me response");
      setUser(commitSessionFromMe(me));
    } catch {
      const sessionUser = toSessionUser(auth);
      persistSession(sessionUser);
      persistLastOrganizationCode(sessionUser.organizationCode);
      setUser(sessionUser);
    }
    setIsLoading(false);
  }, []);

  const requestLoginOtp = useCallback(
    async (data: LoginOtpRequest): Promise<OtpRequestResponse> => {
      try {
        const res = await api.post<OtpRequestResponse>("/auth/login/request-otp", {
          email: data.email,
          organizationCode: data.organizationCode,
          password: data.password,
        });
        return res.data;
      } catch (error) {
        throw toAuthError(error, "Failed to send OTP. Please try again.");
      }
    },
    [],
  );

  const verifyLoginOtp = useCallback(
    async (data: LoginOtpVerifyRequest) => {
      try {
        const res = await api.post<AuthResponse>("/auth/login/verify-otp", {
          email: data.email,
          otp: data.otp,
          organizationCode: data.organizationCode,
        });
        await handleAuthSuccess(res.data);
      } catch (error) {
        throw toAuthError(error, "Login verification failed. Please try again.");
      }
    },
    [handleAuthSuccess],
  );

  const requestSignupOtp = useCallback(async (data: SignupRequest): Promise<OtpRequestResponse> => {
    try {
      const res = await api.post<OtpRequestResponse>("/auth/signup/request-otp", data);
      return res.data;
    } catch (error) {
      throw toAuthError(error, "Failed to send OTP. Please try again.");
    }
  }, []);

  const verifySignupOtp = useCallback(
    async (data: SignupOtpVerifyRequest) => {
      try {
        const res = await api.post<AuthResponse>("/auth/signup/verify-otp", data);
        await handleAuthSuccess(res.data);
      } catch (error) {
        throw toAuthError(error, "Signup verification failed. Please try again.");
      }
    },
    [handleAuthSuccess],
  );

  const adminLogin = useCallback(
    async (data: AdminLoginRequest) => {
      try {
        const res = await api.post<AuthResponse>("/auth/admin/login", data);
        await handleAuthSuccess(res.data);
      } catch (error) {
        throw toAuthError(error, "Admin login failed. Please try again.");
      }
    },
    [handleAuthSuccess],
  );

  const refreshSession = useCallback(async () => {
    try {
      const res = await api.get<AuthMeResponse>("/auth/me");
      const me = authMeFromApiGet(res);
      if (!me) throw new Error("Invalid /auth/me response");
      setUser(commitSessionFromMe(me));
    } catch {
      clearSession();
      setUser(null);
    }
  }, []);

  const refreshSessionRef = useRef(refreshSession);
  refreshSessionRef.current = refreshSession;

  useEffect(() => {
    function onRefreshPermissions() {
      if (refreshPermissionsTimer.current) clearTimeout(refreshPermissionsTimer.current);
      refreshPermissionsTimer.current = setTimeout(() => {
        refreshPermissionsTimer.current = null;
        void refreshSessionRef.current();
      }, 400);
    }

    window.addEventListener(REFRESH_PERMISSIONS_EVENT, onRefreshPermissions);
    return () => {
      window.removeEventListener(REFRESH_PERMISSIONS_EVENT, onRefreshPermissions);
      if (refreshPermissionsTimer.current) clearTimeout(refreshPermissionsTimer.current);
    };
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore logout errors — clear locally regardless
    } finally {
      clearSession();
      setUser(null);
      setIsLoading(false);
      setAccessBlockedMessage(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        requestLoginOtp,
        verifyLoginOtp,
        requestSignupOtp,
        verifySignupOtp,
        adminLogin,
        refreshSession,
        logout,
        accessBlockedMessage,
        clearAccessBlocked,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
