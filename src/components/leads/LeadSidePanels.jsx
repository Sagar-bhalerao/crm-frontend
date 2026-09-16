import { CalendarClock, MapPin } from "lucide-react";
import { P } from "@/config/permissions";
import { getChannel } from "@/config/leadOptions";
import { formatDateTime, formatPhone, formatRelative } from "@/lib/format";
import { isFollowUpOverdue, isOpenLead } from "@/lib/leadWorkflow";
import { Avatar, Button } from "@/components/ui";

/** Who owns the lead. */
export function OwnerPanel({ lead, can, onReassign }) {
  return (
    <section className="panel">
      <div className="panel-header py-2.5">
        <h2 className="section-title">Sales POC</h2>
        {can(P.LEAD_ASSIGN) && isOpenLead(lead) && (
          <Button size="sm" variant="ghost" onClick={onReassign}>
            {lead.assignee ? "Reassign" : "Assign"}
          </Button>
        )}
      </div>
      <div className="panel-body">
        {lead.assignee ? (
          <div className="flex items-center gap-3">
            <Avatar name={lead.assignee.name} size="md" />
            <div className="min-w-0">
              <p className="text-sm font-medium text-ink">{lead.assignee.name}</p>
              <p className="meta truncate">{lead.assignee.mailbox?.address || lead.assignee.email}</p>
              <p className="meta">{formatPhone(lead.assignee.phone)}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-danger">Not assigned to anyone</p>
        )}
        <p className="mt-3 flex items-center gap-1.5 text-[13px] text-body">
          <MapPin size={14} className="text-muted" /> {lead.brand.shortName || lead.brand.name}, {lead.outlet.name}
        </p>
      </div>
    </section>
  );
}

/** Next and last follow-up. */
export function FollowUpPanel({ lead, can, onLog }) {
  const overdue = isFollowUpOverdue(lead);
  const last = lead.followUps[0];
  const open = isOpenLead(lead);

  return (
    <section className="panel">
      <div className="panel-header py-2.5">
        <h2 className="section-title">Follow-up</h2>
        {can(P.FOLLOWUP_CREATE) && open && (
          <Button size="sm" variant="ghost" onClick={onLog}>Log follow-up</Button>
        )}
      </div>
      <div className="panel-body grid gap-3">
        <div className="flex items-start gap-2.5">
          <CalendarClock size={16} className={overdue ? "mt-0.5 text-danger" : "mt-0.5 text-muted"} />
          <div>
            <p className="meta">Next follow-up</p>
            {lead.nextFollowUpAt && open ? (
              <p className={overdue ? "text-sm font-medium text-danger" : "text-sm text-ink"}>
                {formatDateTime(lead.nextFollowUpAt)}
                <span className="block text-xs font-normal">{overdue ? `Overdue, due ${formatRelative(lead.nextFollowUpAt)}` : formatRelative(lead.nextFollowUpAt)}</span>
              </p>
            ) : (
              <p className="text-sm text-muted">{open ? "Not scheduled" : "Lead is closed"}</p>
            )}
          </div>
        </div>
        <div className="border-t border-line pt-3">
          <p className="meta">Last contact</p>
          {last ? (
            <>
              <p className="text-sm text-ink">{getChannel(last.channel)}: {last.outcome}</p>
              {last.note && <p className="mt-0.5 text-[13px] text-body">{last.note}</p>}
              <p className="meta mt-0.5">{formatRelative(last.at)} by {lead.people[last.byId]}</p>
            </>
          ) : (
            <p className="text-sm text-muted">Customer not contacted yet</p>
          )}
        </div>
      </div>
    </section>
  );
}
