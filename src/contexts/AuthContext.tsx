import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type {
  SessionUser,
  LoginRequest,
  SignupRequest,
  AuthResponse,
} from "@/types/auth";
import { setAccessToken, setRefreshToken, ApiClientError } from "@/lib/api";

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

function toSessionUser(
  auth: AuthResponse,
  role: "OWNER" | "STAFF" = "OWNER",
): SessionUser {
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

// Demo user for frontend development (remove when API is live)
const DEMO_AUTH: AuthResponse = {
  user: {
    id: 1,
    email: "owner@acme.com",
    firstName: "Rajesh",
    lastName: "Kumar",
  },
  business: { id: 1, name: "Acme Enterprises" },
  tokens: {
    accessToken: "demo-token",
    refreshToken: "demo-refresh",
    expiresIn: "15m",
  },
};

const STORAGE_KEY = "billbook_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = user !== null;

  // Check for existing session on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SessionUser;
        setUser(parsed);
        setAccessToken("demo-token");
      } catch {
        // corrupted data
      }
    }
    setIsLoading(false);
  }, []);

  const handleAuthSuccess = useCallback((auth: AuthResponse) => {
    const sessionUser = toSessionUser(auth);
    setAccessToken(auth.tokens.accessToken);
    setRefreshToken(auth.tokens.refreshToken);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser));
    setUser(sessionUser);
    setIsLoading(false);
  }, []);

  const login = useCallback(
    async (data: LoginRequest) => {
      try {
        // Replace with: const res = await api.post<AuthResponse>("/auth/login", data);
        // handleAuthSuccess(res.data);
        void data;
        handleAuthSuccess(DEMO_AUTH);
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
        // Replace with: const res = await api.post<AuthResponse>("/auth/signup", data);
        // handleAuthSuccess(res.data);
        void data;
        const demoAuth: AuthResponse = {
          ...DEMO_AUTH,
          user: {
            ...DEMO_AUTH.user,
            firstName: data.firstName,
            lastName: data.lastName,
            email: data.email,
          },
          business: { ...DEMO_AUTH.business, name: data.businessName },
        };
        handleAuthSuccess(demoAuth);
      } catch (error) {
        if (error instanceof ApiClientError) throw error;
        throw new Error("Signup failed. Please try again.");
      }
    },
    [handleAuthSuccess],
  );

  const logout = useCallback(async () => {
    try {
      // await api.post("/auth/logout");
    } catch {
      // Ignore logout errors
    } finally {
      setAccessToken(null);
      setRefreshToken(null);
      localStorage.removeItem(STORAGE_KEY);
      setUser(null);
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated, login, signup, logout }}
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
