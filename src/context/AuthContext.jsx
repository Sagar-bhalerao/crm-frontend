"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DATA_SOURCE } from "@/config/app";
import { authService } from "@/services/admin";
import { getToken } from "@/services/authToken";
import { authService as mockAuthService } from "@/services";
import { DEMO_PASSWORD } from "@/mock/organization";

const AuthContext = createContext(null);

/**
 * The lead module still runs on sample data, and its services expect one of
 * the sample users to be signed in. Until leads move to the API, signing in
 * for real also signs into the matching sample account by role, so the lead
 * screens keep working. Delete this once leads come from the database.
 */
const SAMPLE_ACCOUNT_BY_ROLE = {
  super_admin: "superadmin@crm.example",
  admin: "admin@crm.example",
  sales_head: "saleshead@crm.example",
  sales_poc: "priya@crm.example",
};

async function signIntoSampleData(roleCode) {
  if (DATA_SOURCE !== "mock") return null;
  const email = SAMPLE_ACCOUNT_BY_ROLE[roleCode] || SAMPLE_ACCOUNT_BY_ROLE.admin;
  try {
    return await mockAuthService.login({ email, password: DEMO_PASSWORD, remember: true });
  } catch {
    return null;
  }
}

/** Shapes the API user the way the screens expect. */
function toAppUser(apiUser, sampleUser) {
  return {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    mobile: apiUser.mobile,
    title: apiUser.roleName,
    role: { id: apiUser.roleCode, label: apiUser.roleName },
    permissions: apiUser.permissions,
    brandId: apiUser.brandId,
    brandName: apiUser.brandName,
    locations: apiUser.locations,
    // Lead-module fields, from the sample account. They go away with the bridge.
    outletIds: sampleUser?.outletIds ?? [],
    receivesLeads: sampleUser?.receivesLeads ?? false,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState("loading"); // loading | authenticated | anonymous

  // On a refresh, ask the API who the stored token belongs to.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!getToken()) {
        setStatus("anonymous");
        return;
      }
      try {
        const apiUser = await authService.getSession();
        const sampleUser = await signIntoSampleData(apiUser.roleCode);
        if (cancelled) return;
        setUser(toAppUser(apiUser, sampleUser));
        setStatus("authenticated");
      } catch {
        if (!cancelled) setStatus("anonymous");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async ({ email, password, remember }) => {
    const apiUser = await authService.login({ email, password, remember });
    const sampleUser = await signIntoSampleData(apiUser.roleCode);
    const appUser = toAppUser(apiUser, sampleUser);
    setUser(appUser);
    setStatus("authenticated");
    return appUser;
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    if (DATA_SOURCE === "mock") await mockAuthService.logout().catch(() => {});
    setUser(null);
    setStatus("anonymous");
  }, []);

  const can = useCallback((permission) => Boolean(user?.permissions?.includes(permission)), [user]);

  const value = useMemo(() => ({ user, status, login, logout, can }), [user, status, login, logout, can]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);