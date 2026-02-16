import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import type {
  SessionUser,
  LoginRequest,
  SignupRequest,
  AuthResponse,
  CurrentUser,
} from "@/types/auth";
import { api, setAccessToken, getAccessToken, setRefreshToken, ApiClientError } from "@/api";

interface AuthState {
  user: SessionUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (data: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const SESSION_KEY = "billbook_session";

function toSessionUser(auth: AuthResponse, role: "OWNER" | "STAFF" = "OWNER"): SessionUser {
  return {
    id: auth.user.id,
    email: auth.user.email,
    firstName: auth.user.firstName,
    lastName: auth.user.lastName,
    role,
    businessId: auth.business.id,
    businessName: auth.business.name,
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

      // Validate token by calling /auth/me
      try {
        const res = await api.get<CurrentUser>("/auth/me");
        const me = res.data;
        if (!cancelled) {
          // Update session with latest data from server
          const updated: SessionUser = {
            ...JSON.parse(stored),
            id: me.userId,
            email: me.email,
            role: me.role,
            businessId: me.businessId,
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

  const login = useCallback(
    async (data: LoginRequest) => {
      try {
        const res = await api.post<AuthResponse>("/auth/login", data);
        handleAuthSuccess(res.data);
      } catch (error) {
        if (error instanceof ApiClientError) throw error;
        throw new Error("Login failed. Please try again.");
      }
    },
    [handleAuthSuccess],
  );

  const signup = useCallback(
    async (data: SignupRequest) => {
      try {
        const res = await api.post<AuthResponse>("/auth/signup", data);
        handleAuthSuccess(res.data);
      } catch (error) {
        if (error instanceof ApiClientError) throw error;
        throw new Error("Signup failed. Please try again.");
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
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
