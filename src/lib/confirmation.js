import { getLeadType, getTimeSlot } from "@/config/leadOptions";
import { calcTotals } from "./quotation";
import { formatCurrency, formatLongDate, formatPhone } from "./format";
import { fillTemplate } from "./template";

/** Data object exposed to confirmation templates as {{placeholders}}. */
export function buildTemplateData(lead) {
  const totals = lead.booking
    ? { total: lead.booking.totalAmount, advance: lead.booking.advancePaid }
    : calcTotals(lead.invoice || lead.quotation || {});
  return {
    customer: lead.customer,
    company: lead.company || {},
    outlet: lead.outlet,
    brand: lead.brand,
    assignee: {
      name: lead.assignee?.name,
      phoneLabel: formatPhone(lead.assignee?.phone),
      emailLabel: lead.assignee?.mailbox?.address || lead.assignee?.email,
    },
    event: {
      ...lead.event,
      typeLabel: getLeadType(lead.type).label,
      typeLabelLower: getLeadType(lead.type).label.toLowerCase(),
      dateLabel: formatLongDate(lead.event.date),
      timeSlotLabel: getTimeSlot(lead.event.timeSlot),
    },
    booking: {
      ...(lead.booking || {}),
      totalLabel: formatCurrency(totals.total),
      advanceLabel: formatCurrency(totals.advance),
      balanceLabel: formatCurrency((totals.total || 0) - (totals.advance || 0)),
    },
  };
}

/** Render the approved template for a lead. Rows with no value are dropped. */
export function renderConfirmation(lead, template) {
  const data = buildTemplateData(lead);
  const fill = (s) => fillTemplate(s, data);
  return {
    whatsapp: fill(template.whatsapp),
    email: {
      subject: fill(template.email.subject),
      heading: fill(template.email.heading),
      intro: fill(template.email.intro),
      rows: template.email.rows.map(([k, v]) => [k, fill(v)]).filter(([, v]) => v !== "—"),
      closing: fill(template.email.closing),
      footer: fill(template.email.footer),
    },
  };
}
