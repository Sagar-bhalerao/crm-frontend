import { DEFAULT_TAX_RATE, QUOTATION_VALID_DAYS } from "@/config/app";
import { getChannel, getLeadSource, getLeadType, leadTypeNeeds } from "@/config/leadOptions";
import { getStatus } from "@/config/leadStatuses";
import { P } from "@/config/permissions";
import { resetDb } from "@/mock/db";
import { getTemplate } from "@/mock/templates";
import { pickAssignee } from "@/lib/assignment";
import { buildDashboard } from "@/lib/dashboard";
import { addDays } from "@/lib/format";
import { applyLeadQuery } from "@/lib/leadQuery";
import { can, hasOutletAccess } from "@/lib/permissions";
import { calcTotals } from "@/lib/quotation";
import { renderConfirmation } from "@/lib/confirmation";
import { getNextStatuses, getRequirementError, isOpenLead } from "@/lib/leadWorkflow";
import { AppError } from "@/lib/utils";
import {
  logOutgoingEmail,
  accessibleOutlets,
  addActivity,

  commit,
  context,
  delay,
  expandLead,
  findBrand,
  findOutlet,
  findUser,
  loadLead,
  notifyUser,
  nowIso,
  requirePermission,
  visibleLeads,
} from "./helpers";
import { deliverBookingConfirmation } from "./messagingService";

/* =====================================================================
   Queries
   ===================================================================== */

/** GET /leads */
export async function listLeads(query = {}) {
  await delay();
  const { db, user } = context();
  const result = applyLeadQuery(visibleLeads(db, user), query);
  return { ...result, items: result.items.map((l) => expandLead(db, l)) };
}

/** GET /leads/:id */
export async function getLead(id) {
  await delay();
  const { db, user } = context();
  return expandLead(db, loadLead(db, user, id));
}

/** GET /dashboard */
export async function getDashboard() {
  await delay();
  const { db, user } = context();
  const data = buildDashboard(visibleLeads(db, user), { outlets: accessibleOutlets(db, user) });
  return {
    ...data,
    recent: data.recent.map((l) => expandLead(db, l)),
    pendingFollowUps: data.pendingFollowUps.map((l) => expandLead(db, l)),
  };
}

/** GET /follow-ups — open leads with a scheduled follow-up */
export async function listFollowUps() {
  await delay();
  const { db, user } = context();
  return visibleLeads(db, user)
    .filter((l) => isOpenLead(l) && l.nextFollowUpAt)
    .sort((a, b) => new Date(a.nextFollowUpAt) - new Date(b.nextFollowUpAt))
    .map((l) => expandLead(db, l));
}

/* =====================================================================
   Create
   ===================================================================== */

/** POST /leads — manual lead created by a CRM user */
export async function createLead(input) {
  await delay(500);
  const { db, user } = context();
  requirePermission(user, P.LEAD_CREATE);
  const outlet = findOutlet(db, input.outletId);
  if (!outlet || !hasOutletAccess(user, outlet)) throw new AppError("Choose an outlet you have access to.", "VALIDATION");

  let assigneeId = null;
  if (input.assignedToId && can(user, P.LEAD_ASSIGN)) assigneeId = input.assignedToId;
  else if (user.receivesLeads) assigneeId = user.id;

  const lead = insertLead(db, { ...input, source: input.source || "phone" }, { assigneeId, actor: user });
  return commit(db, lead);
}

/**
 * POST /public/enquiries — what the website form will call.
 * Prototype only: lets testers push a website enquiry into the CRM.
 */
export async function simulateWebsiteEnquiry(input) {
  await delay(700);
  const { db, user } = context();
  requirePermission(user, P.DEMO_SIMULATE);
  const outlet = findOutlet(db, input.outletId);
  if (!outlet) throw new AppError("Choose an outlet.", "VALIDATION");
  const lead = insertLead(db, { ...input, source: "website" }, { assigneeId: null, actor: null });
  return commit(db, lead);
}

