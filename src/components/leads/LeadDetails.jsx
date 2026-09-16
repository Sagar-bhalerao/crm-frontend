import { getLeadSource, getLeadType, getTimeSlot } from "@/config/leadOptions";
import { formatDateTime, formatPhone, formatWeekday } from "@/lib/format";
import LeadStatusBadge from "./LeadStatusBadge";

/** Read-only information sections for the lead Details tab. */
export default function LeadDetails({ lead }) {
  const type = getLeadType(lead.type);
  const e = lead.event;

  return (
    <div className="grid gap-6">
      <Section title="Customer">
        <Item label="Name">{lead.customer.name}</Item>
        <Item label="Mobile">
          <a className="link" href={`tel:+91${lead.customer.mobile}`}>{formatPhone(lead.customer.mobile)}</a>
        </Item>
        <Item label="Email">
          <a className="link break-all" href={`mailto:${lead.customer.email}`}>{lead.customer.email}</a>
        </Item>
      </Section>

      {lead.company && (
        <Section title="Company">
          <Item label="Company name">{lead.company.name}</Item>
          <Item label="GSTIN">{lead.company.gstin || "Not provided"}</Item>
          <Item label="Contact">
            {lead.company.contactPerson || lead.customer.name}
            {lead.company.designation ? `, ${lead.company.designation}` : ""}
          </Item>
        </Section>
      )}

      <Section title="Event">
        <Item label="Lead type">{type.label}</Item>
        <Item label="Preferred outlet">{lead.outlet.name}</Item>
        <Item label="Event date">{formatWeekday(e.date)}</Item>
        <Item label="Preferred time">{getTimeSlot(e.timeSlot)}</Item>
        <Item label="Guests">
          {e.guests}
          {e.kids ? ` (${e.kids} kids)` : ""}
        </Item>
        {e.celebrantName && (
          <Item label="Birthday of">
            {e.celebrantName}
            {e.celebrantAge ? `, turning ${e.celebrantAge}` : ""}
          </Item>
        )}
        <Item label="Requirements" wide>
          {e.requirements.length ? (
            <span className="flex flex-wrap gap-1.5 pt-0.5">
              {e.requirements.map((r) => (
                <span key={r} className="rounded bg-subtle border border-line px-2 py-0.5 text-xs text-body">{r}</span>
              ))}
            </span>
          ) : (
            "None mentioned"
          )}
        </Item>
        <Item label="Remarks" wide>{e.remarks || "None"}</Item>
      </Section>

      <Section title="Lead">
        <Item label="Lead ID">{lead.id}</Item>
        <Item label="Source">{getLeadSource(lead.source).label}</Item>
        <Item label="Created">{formatDateTime(lead.createdAt)}</Item>
        <Item label="Assigned Sales POC">{lead.assignee?.name || "Unassigned"}</Item>
        <Item label="Current status"><LeadStatusBadge status={lead.status} /></Item>
        <Item label="Last updated">{formatDateTime(lead.updatedAt)}</Item>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section>
      <h3 className="mb-3 text-[13px] font-semibold text-ink">{title}</h3>
      <dl className="dl">{children}</dl>
    </section>
  );
}

function Item({ label, wide, children }) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
