/**
 * Lead status workflow — the single source of truth for statuses.
 *
 * To add a status: add an object here. Badges, filters, the dashboard
 * pipeline and the stage rail all read from this list.
 *
 *  key          stored value (matches DB enum later)
 *  label        shown in the UI
 *  tone         colour — see .tone-* classes in globals.css
 *  onPath       true = part of the main pipeline shown on the stage rail
 *  terminal     true = lead is closed, no further changes
 *  next         statuses a user may move to from this one
 *  requires     "quotation" | "invoice" — must exist before entering
 *  permission   extra permission needed to enter this status
 *  confirm      ask for confirmation before entering
 *  needsReason  ask for a reason before entering
 *  nextAction   the primary button shown on a lead in this status
 */
export const LEAD_STATUSES = [
  {
    key: "new",
    label: "New",
    tone: "blue",
    onPath: true,
    hint: "Not contacted yet",
    next: ["in_progress", "not_interested"],
    nextAction: "followup",
  },
  {
    key: "in_progress",
    label: "In progress",
    tone: "amber",
    onPath: true,
    hint: "In discussion with customer",
    next: ["quotation", "not_interested"],
    nextAction: "quotation",
  },
  {
    key: "quotation",
    label: "Quotation",
    tone: "violet",
    onPath: true,
    hint: "Quotation shared",
    next: ["proforma_invoice", "in_progress", "not_interested"],
    requires: "quotation",
    nextAction: "invoice",
  },
  {
    key: "proforma_invoice",
    label: "Proforma invoice",
    tone: "teal",
    onPath: true,
    hint: "Awaiting payment / confirmation",
    next: ["finalized", "quotation", "not_interested"],
    requires: "invoice",
    nextAction: "finalize",
  },
  {
    key: "finalized",
    label: "Finalized",
    tone: "green",
    onPath: true,
    terminal: true,
    hint: "Booking confirmed",
    next: [],
    requires: "invoice",
    permission: "lead.finalize",
    confirm: true,
    nextAction: "confirmation",
  },
  {
    key: "not_interested",
    label: "Not interested",
    tone: "gray",
    onPath: false,
    hint: "Closed without booking",
    next: ["in_progress"],
    confirm: true,
    needsReason: true,
    nextAction: "reopen",
  },
];

export const STATUS_KEYS = Object.fromEntries(LEAD_STATUSES.map((s) => [s.key, s.key]));

export function getStatus(key) {
  return LEAD_STATUSES.find((s) => s.key === key) || { key, label: key, tone: "gray", next: [] };
}

export const PIPELINE_STATUSES = LEAD_STATUSES.filter((s) => s.onPath);

export const NOT_INTERESTED_REASONS = [
  "Budget too high",
  "Date not available",
  "Chose another venue",
  "Event cancelled",
  "No response from customer",
  "Other",
];