function insertLead(db, input, { assigneeId, actor }) {
  validateLeadInput(input);
  const outlet = findOutlet(db, input.outletId);
  const brand = findBrand(db, outlet.brandId);
  const at = nowIso();

  const lead = {
    id: `${brand.code}-${outlet.code}-${db.counters.lead++}`,
    brandId: brand.id,
    outletId: outlet.id,
    type: input.type,
    source: input.source,
    status: "new",
    customer: {
      name: input.customer.name.trim(),
      mobile: input.customer.mobile.replace(/\D/g, "").slice(-10),
      email: input.customer.email.trim(),
    },
    company: leadTypeNeeds(input.type, "company") ? { ...input.company } : null,
    event: normaliseEvent(input.event, input.type),
    assignedToId: null,
    notInterestedReason: null,
    createdAt: at,
    updatedAt: at,
    lastFollowUpAt: null,
    nextFollowUpAt: null,
    followUps: [],
    quotation: null,
    invoice: null,
    booking: null,
    activities: [],
    emails: [],
  };

  if (actor) addActivity(lead, "lead_created", `Lead created manually by ${actor.name} (${getLeadSource(input.source).label})`, actor.id);
  else addActivity(lead, "lead_received", `Enquiry received from ${brand.website || brand.name + " website"}`);

  // Outlet-based assignment
  const assignee = assigneeId
    ? findUser(db, assigneeId)
    : pickAssignee({ users: db.users, roles: db.roles, leads: db.leads, outletId: outlet.id });

  if (assignee) {
    lead.assignedToId = assignee.id;
    const how = assigneeId ? "" : " automatically";
    addActivity(lead, "assigned", `Assigned${how} to ${assignee.name} (${outlet.name})`, null);
    if (!actor || actor.id !== assignee.id) {
      notifyUser(db, assignee.id, lead.id, `New lead ${lead.id} from ${lead.customer.name} assigned to you`);
    }
  } else {
    addActivity(lead, "assigned", `No Sales POC available for ${outlet.name}. Lead is unassigned.`, null);
  }

  db.leads.push(lead);
  return lead;
}

/* =====================================================================
   Update
   ===================================================================== */

/** PATCH /leads/:id */
export async function updateLeadDetails(id, input) {
  await delay(400);
  const { db, user } = context();
  requirePermission(user, P.LEAD_UPDATE);
  const lead = loadLead(db, user, id);
  assertEditable(lead);
  validateLeadInput({ ...input, outletId: lead.outletId });

  lead.type = input.type;
  lead.customer = { ...input.customer, mobile: input.customer.mobile.replace(/\D/g, "").slice(-10) };
  lead.company = leadTypeNeeds(input.type, "company") ? { ...input.company } : null;
  lead.event = normaliseEvent(input.event, input.type);
  addActivity(lead, "updated", "Lead details updated", user.id);
  return commit(db, lead);
}

/** POST /leads/:id/status */
export async function changeStatus(id, { status, reason = "", note = "" }) {
  await delay(400);
  const { db, user } = context();
  requirePermission(user, P.LEAD_UPDATE);
  const lead = loadLead(db, user, id);
  const target = getStatus(status);

  if (!getNextStatuses(lead, user).some((s) => s.key === status)) {
    throw new AppError(`A lead in ${getStatus(lead.status).label} cannot move to ${target.label}.`, "INVALID_TRANSITION");
  }
  const reqError = getRequirementError(lead, status);
  if (reqError) throw new AppError(reqError, "REQUIREMENT");
  if (target.key === "finalized") throw new AppError("Use Finalize booking to confirm this lead.", "USE_FINALIZE");
  if (target.needsReason && !reason) throw new AppError("Select a reason.", "VALIDATION");

  const from = getStatus(lead.status).label;
  // Going back before the invoice stage withdraws the invoice so the quotation can be revised
  if (lead.invoice && ["quotation", "in_progress"].includes(status)) {
    addActivity(lead, "invoice_withdrawn", `Proforma invoice ${lead.invoice.number} withdrawn for revision`, user.id);
    lead.invoice = null;
  }
  lead.status = status;
  lead.notInterestedReason = target.needsReason ? reason : null;
  if (target.needsReason) lead.nextFollowUpAt = null;

  const detail = target.needsReason ? `: ${reason}` : "";
  const message = status === "not_interested" ? `Marked as Not interested${detail}` : `Status changed from ${from} to ${target.label}`;
  addActivity(lead, "status_changed", note ? `${message}. ${note}` : message, user.id);
  return commit(db, lead);
}

