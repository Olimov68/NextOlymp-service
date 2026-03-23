"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { getMe, type User, type UserProfile, type TokenPair, type MeResponse } from "./api";

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  token: string | null;
  nextStep: string | null;
  setAuth: (tokens: TokenPair, user: User, nextStep?: string) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  token: null,
  nextStep: null,
  setAuth: () => {},
  refreshUser: async () => {},
  logout: () => {},
  loading: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [nextStep, setNextStep] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedAccess = localStorage.getItem("access_token");
    if (storedAccess) {
      setToken(storedAccess);
      getMe()
        .then((data: MeResponse) => {
          setUser(data.user);
          setProfile(data.profile ?? null);
          setNextStep(data.next_step);
        })
        .catch(() => {
          localStorage.removeItem("access_token");
          localStorage.removeItem("refresh_token");
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const setAuth = useCallback((tokens: TokenPair, u: User, step?: string) => {
    localStorage.setItem("access_token", tokens.access_token);
    localStorage.setItem("refresh_token", tokens.refresh_token);
    setToken(tokens.access_token);
    setUser(u);
    if (step) setNextStep(step);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const data = await getMe();
      setUser(data.user);
      setProfile(data.profile ?? null);
      setNextStep(data.next_step);
    } catch {
      // ignore
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    setToken(null);
    setUser(null);
    setProfile(null);
    setNextStep(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, token, nextStep, setAuth, refreshUser, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
