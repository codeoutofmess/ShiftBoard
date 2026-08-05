import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import * as authApi from "../api/auth";
import { AUTH_STORAGE_KEY, UNAUTHORIZED_EVENT } from "../api/client";
import type { AuthResponse, LoginRequest, RegisterRequest } from "../api/types";

interface AuthUser {
  token: string;
  expiresAt: string;
  employeeId: number;
  name: string;
  email: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: (request: LoginRequest) => Promise<void>;
  register: (request: RegisterRequest) => Promise<void>;
  logout: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function loadStoredUser(): AuthUser | null {
  const stored = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!stored) return null;

  const user = JSON.parse(stored) as AuthUser;
  if (new Date(user.expiresAt) <= new Date()) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
  return user;
}

function toAuthUser(response: AuthResponse): AuthUser {
  return {
    token: response.token,
    expiresAt: response.expiresAt,
    employeeId: response.employeeId,
    name: response.name,
    email: response.email,
    role: response.role,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => loadStoredUser());

  const persist = useCallback((authUser: AuthUser | null) => {
    if (authUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
    setUser(authUser);
  }, []);

  const login = useCallback(
    async (request: LoginRequest) => {
      const response = await authApi.login(request);
      persist(toAuthUser(response));
    },
    [persist],
  );

  const register = useCallback(
    async (request: RegisterRequest) => {
      const response = await authApi.register(request);
      persist(toAuthUser(response));
    },
    [persist],
  );

  const logout = useCallback(() => persist(null), [persist]);

  useEffect(() => {
    window.addEventListener(UNAUTHORIZED_EVENT, logout);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, logout);
  }, [logout]);

  const value = useMemo(
    () => ({ user, isAuthenticated: user !== null, login, register, logout }),
    [user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
