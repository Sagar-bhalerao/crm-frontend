"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { P } from "@/config/permissions";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@/hooks/useQuery";
import { formatCompactCurrency, formatNumber } from "@/lib/format";
import { leadService } from "@/services/admin";
import { Button, EmptyState, ErrorState, PageHeader, Panel, Skeleton } from "@/components/ui";
import { FollowupRow } from "@/components/leads/FollowUpsView";
import AttentionList from "./AttentionList";
import BreakdownBars from "./BreakdownBars";
import PipelineStrip from "./PipelineStrip";
import RecentLeads from "./RecentLeads";

const plural = (n, word) => `${formatNumber(n)} ${word}${n === 1 ? "" : "s"}`;

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
            ? `${scope}. ${data.today} received today, ${data.thisWeek} this week, ${data.thisMonth} this month. ${data.conversionRate}% of closed leads converted.`
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
        <Dashboard data={data} canAssign={can(P.LEAD_ASSIGN)} canSeeInvoices={can(P.INVOICE_VIEW)} />
      )}
    </div>
  );
}

function Dashboard({ data, canAssign, canSeeInvoices }) {
  const statusLabel = (key) => data.byStatus.find((s) => s.key === key)?.label || key;
  const a = data.attention;
  const now = Date.now();

  const attention = [
    { key: "uncontacted", label: "New leads not contacted for over 2 hours", count: a.uncontacted, href: "/leads?status=new", tone: "blue" },
    canAssign && { key: "unassigned", label: "Open leads not assigned to anyone", count: a.unassigned, href: "/leads?assigned=unassigned", tone: "amber" },
    { key: "overdue", label: "Follow-ups overdue", count: a.overdueFollowups, href: "/follow-ups", tone: "red" },
    { key: "stale", label: "Quotations shared 3+ days ago with no decision", count: a.staleQuotes, href: "/leads?status=quotation", tone: "violet" },
    canSeeInvoices && { key: "advance", label: "Proforma invoices awaiting advance", count: a.awaitingAdvance, href: "/invoices?status=sent", tone: "teal" },
    { key: "upcoming", label: "Unconfirmed events in the next 7 days", count: a.upcomingUnconfirmed, href: "/leads?status=proforma_invoice", tone: "amber" },
  ].filter(Boolean);

  return (
    <div className="grid grid-cols-1 gap-4">
      <PipelineStrip total={data.total} byStatus={data.byStatus} />

      <SalesStrip sales={data.sales} />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)]">
        <AttentionList items={attention} />
        <RecentLeads leads={data.recent} statusLabel={statusLabel} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel
          title="Follow-ups due"
          description="Overdue, today and tomorrow"
          actions={<Button size="sm" variant="ghost" href="/follow-ups">View all</Button>}
          bodyClassName="p-0"
        >
          {data.followupsDue.length === 0 ? (
            <EmptyState title="No follow-ups due today or tomorrow" className="py-8" />
          ) : (
            <ul className="divide-y divide-line">
              {data.followupsDue.map((l) => (
                <FollowupRow
                  key={l.id}
                  lead={l}
                  overdue={new Date(l.nextFollowupAt).getTime() < now}
                  showOwner={canAssign}
                />
              ))}
            </ul>
          )}
        </Panel>

        <div className="grid min-w-0 grid-cols-1 content-start gap-4">
          {data.byLocation.length > 1 && (
            <BreakdownBars title="Leads by location" rows={data.byLocation} hrefFor={(r) => `/leads?locationId=${r.key}`} />
          )}
          <BreakdownBars title="Leads by type" rows={data.byType} hrefFor={(r) => `/leads?leadType=${r.key}`} />
        </div>
      </div>
    </div>
  );
}

/**
 * Money, in the order a booking earns it: what is being negotiated, what is
 * confirmed, what has come in, and what is still to collect at the venue.
 */
function SalesStrip({ sales }) {
  const cards = [
    {
      key: "estimated",
      label: "Estimated sales",
      value: sales.estimated,
      note: `Quotation ${formatCompactCurrency(sales.quotationValue)} · PI ${formatCompactCurrency(sales.invoiceValue)}`,
      href: "/quotations",
    },
    { key: "booked", label: "Confirmed bookings", value: sales.booked, note: plural(sales.bookings, "booking"), href: "/leads?status=finalized" },
    { key: "advance", label: "Advance collected", value: sales.advanceCollected, note: `On ${plural(sales.paidInvoices, "invoice")}`, href: "/invoices?status=paid" },
    { key: "balance", label: "Balance due at venue", value: sales.balanceUpcoming, note: "For upcoming confirmed events", href: "/leads?status=finalized" },
  ];

  return (
    <section className="panel overflow-hidden" aria-label="Sales">
      <div className="grid grid-cols-1 gap-px bg-line sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Link key={c.key} href={c.href} className="group block bg-surface px-4 py-3.5 transition-colors hover:bg-subtle">
            <span className="block text-[13px] text-muted group-hover:text-ink">{c.label}</span>
            {/* Compact on the card, exact on hover */}
            <span className="mt-1 block text-2xl font-semibold tracking-tight text-ink" title={`₹${Number(c.value).toLocaleString("en-IN")}`}>
              {formatCompactCurrency(c.value)}
            </span>
            <span className="meta block">{c.note}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

function DashboardSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4">
      <Skeleton className="h-[104px]" />
      <Skeleton className="h-[92px]" />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_1.6fr]">
        <Skeleton className="h-64" />
        <Skeleton className="h-64" />
      </div>
    </div>
  );
}