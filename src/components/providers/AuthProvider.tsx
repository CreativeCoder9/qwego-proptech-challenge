"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

type AuthUser = {
  id: number | string;
  email?: string;
  name?: string;
  role?: "tenant" | "manager" | "technician";
};

type LoginInput = {
  email: string;
  password: string;
};

type RegisterInput = {
  email: string;
  name: string;
  password: string;
  phone?: string;
  unit?: string;
};

type AuthContextValue = {
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
  registerTenant: (input: RegisterInput) => Promise<void>;
  user: AuthUser | null;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const extractErrorMessage = async (response: Response): Promise<string> => {
  try {
    const body = (await response.json()) as { errors?: Array<{ message?: string }>; message?: string };
    const firstError = body.errors?.[0]?.message;
    if (firstError) {
      return firstError;
    }

    if (body.message) {
      return body.message;
    }
  } catch {
    // ignore parsing errors and fall through to generic message
  }

  return "Request failed. Please try again.";
};

type MeResponse = {
  user?: AuthUser | null;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    try {
      const response = await fetch("/api/users/me", {
        credentials: "include",
        method: "GET",
      });

      if (!response.ok) {
        setUser(null);
        return null;
      }

      const data = (await response.json()) as MeResponse;
      const nextUser = data.user ?? null;
      setUser(nextUser);
      return nextUser;
    } catch {
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        await refreshUser();
      } finally {
        setIsLoading(false);
      }
    };

    void run();
  }, [refreshUser]);

  const login = useCallback(
    async (input: LoginInput) => {
      const response = await fetch("/api/users/login", {
        body: JSON.stringify(input),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }

      await refreshUser();
    },
    [refreshUser],
  );

  const registerTenant = useCallback(
    async (input: RegisterInput) => {
      const response = await fetch("/api/users", {
        body: JSON.stringify(input),
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(await extractErrorMessage(response));
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    const response = await fetch("/api/users/logout", {
      credentials: "include",
      method: "POST",
    });

    if (!response.ok) {
      throw new Error(await extractErrorMessage(response));
    }

    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isLoading,
      login,
      logout,
      refreshUser,
      registerTenant,
      user,
    }),
    [isLoading, login, logout, refreshUser, registerTenant, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};
