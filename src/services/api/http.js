import { API_BASE_URL } from "@/config/app";
import { AppError } from "@/lib/utils";
import { clearToken, getToken } from "@/services/authToken";

/**
 * One fetch wrapper for the whole app. Adds the bearer token, turns a
 * failed response into an AppError carrying the API's message, and sends
 * the user back to login when the session is gone.
 */
export async function http(path, { method = "GET", body, query } = {}) {
  let url = `${API_BASE_URL}${path}`;

  if (query) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") params.set(key, value);
    }
    const qs = params.toString();
    if (qs) url += `?${qs}`;
  }

  const headers = { "Content-Type": "application/json" };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response;
  try {
    response = await fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined });
  } catch {
    throw new AppError("Cannot reach the server. Check that the API is running.", "NETWORK");
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    // The session is gone: drop the token and start again at login.
    if (response.status === 401 && typeof window !== "undefined") {
      clearToken();
      if (!window.location.pathname.startsWith("/login")) {
        window.location.assign(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      }
    }
    throw new AppError(
      payload?.message || `Request failed (${response.status})`,
      payload?.error?.code || "REQUEST_FAILED",
      payload?.error?.details
    );
  }

  return payload;
}