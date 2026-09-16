"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { authService } from "@/services";
import { can as canUser } from "@/lib/permissions";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | authenticated | anonymous

  useEffect(() => {
    authService
      .getSession()
      .then((u) => {
        setUser(u);
        setStatus(u ? "authenticated" : "anonymous");
      })
      .catch(() => setStatus("anonymous"));
  }, []);

  const login = useCallback(async (credentials) => {
    const u = await authService.login(credentials);
    setUser(u);
    setStatus("authenticated");
    return u;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
    setStatus("anonymous");
  }, []);

  const value = useMemo(
    () => ({ user, status, login, logout, can: (permission) => canUser(user, permission) }),
    [user, status, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
