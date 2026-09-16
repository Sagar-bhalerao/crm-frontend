import { API_BASE_URL } from "@/config/app";
import { AppError } from "@/lib/utils";

/**
 * Fetch wrapper for the Express REST API.
 * Expects JSON errors shaped as { message, code }.
 * Auth: httpOnly session cookie set by POST /auth/login (credentials: "include").
 */
export async function http(path, { method = "GET", body, query } = {}) {
  const url = new URL(API_BASE_URL + path);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== "" && v != null) url.searchParams.set(k, v);
    });
  }

  const res = await fetch(url, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  const data = res.status === 204 ? null : await res.json().catch(() => null);
  if (!res.ok) {
    throw new AppError(data?.message || "Something went wrong. Try again.", data?.code || "HTTP_ERROR", res.status);
  }
  return data;
}