/** POST /leads/:id/assign */
export async function assignLead(id, { assigneeId, note = "" }) {
  await delay(400);
  const { db, user } = context();
  requirePermission(user, P.LEAD_ASSIGN);
  const lead = loadLead(db, user, id);
  const next = findUser(db, assigneeId);
  if (!next) throw new AppError("Choose a person to assign this lead to.", "VALIDATION");
  if (next.id === lead.assignedToId) throw new AppError(`${next.name} already owns this lead.`, "VALIDATION");

  const prev = lead.assignedToId ? findUser(db, lead.assignedToId) : null;
  lead.assignedToId = next.id;
  const msg = prev ? `Reassigned from ${prev.name} to ${next.name}` : `Assigned to ${next.name}`;
  addActivity(lead, "reassigned", note ? `${msg}. ${note}` : msg, user.id);
  notifyUser(db, next.id, lead.id, `${user.name} assigned lead ${lead.id} (${lead.customer.name}) to you`);
  return commit(db, lead);
}

/** POST /leads/:id/follow-ups */
export async function addFollowUp(id, { channel, outcome, note = "", nextFollowUpAt = null }) {
  await delay(400);
  const { db, user } = context();
  requirePermission(user, P.FOLLOWUP_CREATE);
  const lead = loadLead(db, user, id);
  assertEditable(lead);
  if (!channel || !outcome) throw new AppError("Choose how you contacted the customer and the outcome.", "VALIDATION");

  const at = nowIso();
  const next = nextFollowUpAt ? new Date(nextFollowUpAt).toISOString() : null;
  lead.followUps.push({ id: `fu_${Date.now()}`, channel, outcome, note, at, byId: user.id, nextFollowUpAt: next });
  lead.lastFollowUpAt = at;
  lead.nextFollowUpAt = next;
  addActivity(lead, "follow_up", `${getChannel(channel)}: ${outcome}${note ? `. ${note}` : ""}`, user.id);

  // Contacting a new lead moves it forward automatically
  if (lead.status === "new") {
    lead.status = "in_progress";
    addActivity(lead, "status_changed", "Status changed from New to In progress", user.id);
  }
  return commit(db, lead);
}

/** PUT /leads/:id/quotation */
export async function saveQuotation(id, { items, discount = 0, taxRate = DEFAULT_TAX_RATE, validUntil, notes = "", share = false }) {
  await delay(500);
  const { db, user } = context();
  requirePermission(user, P.QUOTATION_CREATE);
  const lead = loadLead(db, user, id);
  assertEditable(lead);
  if (lead.invoice) throw new AppError("A proforma invoice exists. Move the lead back to Quotation to revise.", "LOCKED");

  const cleanItems = (items || [])
    .map((i) => ({ description: String(i.description || "").trim(), qty: Number(i.qty) || 0, rate: Number(i.rate) || 0 }))
    .filter((i) => i.description && i.qty > 0);
  if (cleanItems.length === 0) throw new AppError("Add at least one line item.", "VALIDATION");

  const outlet = findOutlet(db, lead.outletId);
  const at = nowIso();
  const prev = lead.quotation;
  lead.quotation = {
    number: prev?.number || `QT-${outlet.code}-${db.counters.quotation++}`,
    version: prev ? (prev.status === "shared" ? prev.version + 1 : prev.version) : 1,
    items: cleanItems,
    discount: Number(discount) || 0,
    taxRate: Number(taxRate) || 0,
    validUntil: validUntil ? new Date(validUntil).toISOString() : addDays(at, QUOTATION_VALID_DAYS).toISOString(),
    notes,
    status: share ? "shared" : "draft",
    updatedAt: at,
    sharedAt: share ? at : prev?.sharedAt || null,
  };

  const total = calcTotals(lead.quotation).total.toLocaleString("en-IN");
  const label = `${lead.quotation.number} v${lead.quotation.version}`;
  if (share) {
    addActivity(lead, "quotation_shared", `Quotation ${label} shared by email and WhatsApp (₹${total})`, user.id);
    logOutgoingEmail(db, lead, {
      subject: `Quotation ${lead.quotation.number} for your ${getLeadType(lead.type).label.toLowerCase()}`,
      body: `Hi ${lead.customer.name.split(" ")[0]},\n\nPlease find attached quotation ${label} for ${lead.event.guests} guests. Total: ₹${total} including GST.\n\nThe quotation is valid until ${new Date(lead.quotation.validUntil).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}.\n\nRegards,\n${findUser(db, lead.assignedToId)?.name || user.name}`,
    });
    if (["new", "in_progress"].includes(lead.status)) {
      addActivity(lead, "status_changed", `Status changed from ${getStatus(lead.status).label} to Quotation`, user.id);
      lead.status = "quotation";
    }
  } else {
    addActivity(lead, "quotation_created", `Quotation ${label} saved as draft (₹${total})`, user.id);
  }
  return commit(db, lead);
}

