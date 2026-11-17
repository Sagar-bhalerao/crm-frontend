"use client";

import Link from "next/link";
import { CalendarCheck } from "lucide-react";
import { P } from "@/config/permissions";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@/hooks/useQuery";
import { addDays, endOfDay, formatRelative, formatShortDate, formatTime, formatWeekday, isSameDay } from "@/lib/format";
import { cx } from "@/lib/utils";
import { leadService } from "@/services/admin";
import { Badge, EmptyState, ErrorState, PageHeader, Panel, Skeleton } from "@/components/ui";

const STATUS_TONE = {
  new: "blue", assigned: "violet", in_progress: "amber", quotation: "violet", proforma_invoice: "teal",
};

const label = (v) => String(v || "").replace(/_/g, " ");

/** Open leads with a follow-up scheduled, grouped into Overdue / Today / Tomorrow / Later. */
export default function FollowUpsView() {
  const { user, can } = useAuth();
  const { data, loading, error, reload } = useQuery(() => leadService.listFollowups(), [user.id]);

  // A POC only sees their own leads, so the owner's name would just be noise
  const showOwner = can(P.LEAD_VIEW_OUTLET) || can(P.LEAD_VIEW_ALL);

  const groups = (() => {
    if (!data) return [];
    const now = Date.now();
    const todayEnd = endOfDay(now);
    const tomorrowEnd = endOfDay(addDays(now, 1));
    const at = (l) => new Date(l.nextFollowupAt).getTime();
    return [
      { key: "overdue", title: "Overdue", items: data.filter((l) => at(l) < now) },
      { key: "today", title: `Today, ${formatWeekday(now)}`, items: data.filter((l) => at(l) >= now && at(l) <= todayEnd) },
      { key: "tomorrow", title: "Tomorrow", items: data.filter((l) => at(l) > todayEnd && at(l) <= tomorrowEnd) },
      { key: "later", title: "Later", items: data.filter((l) => at(l) > tomorrowEnd) },
    ];
  })();

  const overdue = groups[0]?.items.length || 0;

  return (
    <div className="page max-w-4xl">
      <PageHeader
        title="Follow-ups"
        description={data ? `${data.length} scheduled${overdue ? `, ${overdue} overdue` : ""}` : "\u00a0"}
      />
      {error ? (
        <div className="panel"><ErrorState error={error} onRetry={reload} /></div>
      ) : loading && !data ? (
        <div className="grid gap-4"><Skeleton className="h-40" /><Skeleton className="h-40" /></div>
      ) : (
        <div className="grid gap-4">
          {groups.map((g) => (
            <Panel key={g.key} title={`${g.title} (${g.items.length})`} bodyClassName="p-0">
              {g.items.length === 0 ? (
                <EmptyState
                  icon={CalendarCheck}
                  title={g.key === "overdue" ? "Nothing overdue" : "Nothing scheduled"}
                  className="py-6"
                />
              ) : (
                <ul className="divide-y divide-line">
                  {g.items.map((l) => (
                    <FollowupRow key={l.id} lead={l} overdue={g.key === "overdue"} showOwner={showOwner} />
                  ))}
                </ul>
              )}
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}

export function FollowupRow({ lead, overdue, showOwner }) {
  const last = lead.lastFollowup;
  return (
    <li>
      <Link href={`/leads/${lead.id}`} className="flex items-start gap-3 px-4 py-3 hover:bg-subtle">
        <span className={cx("w-16 shrink-0 pt-0.5 text-[13px] font-medium leading-tight", overdue ? "text-danger" : "text-ink")}>
          {isSameDay(lead.nextFollowupAt, Date.now()) ? "Today" : formatShortDate(lead.nextFollowupAt)}
          <span className="block text-xs font-normal">{formatTime(lead.nextFollowupAt)}</span>
        </span>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="truncate text-sm font-medium text-ink">{lead.name}</span>
            <Badge tone={STATUS_TONE[lead.status] || "gray"} dot className="capitalize">{label(lead.status)}</Badge>
          </span>
          <span className="meta block truncate">
            {lead.leadCode} · {lead.locationName}
            {showOwner ? ` · ${lead.assignedToName || "Unassigned"}` : ""}
          </span>
          <span className="meta block truncate first-letter:uppercase">
            {last
              ? `Last: ${label(last.channel)}, ${label(last.outcome)}${last.note ? ` — ${last.note}` : ""}`
              : "Not contacted yet"}
          </span>
        </span>

        <span className={cx("shrink-0 text-xs", overdue ? "font-medium text-danger" : "text-muted")}>
          {overdue ? "Overdue" : formatRelative(lead.nextFollowupAt)}
        </span>
      </Link>
    </li>
  );
}