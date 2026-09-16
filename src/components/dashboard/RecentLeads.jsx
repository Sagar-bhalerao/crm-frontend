import Link from "next/link";
import { getLeadType } from "@/config/leadOptions";
import { formatRelative } from "@/lib/format";
import { Button, EmptyState, Panel } from "@/components/ui";
import LeadStatusBadge from "@/components/leads/LeadStatusBadge";

export default function RecentLeads({ leads }) {
  return (
    <Panel title="Recent leads" actions={<Button size="sm" variant="ghost" href="/leads">View all</Button>} bodyClassName="p-0">
      {leads.length === 0 ? (
        <EmptyState title="No leads yet" description="New website enquiries for your outlets will show up here." />
      ) : (
        <ul className="divide-y divide-line">
          {leads.map((l) => (
            <li key={l.id}>
              <Link href={`/leads/${l.id}`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-subtle sm:grid-cols-[1.4fr_1fr_120px_110px]">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">{l.customer.name}</span>
                  <span className="meta">{l.id}</span>
                </span>
                <span className="hidden min-w-0 text-[13px] text-body sm:block">
                  <span className="block truncate">{getLeadType(l.type).label}</span>
                  <span className="meta block truncate">{l.outlet.name}, {l.assignee?.name || "Unassigned"}</span>
                </span>
                <span className="justify-self-end sm:justify-self-start">
                  <LeadStatusBadge status={l.status} />
                </span>
                <span className="meta col-span-2 sm:col-span-1 sm:text-right">{formatRelative(l.createdAt)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