/** POST /leads/:id/proforma-invoice */
export async function generateInvoice(id, input) {
  await delay(600);
  const { db, user } = context();
  requirePermission(user, P.INVOICE_CREATE);
  const lead = loadLead(db, user, id);
  assertEditable(lead);
  if (!lead.quotation) throw new AppError("Create a quotation before generating a proforma invoice.", "REQUIREMENT");
  if (!input.billingName?.trim()) throw new AppError("Add a billing name.", "VALIDATION");

  const outlet = findOutlet(db, lead.outletId);
  const at = nowIso();
  lead.invoice = {
    number: lead.invoice?.number || `PI-${outlet.code}-${db.counters.invoice++}`,
    items: lead.quotation.items,
    discount: lead.quotation.discount,
    taxRate: lead.quotation.taxRate,
    advancePercent: Number(input.advancePercent) || 0,
    dueDate: new Date(input.dueDate || addDays(at, 3)).toISOString(),
    billingName: input.billingName.trim(),
    billingGstin: (input.billingGstin || "").trim(),
    terms: input.terms || "",
    generatedAt: at,
    sharedAt: at,
  };
  addActivity(lead, "invoice_shared", `Proforma invoice ${lead.invoice.number} generated and shared with customer`, user.id);
  const inv = calcTotals(lead.invoice);
  logOutgoingEmail(db, lead, {
    subject: `Proforma invoice ${lead.invoice.number}`,
    body: `Hi ${lead.customer.name.split(" ")[0]},\n\nPlease find attached proforma invoice ${lead.invoice.number}. Total ₹${inv.total.toLocaleString("en-IN")}, advance of ₹${inv.advance.toLocaleString("en-IN")} confirms the booking.\n\nRegards,\n${findUser(db, lead.assignedToId)?.name || user.name}`,
  });
  if (["in_progress", "quotation"].includes(lead.status)) {
    addActivity(lead, "status_changed", `Status changed from ${getStatus(lead.status).label} to Proforma invoice`, user.id);
    lead.status = "proforma_invoice";
  }
  return commit(db, lead);
}

/** POST /leads/:id/finalize */
export async function finalizeLead(id, { advancePaid, paymentReference = "", note = "" }) {
  await delay(700);
  const { db, user } = context();
  requirePermission(user, P.LEAD_FINALIZE);
  const lead = loadLead(db, user, id);
  if (lead.status !== "proforma_invoice") throw new AppError("Only leads at Proforma invoice can be finalized.", "INVALID_TRANSITION");
  const reqError = getRequirementError(lead, "finalized");
  if (reqError) throw new AppError(reqError, "REQUIREMENT");

  const outlet = findOutlet(db, lead.outletId);
  const totals = calcTotals(lead.invoice);
  lead.booking = {
    confirmationNumber: `BK-${outlet.code}-${db.counters.booking++}`,
    totalAmount: totals.total,
    advancePaid: Number(advancePaid) || 0,
    paymentReference,
    finalizedAt: nowIso(),
    finalizedById: user.id,
    notifications: {
      whatsapp: { status: "pending", to: lead.customer.mobile, at: null },
      email: { status: "pending", to: lead.customer.email, at: null },
    },
  };
  lead.status = "finalized";
  lead.nextFollowUpAt = null;
  addActivity(lead, "finalized", `Booking finalized. Confirmation ${lead.booking.confirmationNumber}${note ? `. ${note}` : ""}`, user.id);
  return commit(db, lead);
}

