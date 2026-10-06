import { request } from "./client";

/** Message types, auth types and the variable list, for the dropdowns. */
export const getOptions = () => request("/messaging/options");

// ── WhatsApp credentials ──────────────────────────────────────────────────
export const listProviders = (query = {}) => request("/messaging/whatsapp/providers", { query });
export const createProvider = (input) => request("/messaging/whatsapp/providers", { method: "POST", body: input });
export const updateProvider = (id, changes) => request(`/messaging/whatsapp/providers/${id}`, { method: "PUT", body: changes });
export const setProviderStatus = (id, status) =>
  request(`/messaging/whatsapp/providers/${id}/status`, { method: "PATCH", body: { status: Number(status) } });
export const deleteProvider = (id) => request(`/messaging/whatsapp/providers/${id}`, { method: "DELETE" });

// ── WhatsApp messages ─────────────────────────────────────────────────────
export const listMessages = (query = {}) => request("/messaging/whatsapp/messages", { query });
export const createMessage = (input) => request("/messaging/whatsapp/messages", { method: "POST", body: input });
export const updateMessage = (id, changes) => request(`/messaging/whatsapp/messages/${id}`, { method: "PUT", body: changes });
export const setMessageStatus = (id, status) =>
  request(`/messaging/whatsapp/messages/${id}/status`, { method: "PATCH", body: { status: Number(status) } });
export const deleteMessage = (id) => request(`/messaging/whatsapp/messages/${id}`, { method: "DELETE" });

// ── Email ─────────────────────────────────────────────────────────────────
export const listEmailConfigs = (query = {}) => request("/messaging/email/configs", { query });
export const createEmailConfig = (input) => request("/messaging/email/configs", { method: "POST", body: input });
export const updateEmailConfig = (id, changes) => request(`/messaging/email/configs/${id}`, { method: "PUT", body: changes });
export const setEmailConfigStatus = (id, status) =>
  request(`/messaging/email/configs/${id}/status`, { method: "PATCH", body: { status: Number(status) } });
export const deleteEmailConfig = (id) => request(`/messaging/email/configs/${id}`, { method: "DELETE" });
export const testEmailConfig = (id, to) => request(`/messaging/email/configs/${id}/test`, { method: "POST", body: { to } });