import { request } from "./client";

export const getOptions = () => request("/rate-cards/options");
export const listRateCards = (query = {}) => request("/rate-cards", { query });
export const createRateCard = (input) => request("/rate-cards", { method: "POST", body: input });
export const updateRateCard = (id, changes) => request(`/rate-cards/${id}`, { method: "PUT", body: changes });
export const setRateCardStatus = (id, status) =>
  request(`/rate-cards/${id}/status`, { method: "PATCH", body: { status: Number(status) } });
export const deleteRateCard = (id) => request(`/rate-cards/${id}`, { method: "DELETE" });
export const copyRateCard = (fromLocationId, toLocationId) =>
  request("/rate-cards/copy", { method: "POST", body: { fromLocationId, toLocationId } });

/** What the quotation builder offers for one lead. */
export const forLead = (leadId) => request(`/rate-cards/for-lead/${leadId}`);