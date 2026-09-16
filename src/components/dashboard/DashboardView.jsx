"use client";

import { Plus } from "lucide-react";
import { P } from "@/config/permissions";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@/hooks/useQuery";
import { leadService } from "@/services";
import { Button, ErrorState, PageHeader, Panel, Skeleton } from "@/components/ui";
import AttentionList from "./AttentionList";
import BreakdownBars from "./BreakdownBars";
import FollowUpList from "./FollowUpList";
import PipelineStrip from "./PipelineStrip";
import RecentLeads from "./RecentLeads";

export default function DashboardView() {
  const { user, can } = useAuth();
  const { data, loading, error, reload } = useQuery(() => leadService.getDashboard(), [user.id]);

  const scope = can(P.LEAD_VIEW_ALL) ? "All outlets" : can(P.LEAD_VIEW_OUTLET) ? "Your outlets" : "Your leads";

  return (
    <div className="page">
      <PageHeader
        title="Dashboard"
        description={
          data
            ? `${scope}. ${data.today} received today, ${data.thisWeek} this week, ${data.conversionRate}% of closed leads converted.`
            : `${scope}.`
        }
        actions={
          can(P.LEAD_CREATE) && (
            <Button variant="primary" icon={Plus} href="/leads/new">
              New lead
            </Button>
          )
        }
      />

      {error ? (
        <div className="panel"><ErrorState error={error} onRetry={reload} /></div>
      ) : loading && !data ? (
        <DashboardSkeleton />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          <PipelineStrip total={data.total} byStatus={data.byStatus} />

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
            <AttentionList items={data.attention} />
            <RecentLeads leads={data.recent} />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel
              title="Follow-ups due"
              description="Overdue, today and tomorrow"
              actions={<Button size="sm" variant="ghost" href="/follow-ups">View all</Button>}
              bodyClassName="p-0"
            >
              <FollowUpList leads={data.pendingFollowUps} showOwner={!user.receivesLeads} emptyText="No follow-ups due today or tomorrow" />
            </Panel>
            <div className="grid min-w-0 grid-cols-1 content-start gap-4">
              {data.byOutlet.length > 1 && (
                <BreakdownBars title="Leads by outlet" rows={data.byOutlet} hrefFor={(r) => `/leads?outletId=${r.key}`} />
              )}
              <BreakdownBars title="Leads by type" rows={data.byType} hrefFor={(r) => `/leads?type=${r.key}`} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4">
      <Skeleton className="h-[88px]" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}
