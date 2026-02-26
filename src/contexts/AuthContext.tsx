import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type {
  SessionUser,
  LoginOtpRequest,
  LoginOtpVerifyRequest,
  SignupRequest,
  SignupOtpVerifyRequest,
  OtpRequestResponse,
  AuthResponse,
  AuthMeResponse,
} from "@/types/auth";
import { api, setAccessToken, getAccessToken, setRefreshToken, ApiClientError } from "@/api";

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
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = "billbook_session";
const AUTH_EXPIRED_EVENT = "auth:expired";

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
    if (code) return new Error(AUTH_ERROR_MESSAGES[code]);
    return new Error(error.message || fallbackMessage);
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
  };
}

function persistSession(sessionUser: SessionUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(sessionUser));
}

function clearSession() {
  setAccessToken(null);
  setRefreshToken(null);
  localStorage.removeItem(SESSION_KEY);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null;

  useEffect(() => {
    function onAuthExpired() {
      clearSession();
      setUser(null);
      setIsLoading(false);
    }

    window.addEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
    return () => {
      window.removeEventListener(AUTH_EXPIRED_EVENT, onAuthExpired);
    };
  }, []);

  // Restore session on mount: read cached user then validate token via /auth/me
  useEffect(() => {
    let cancelled = false;

    async function restore() {
      const token = getAccessToken();
      const stored = localStorage.getItem(SESSION_KEY);

      if (!token || !stored) {
        clearSession();
        setIsLoading(false);
        return;
      }

      // Optimistically restore from cache
      try {
        const cached = JSON.parse(stored) as SessionUser;
        if (!cancelled) setUser(cached);
      } catch {
        // corrupted cache — clear everything
        clearSession();
        if (!cancelled) setIsLoading(false);
        return;
      }

      // Validate token and get current user + business from /auth/me
      try {
        const res = await api.get<AuthMeResponse>("/auth/me");
        const { user: meUser, business: meBusiness } = res.data;
        if (!cancelled) {
          const updated: SessionUser = {
            id: meUser.id,
            email: meUser.email,
            firstName: meUser.firstName,
            lastName: meUser.lastName,
            role: meUser.role,
            businessId: meBusiness.id,
            businessName: meBusiness.name,
            organizationCode: meBusiness.organizationCode,
            businessLogoUrl: meBusiness.logoUrl ?? null,
          };
          persistSession(updated);
          setUser(updated);
        }
      } catch {
        // Token invalid — clear session
        clearSession();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAuthSuccess = useCallback((auth: AuthResponse) => {
    const sessionUser = toSessionUser(auth);
    setAccessToken(auth.tokens.accessToken);
    setRefreshToken(auth.tokens.refreshToken);
    persistSession(sessionUser);
    setUser(sessionUser);
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
        handleAuthSuccess(res.data);
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
        handleAuthSuccess(res.data);
      } catch (error) {
        throw toAuthError(error, "Signup verification failed. Please try again.");
      }
    },
    [handleAuthSuccess],
  );

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
      // Ignore logout errors — clear locally regardless
    } finally {
      clearSession();
      setUser(null);
      setIsLoading(false);
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
        logout,
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
