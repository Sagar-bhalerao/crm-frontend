import { API_BASE_URL } from "@/config/app";
import { getToken } from "@/services/authToken";
import { request } from "./client";

export const listForLead = (leadId) => request(`/leads/${leadId}/quotations`);

export const getQuotation = (id) => request(`/quotations/${id}`);

export const createQuotation = (leadId, input) =>
  request(`/leads/${leadId}/quotations`, { method: "POST", body: input });

export const generatePdf = (id) => request(`/quotations/${id}/pdf`, { method: "POST" });

export const shareQuotation = (id) => request(`/quotations/${id}/share`, { method: "POST" });

export const setQuotationStatus = (id, status) =>
  request(`/quotations/${id}/status`, { method: "PATCH", body: { status } });

/** What the builder offers for this lead, with rates resolved for the event date. */
export const rateCardForLead = (leadId) => request(`/rate-cards/for-lead/${leadId}`);

/**
 * The PDF route needs the bearer token, which a plain link cannot send,
 * so fetch it as a blob and open that instead.
 */
export async function openQuotationPdf(id) {
  const res = await fetch(`${API_BASE_URL}/quotations/${id}/pdf`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("The PDF could not be opened. Try generating it again.");

  const url = URL.createObjectURL(await res.blob());
  window.open(url, "_blank");
  // Give the new tab time to load before releasing the blob
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}