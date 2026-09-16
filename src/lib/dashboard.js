import { LEAD_STATUSES } from "@/config/leadStatuses";
import { LEAD_TYPES } from "@/config/leadOptions";
import { addDays, endOfDay, startOfDay, startOfWeek } from "./format";
import { isFollowUpOverdue, isOpenLead } from "./leadWorkflow";
import { getRuntimeSettings } from "./runtimeSettings";

const HOUR = 60 * 60 * 1000;

/**
 * Dashboard numbers for a set of (already permission-filtered) leads.
 * The API will expose this as GET /dashboard.
 */
export function buildDashboard(leads, { outlets, now = Date.now() }) {
  const todayStart = startOfDay(now);
  const weekStart = startOfWeek(now);
  const time = (v) => new Date(v).getTime();

  const byStatus = Object.fromEntries(LEAD_STATUSES.map((s) => [s.key, 0]));
  leads.forEach((l) => (byStatus[l.status] = (byStatus[l.status] || 0) + 1));

  const closed = byStatus.finalized + byStatus.not_interested;
  const conversionRate = closed ? Math.round((byStatus.finalized / closed) * 100) : 0;

  const byOutlet = outlets
    .map((o) => ({ key: o.id, label: o.name, value: leads.filter((l) => l.outletId === o.id).length }))
    .filter((r) => r.value > 0 || outlets.length <= 6);

  const byType = LEAD_TYPES.map((t) => ({
    key: t.key,
    label: t.label,
    value: leads.filter((l) => l.type === t.key).length,
  }));

  const recent = [...leads].sort((a, b) => time(b.createdAt) - time(a.createdAt)).slice(0, 6);

  const tomorrowEnd = endOfDay(addDays(now, 1));
  const pendingFollowUps = leads
    .filter((l) => isOpenLead(l) && l.nextFollowUpAt && time(l.nextFollowUpAt) <= tomorrowEnd)
    .sort((a, b) => time(a.nextFollowUpAt) - time(b.nextFollowUpAt))
    .slice(0, 6);

  // What needs attention right now
  // "First response target" in Configuration
  const responseHours = getRuntimeSettings().leadResponseHours;
  const uncontacted = leads.filter((l) => l.status === "new" && now - time(l.createdAt) > responseHours * HOUR);
  const overdue = leads.filter((l) => isFollowUpOverdue(l, now));
  const staleQuotes = leads.filter(
    (l) => l.status === "quotation" && l.quotation?.sharedAt && now - time(l.quotation.sharedAt) > 72 * HOUR
  );
  const upcomingEvents = leads.filter(
    (l) =>
      ["quotation", "proforma_invoice"].includes(l.status) &&
      time(l.event.date) >= todayStart &&
      time(l.event.date) <= endOfDay(addDays(now, 7))
  );

  return {
    total: leads.length,
    today: leads.filter((l) => time(l.createdAt) >= todayStart).length,
    thisWeek: leads.filter((l) => time(l.createdAt) >= weekStart).length,
    open: leads.filter(isOpenLead).length,
    conversionRate,
    byStatus,
    byOutlet,
    byType,
    recent,
    pendingFollowUps,
    attention: [
      { key: "uncontacted", label: `New leads not contacted for over ${responseHours} hour${responseHours === 1 ? "" : "s"}`, count: uncontacted.length, href: "/leads?status=new&sort=createdAt:asc", tone: "blue" },
      { key: "overdue", label: "Follow-ups overdue", count: overdue.length, href: "/follow-ups", tone: "red" },
      { key: "stale_quotes", label: "Quotations without a reply for 3+ days", count: staleQuotes.length, href: "/leads?status=quotation", tone: "violet" },
      { key: "upcoming", label: "Unconfirmed events in the next 7 days", count: upcomingEvents.length, href: "/leads?sort=eventDate:asc&status=proforma_invoice", tone: "amber" },
    ],
  };
}
