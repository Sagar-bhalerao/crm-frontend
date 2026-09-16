import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { getChannel } from "@/config/leadOptions";
import { formatRelative, formatShortDate, formatTime, isSameDay } from "@/lib/format";
import { isFollowUpOverdue } from "@/lib/leadWorkflow";
import { cx } from "@/lib/utils";
import { EmptyState } from "@/components/ui";
import LeadStatusBadge from "@/components/leads/LeadStatusBadge";

/** Leads with a scheduled follow-up. Used on the dashboard and Follow-ups page. */
export default function FollowUpList({ leads, showOwner = true, emptyText = "No follow-ups due." }) {
  if (leads.length === 0) return <EmptyState icon={CalendarCheck} title={emptyText} description="Schedule the next follow-up whenever you log a call." />;

  return (
    <ul className="divide-y divide-line">
      {leads.map((l) => {
        const overdue = isFollowUpOverdue(l);
        const last = l.followUps[0];
        return (
          <li key={l.id}>
            <Link href={`/leads/${l.id}`} className="flex items-start gap-3 px-4 py-3 hover:bg-subtle">
              <span className={cx("w-16 shrink-0 pt-0.5 text-[13px] font-medium leading-tight", overdue ? "text-danger" : "text-ink")}>
                {isSameDay(l.nextFollowUpAt, Date.now()) ? "Today" : formatShortDate(l.nextFollowUpAt)}
                <span className="block text-xs font-normal">{formatTime(l.nextFollowUpAt)}</span>
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                  <span className="truncate text-sm font-medium text-ink">{l.customer.name}</span>
                  <LeadStatusBadge status={l.status} />
                </span>
                <span className="meta block truncate">
                  {last ? `Last: ${getChannel(last.channel)}, ${last.outcome}` : "Not contacted yet"}
                  {showOwner && l.assignee ? ` (${l.assignee.name})` : ""}
                </span>
              </span>
              <span className={cx("shrink-0 text-xs", overdue ? "font-medium text-danger" : "text-muted")}>
                {overdue ? "Overdue" : formatRelative(l.nextFollowUpAt)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
