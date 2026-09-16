import { DATA_SOURCE } from "@/config/app";
import { emit, EVENTS } from "@/lib/events";

import * as mockAuth from "./mock/authService";
import * as mockLeads from "./mock/leadService";
import * as mockOrg from "./mock/orgService";
import * as mockMail from "./mock/mailService";
import * as mockNotifications from "./mock/notificationService";

import * as apiAuth from "./api/authService";
import * as apiLeads from "./api/leadService";
import * as apiOrg from "./api/orgService";
import * as apiMail from "./api/mailService";
import * as apiNotifications from "./api/notificationService";

/**
 * The only place that decides mock vs real API.
 * Components import from "@/services" and never know the difference.
 *
 *   NEXT_PUBLIC_DATA_SOURCE=mock  -> services/mock/*
 *   NEXT_PUBLIC_DATA_SOURCE=api   -> services/api/*  (Express REST)
 */
const useApi = DATA_SOURCE === "api";

/** After these calls succeed, open screens refresh (dashboard, lists, bell). */
function withRefresh(service, names, events) {
  const wrapped = { ...service };
  names.forEach((name) => {
    wrapped[name] = async (...args) => {
      const result = await service[name](...args);
      events.forEach((e) => emit(e, result));
      return result;
    };
  });
  return wrapped;
}

const LEAD_MUTATIONS = [
  "createLead",
  "simulateWebsiteEnquiry",
  "updateLeadDetails",
  "changeStatus",
  "assignLead",
  "addFollowUp",
  "saveQuotation",
  "generateInvoice",
  "finalizeLead",
  "sendConfirmation",
  "resetDemoData",
];

export const authService = useApi ? apiAuth : mockAuth;
export const orgService = useApi ? apiOrg : mockOrg;

export const leadService = withRefresh(useApi ? apiLeads : mockLeads, LEAD_MUTATIONS, [
  EVENTS.LEADS_CHANGED,
  EVENTS.NOTIFICATIONS_CHANGED,
]);

export const mailService = withRefresh(useApi ? apiMail : mockMail, ["sendLeadEmail", "syncMailbox"], [EVENTS.LEADS_CHANGED]);

export const notificationService = withRefresh(useApi ? apiNotifications : mockNotifications, ["markAllRead"], [
  EVENTS.NOTIFICATIONS_CHANGED,
]);
