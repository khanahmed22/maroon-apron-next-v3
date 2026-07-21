'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import type { ReactNode } from "react";

interface UserProps {
  id: string;
  name: string;
  email: string;
  createdAt?: string;
}

interface AuthContextType {
  session: UserProps | null;
  loading: boolean;
  setSession: React.Dispatch<React.SetStateAction<UserProps | null>>;
  checkAuth: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthContextProvider({
  children,
}: AuthProviderProps) {
  const [session, setSession] = useState<UserProps | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", {
        credentials: "include",
      });

      if (!res.ok) {
        setSession(null);
        return;
      }

      const data = await res.json();
      setSession(data.user);
    } catch (err) {
      console.error(err);
      setSession(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void checkAuth();
  }, [checkAuth]);

  return (
    <AuthContext.Provider
      value={{
        session,
        setSession,
        checkAuth,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function UserAuth(): AuthContextType {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "UserAuth must be used within AuthContextProvider"
    );
  }

  return context;
}