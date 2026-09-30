import { request, requestList } from "./client";

/** SMTP sending details per location. The password is never returned, only whether one is saved. */
export const listMailConfigs = (query = {}) => requestList("/mail-configs", { query });

export const getMailConfig = (id) => request(`/mail-configs/${id}`);

export const createMailConfig = (input) => request("/mail-configs", { method: "POST", body: input });

/** Leave smtpPassword out to keep the saved password. */
export const updateMailConfig = (id, changes) => request(`/mail-configs/${id}`, { method: "PUT", body: changes });

export const setMailConfigStatus = (id, status) =>
  request(`/mail-configs/${id}/status`, { method: "PATCH", body: { status } });

export const deleteMailConfig = (id) => request(`/mail-configs/${id}`, { method: "DELETE" });
