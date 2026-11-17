import Link from "next/link";
import { formatRelative } from "@/lib/format";
import { Badge, Button, EmptyState, Panel } from "@/components/ui";

const TONE = {
  new: "blue", assigned: "violet", in_progress: "amber", quotation: "violet",
  proforma_invoice: "teal", finalized: "green", not_interested: "gray", cancelled: "red",
};

/** leads: the API's recent list; statusLabel turns a status key into its label. */
export default function RecentLeads({ leads, statusLabel }) {
  return (
    <Panel title="Recent leads" actions={<Button size="sm" variant="ghost" href="/leads">View all</Button>} bodyClassName="p-0">
      {leads.length === 0 ? (
        <EmptyState title="No leads yet" description="New website enquiries for your outlets will show up here." />
      ) : (
        <ul className="divide-y divide-line">
          {leads.map((l) => (
            <li key={l.id}>
              <Link
                href={`/leads/${l.id}`}
                className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3 hover:bg-subtle sm:grid-cols-[1.4fr_1fr_130px_100px]"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium text-ink">{l.name}</span>
                  <span className="meta">{l.leadCode}</span>
                </span>
                <span className="hidden min-w-0 text-[13px] text-body sm:block">
                  <span className="block truncate">{l.leadTypeLabel}</span>
                  <span className="meta block truncate">{l.locationName}, {l.assignedToName || "Unassigned"}</span>
                </span>
                <span className="justify-self-end sm:justify-self-start">
                  <Badge tone={TONE[l.status] || "gray"} dot>{statusLabel(l.status)}</Badge>
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