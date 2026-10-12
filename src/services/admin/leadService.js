import { request, requestList } from "./client";

export const getOptions = () => request("/leads/options");

export const listLeads = (query = {}) => requestList("/leads", { query });

export const getLead = (id) => request(`/leads/${id}`);

export const createLead = (input) => request("/leads", { method: "POST", body: input });

export const updateLead = (id, changes) => request(`/leads/${id}`, { method: "PUT", body: changes });

export const changeStatus = (id, status, reason) =>
  request(`/leads/${id}/status`, { method: "PATCH", body: { status, reason } });

export const assignLead = (id, assignedTo) =>
  request(`/leads/${id}/assign`, { method: "PATCH", body: { assignedTo } });

export const addFollowup = (id, input) => request(`/leads/${id}/followups`, { method: "POST", body: input });

export const deleteLead = (id) => request(`/leads/${id}`, { method: "DELETE" });

export const getSummary = () => request("/leads/summary");