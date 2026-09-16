import Link from "next/link";
import { CalendarDays, Users } from "lucide-react";
import { getLeadType } from "@/config/leadOptions";
import { formatDate, formatRelative } from "@/lib/format";
import { isFollowUpOverdue } from "@/lib/leadWorkflow";
import LeadStatusBadge from "./LeadStatusBadge";

/** Mobile list item for a lead. */
export default function LeadCard({ lead }) {
  const overdue = isFollowUpOverdue(lead);
  return (
    <Link href={`/leads/${lead.id}`} className="block px-4 py-3.5 active:bg-subtle">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-[15px] font-medium text-ink">{lead.customer.name}</p>
          <p className="meta mt-0.5 flex flex-wrap gap-x-3">
            <span>{lead.id}</span>
            <span>{getLeadType(lead.type).label}</span>
          </p>
        </div>
        <LeadStatusBadge status={lead.status} />
      </div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-body">
        <span className="inline-flex items-center gap-1.5">
          <CalendarDays size={14} className="text-muted" />
          {formatDate(lead.event.date)}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Users size={14} className="text-muted" />
          {lead.event.guests} guests
        </span>
        <span className="text-muted">{lead.outlet.name}</span>
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 text-xs">
        <span className="truncate text-muted">{lead.assignee?.name || "Unassigned"}</span>
        {overdue ? (
          <span className="font-medium text-danger">Follow-up overdue</span>
        ) : (
          <span className="text-faint">Received {formatRelative(lead.createdAt)}</span>
        )}
      </div>
    </Link>
  );
}