/** GET /leads/:id/confirmation — approved template filled with booking details */
export async function getConfirmationPreview(id) {
  await delay();
  const { db, user } = context();
  const lead = loadLead(db, user, id);
  if (!lead.booking) throw new AppError("Finalize the booking first.", "REQUIREMENT");
  const template = getTemplate(lead.brandId, "bookingConfirmation");
  if (!template) throw new AppError("No approved confirmation template is set up for this brand.", "NO_TEMPLATE", 422);
  return {
    template: { id: template.id, version: template.version, approvedOn: template.approvedOn },
    ...renderConfirmation(expandLead(db, lead), template),
  };
}

/** POST /leads/:id/confirmation — send the approved template on WhatsApp + email */
export async function sendConfirmation(id) {
  const { db, user } = context();
  const lead = loadLead(db, user, id);
  if (!lead.booking) throw new AppError("Finalize the booking first.", "REQUIREMENT");
  if (!getTemplate(lead.brandId, "bookingConfirmation")) {
    throw new AppError("No approved confirmation template is set up for this brand.", "NO_TEMPLATE");
  }

  const result = await deliverBookingConfirmation(lead);
  lead.booking.notifications = result;
  addActivity(lead, "confirmation_sent", "Booking confirmation sent on WhatsApp and email", null);
  const { email } = renderConfirmation(expandLead(db, lead), getTemplate(lead.brandId, "bookingConfirmation"));
  logOutgoingEmail(db, lead, {
    subject: email.subject,
    body: [email.intro, "", ...email.rows.map(([k, v]) => `${k}: ${v}`), "", email.closing].join("\n"),
  });
  return commit(db, lead);
}

/** Prototype helper: restore the original demo data. */
export async function resetDemoData() {
  await delay(400);
  resetDb();
}

/* =====================================================================
   Helpers
   ===================================================================== */

function assertEditable(lead) {
  if (getStatus(lead.status).terminal) {
    throw new AppError("This booking is finalized and can no longer be changed.", "LOCKED");
  }
}

function validateLeadInput(input) {
  const errors = [];
  if (!getLeadType(input.type)?.label || !input.type) errors.push("lead type");
  if (!input.customer?.name?.trim()) errors.push("customer name");
  if (String(input.customer?.mobile || "").replace(/\D/g, "").length < 10) errors.push("10-digit mobile number");
  if (!/^\S+@\S+\.\S+$/.test(input.customer?.email || "")) errors.push("valid email");
  if (!input.event?.date) errors.push("event date");
  if (!(Number(input.event?.guests) > 0)) errors.push("number of guests");
  if (leadTypeNeeds(input.type, "company") && !input.company?.name?.trim()) errors.push("company name");
  if (errors.length) throw new AppError(`Please add: ${errors.join(", ")}.`, "VALIDATION");
}

function normaliseEvent(event, type) {
  const isBirthday = leadTypeNeeds(type, "celebrant");
  const date = new Date(event.date);
  date.setHours(12, 0, 0, 0);
  return {
    date: date.toISOString(),
    timeSlot: event.timeSlot || "evening",
    guests: Number(event.guests) || 0,
    kids: Number(event.kids) || 0,
    celebrantName: isBirthday ? event.celebrantName || "" : "",
    celebrantAge: isBirthday && event.celebrantAge ? Number(event.celebrantAge) : null,
    requirements: event.requirements || [],
    remarks: event.remarks || "",
  };
}


