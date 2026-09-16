import { http } from "./http";

export const getLeadMail = (leadId) => http(`/leads/${leadId}/emails`);
export const sendLeadEmail = (leadId, body) => http(`/leads/${leadId}/emails`, { method: "POST", body });
export const syncMailbox = (leadId) => http(`/leads/${leadId}/emails/sync`, { method: "POST" });
