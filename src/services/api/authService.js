import { http } from "./http";

export const login = (body) => http("/auth/login", { method: "POST", body });
export const getSession = () => http("/auth/me").catch(() => null);
export const logout = () => http("/auth/logout", { method: "POST" });
export const requestPasswordReset = (email) => http("/auth/forgot-password", { method: "POST", body: { email } });
