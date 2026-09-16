import { http } from "./http";

/** Same function names and return shapes as services/mock/leadService.js */
export const listLeads = (query) => http("/leads", { query });
export const getLead = (id) => http(`/leads/${id}`);
export const getDashboard = () => http("/dashboard");
export const listFollowUps = () => http("/follow-ups");
export const createLead = (body) => http("/leads", { method: "POST", body });
export const simulateWebsiteEnquiry = (body) => http("/public/enquiries", { method: "POST", body });
export const updateLeadDetails = (id, body) => http(`/leads/${id}`, { method: "PATCH", body });
export const changeStatus = (id, body) => http(`/leads/${id}/status`, { method: "POST", body });
export const assignLead = (id, body) => http(`/leads/${id}/assign`, { method: "POST", body });
export const addFollowUp = (id, body) => http(`/leads/${id}/follow-ups`, { method: "POST", body });
export const saveQuotation = (id, body) => http(`/leads/${id}/quotation`, { method: "PUT", body });
export const generateInvoice = (id, body) => http(`/leads/${id}/proforma-invoice`, { method: "POST", body });
export const finalizeLead = (id, body) => http(`/leads/${id}/finalize`, { method: "POST", body });
export const getConfirmationPreview = (id) => http(`/leads/${id}/confirmation`);
export const sendConfirmation = (id) => http(`/leads/${id}/confirmation`, { method: "POST" });
export const resetDemoData = async () => {};
