import { request, requestList } from "./client";

/** WhatsApp sending details per location. The auth key is never returned, only whether one is saved. */
export const listWhatsappConfigs = (query = {}) => requestList("/whatsapp-configs", { query });

export const getWhatsappConfig = (id) => request(`/whatsapp-configs/${id}`);

export const createWhatsappConfig = (input) => request("/whatsapp-configs", { method: "POST", body: input });

/** Leave authKey out to keep the saved key. */
export const updateWhatsappConfig = (id, changes) => request(`/whatsapp-configs/${id}`, { method: "PUT", body: changes });

export const setWhatsappConfigStatus = (id, status) =>
  request(`/whatsapp-configs/${id}/status`, { method: "PATCH", body: { status } });

export const deleteWhatsappConfig = (id) => request(`/whatsapp-configs/${id}`, { method: "DELETE" });
