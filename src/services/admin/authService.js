import { request } from "./client";
import { clearToken, setToken } from "@/services/authToken";

export async function login({ email, password, remember = true }) {
  const data = await request("/auth/login", { method: "POST", body: { email, password } });
  setToken(data.token, remember);
  return data.user;
}

export const getSession = () => request("/auth/me");

export async function logout() {
  try {
    await request("/auth/logout", { method: "POST" });
  } catch {
    // Signing out locally matters more than telling the server about it.
  }
  clearToken();
}