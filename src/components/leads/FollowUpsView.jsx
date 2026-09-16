"use client";

import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@/hooks/useQuery";
import { addDays, endOfDay, formatWeekday, startOfDay } from "@/lib/format";
import { leadService } from "@/services";
import { ErrorState, PageHeader, Panel, Skeleton } from "@/components/ui";
import FollowUpList from "@/components/dashboard/FollowUpList";

/** Scheduled follow-ups grouped into Overdue / Today / Tomorrow / Later. */
export default function FollowUpsView() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useQuery(() => leadService.listFollowUps(), [user.id]);

  const groups = (() => {
    if (!data) return [];
    const now = Date.now();
    const t = (l) => new Date(l.nextFollowUpAt).getTime();
    const todayEnd = endOfDay(now);
    const tomorrowEnd = endOfDay(addDays(now, 1));
    return [
      { key: "overdue", title: "Overdue", items: data.filter((l) => t(l) < now) },
      { key: "today", title: `Today, ${formatWeekday(now)}`, items: data.filter((l) => t(l) >= now && t(l) <= todayEnd) },
      { key: "tomorrow", title: "Tomorrow", items: data.filter((l) => t(l) > todayEnd && t(l) <= tomorrowEnd) },
      { key: "later", title: "Later", items: data.filter((l) => t(l) > tomorrowEnd && t(l) >= startOfDay(addDays(now, 2))) },
    ];
  })();

  return (
    <div className="page max-w-4xl">
      <PageHeader
        title="Follow-ups"
        description={data ? `${data.length} scheduled, ${groups[0]?.items.length || 0} overdue` : "\u00a0"}
      />
      {error ? (
        <div className="panel"><ErrorState error={error} onRetry={reload} /></div>
      ) : loading && !data ? (
        <div className="grid grid-cols-1 gap-4"><Skeleton className="h-40" /><Skeleton className="h-40" /></div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {groups.map((g) => (
            <Panel key={g.key} title={`${g.title} (${g.items.length})`} bodyClassName="p-0">
              <FollowUpList leads={g.items} showOwner={!user.receivesLeads} emptyText={g.key === "overdue" ? "Nothing overdue" : "Nothing scheduled"} />
            </Panel>
          ))}
        </div>
      )}
    </div>
  );
}
