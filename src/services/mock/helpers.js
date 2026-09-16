import { MOCK_LATENCY_MS } from "@/config/app";
import { getDb, saveDb } from "@/mock/db";
import { can, canViewLead, hasOutletAccess } from "@/lib/permissions";
import { AppError, createId } from "@/lib/utils";

const SESSION_KEY = "nucleus-crm:session";

export const delay = (ms = MOCK_LATENCY_MS) => new Promise((r) => setTimeout(r, ms));
export const clone = (v) => (v == null ? v : structuredClone(v));
export const nowIso = () => new Date().toISOString();

/* ---------- session ---------- */
export function readSession() {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem(SESSION_KEY) || window.sessionStorage.getItem(SESSION_KEY);
  try {
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeSession(session, remember) {
  clearSession();
  const store = remember ? window.localStorage : window.sessionStorage;
  store.setItem(SESSION_KEY, JSON.stringify(session));
}

export function clearSession() {
  window.localStorage.removeItem(SESSION_KEY);
  window.sessionStorage.removeItem(SESSION_KEY);
}

/** What the API's GET /auth/me would return. */
export function toSessionUser(db, user) {
  const role = db.roles.find((r) => r.id === user.roleId);
  return clone({
    ...user,
    role: { id: role.id, label: role.label },
    permissions: role.permissions,
    receivesLeads: Boolean(role.receivesLeads),
  });
}

/** Returns { db, user } or throws 401. */
export function context() {
  const db = getDb();
  const session = readSession();
  const raw = session && db.users.find((u) => u.id === session.userId && u.active);
  if (!raw) throw new AppError("Your session has ended. Please log in again.", "UNAUTHENTICATED", 401);
  return { db, user: toSessionUser(db, raw) };
}

export function requirePermission(user, permission) {
  if (!can(user, permission)) {
    throw new AppError("You don't have permission to do this.", "FORBIDDEN", 403);
  }
}

/* ---------- lookups ---------- */
export const findOutlet = (db, id) => db.outlets.find((o) => o.id === id);
export const findUser = (db, id) => db.users.find((u) => u.id === id);
export const findBrand = (db, id) => db.brands.find((b) => b.id === id);

export function accessibleOutlets(db, user) {
  return db.outlets.filter((o) => o.active && findBrand(db, o.brandId)?.active && hasOutletAccess(user, o));
}

export function visibleLeads(db, user) {
  return db.leads.filter((l) => canViewLead(user, l, findOutlet(db, l.outletId)));
}

/** Lead + brand/outlet/assignee objects, like an API response with joins. */
export function expandLead(db, lead) {
  const assignee = lead.assignedToId ? findUser(db, lead.assignedToId) : null;
  // Names of everyone who acted on the lead (for the timeline)
  const ids = new Set([...lead.activities.map((a) => a.byId), ...lead.followUps.map((f) => f.byId), lead.booking?.finalizedById]);
  const people = Object.fromEntries([...ids].filter(Boolean).map((id) => [id, findUser(db, id)?.name || "Former user"]));
  return clone({
    people,
    ...lead,
    brand: findBrand(db, lead.brandId),
    outlet: findOutlet(db, lead.outletId),
    assignee: assignee ? publicUser(assignee) : null,
    // Newest first; entries logged in the same millisecond keep their logical order
    activities: lead.activities
      .map((a, i) => [a, i])
      .sort(([a, i], [b, j]) => new Date(b.at) - new Date(a.at) || j - i)
      .map(([a]) => a),
    followUps: [...lead.followUps].sort((a, b) => new Date(b.at) - new Date(a.at)),
    emails: [...lead.emails].sort((a, b) => new Date(a.at) - new Date(b.at)),
  });
}

export function publicUser(u) {
  const { id, name, email, phone, title, roleId, outletIds, mailbox } = u;
  return { id, name, email, phone, title, roleId, outletIds, mailbox };
}

/** Load a lead the current user is allowed to see (raw, mutable). */
export function loadLead(db, user, id) {
  const lead = db.leads.find((l) => l.id === id);
  if (!lead) throw new AppError(`Lead ${id} does not exist.`, "NOT_FOUND", 404);
  if (!canViewLead(user, lead, findOutlet(db, lead.outletId))) {
    throw new AppError("This lead belongs to another outlet or Sales POC.", "FORBIDDEN", 403);
  }
  return lead;
}

export function addActivity(lead, type, message, byId = null) {
  const at = nowIso();
  lead.activities.push({ id: createId("act"), type, message, byId, at });
  lead.updatedAt = at;
}

export function notifyUser(db, userId, leadId, message) {
  if (!userId) return;
  db.notifications.unshift({ id: createId("nt"), userId, leadId, message, at: nowIso(), read: false });
}

/** Persist and return the updated lead view. */
export function commit(db, lead) {
  saveDb();
  return lead ? expandLead(db, lead) : null;
}

/**
 * Record an email the CRM sent to the customer so it shows in the lead's
 * email thread. Sent from the assigned Sales POC's mailbox when connected.
 */
export function logOutgoingEmail(db, lead, { subject, body }) {
  const assignee = lead.assignedToId && findUser(db, lead.assignedToId);
  const from = assignee?.mailbox?.connected ? assignee.mailbox.address : `bookings@${findBrand(db, lead.brandId)?.code?.toLowerCase() || "crm"}.example`;
  lead.emails.push({ id: createId("em"), direction: "out", from, to: lead.customer.email, subject, body, at: nowIso() });
}

