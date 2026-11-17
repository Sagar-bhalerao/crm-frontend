import { API_BASE_URL } from "@/config/app";
import { getToken } from "@/services/authToken";
import { request, requestList } from "./client";

/** Invoices across every lead the user can see, for the Proforma invoices page. */
export const listInvoices = (query = {}) => requestList("/invoices", { query });

export const listForLead = (leadId) => request(`/leads/${leadId}/invoices`);

export const getInvoice = (id) => request(`/invoices/${id}`);

/** Copies the lead's current quotation into a draft. */
export const createInvoice = (leadId, input) =>
  request(`/leads/${leadId}/invoices`, { method: "POST", body: input });

export const updateInvoice = (id, changes) =>
  request(`/invoices/${id}`, { method: "PUT", body: changes });

export const generatePdf = (id) => request(`/invoices/${id}/pdf`, { method: "POST" });

export const sendInvoice = (id) => request(`/invoices/${id}/send`, { method: "POST" });

export const recordPayment = (id, input) =>
  request(`/invoices/${id}/payment`, { method: "POST", body: input });

export const cancelInvoice = (id, reason) =>
  request(`/invoices/${id}/cancel`, { method: "POST", body: { reason } });

/** Same as quotations: the PDF route needs the token, so open it as a blob. */
export async function openInvoicePdf(id) {
  const res = await fetch(`${API_BASE_URL}/invoices/${id}/pdf`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("The PDF could not be opened. Try generating it again.");

  const url = URL.createObjectURL(await res.blob());
  window.open(url, "_blank");
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}

