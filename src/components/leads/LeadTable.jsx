"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowDown, ArrowUp, ChevronsUpDown, Eye, Pencil } from "lucide-react";
import { getStatus } from "@/config/leadStatuses";
import { getLeadType } from "@/config/leadOptions";
import { formatDate, formatPhone, formatRelative } from "@/lib/format";
import { isFollowUpOverdue } from "@/lib/leadWorkflow";
import LeadStatusBadge from "./LeadStatusBadge";

const COLUMNS = [
  { key: "id", label: "Lead ID" },
  { key: "customer.name", label: "Customer", sortable: true },
  { key: "type", label: "Lead type" },
  { key: "outlet", label: "Outlet" },
  { key: "eventDate", label: "Event date", sortable: true },
  { key: "assignee", label: "Assigned to" },
  { key: "status", label: "Status" },
  { key: "createdAt", label: "Created", sortable: true },
  { key: "lastFollowUpAt", label: "Last follow-up", sortable: true },
  { key: "actions", label: "Actions" },
];

/** Desktop lead table. `sort` is "field:dir". */
export default function LeadTable({ leads, sort, onSort, canEdit = false }) {
  const router = useRouter();
  const [sortField, sortDir] = (sort || "").split(":");

  const toggleSort = (field) => {
    const dir = sortField === field && sortDir === "desc" ? "asc" : "desc";
    onSort(`${field}:${dir}`);
  };

  return (
    <div className="overflow-x-auto">
      <table className="table min-w-[1120px]">
        <thead>
          <tr>
            {COLUMNS.map((c) => (
              <th key={c.key} className={c.key === "actions" ? "col-sticky-end" : undefined} aria-sort={sortField === c.key ? (sortDir === "asc" ? "ascending" : "descending") : undefined}>
                {c.sortable ? (
                  <button onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 hover:text-ink cursor-pointer">
                    {c.label}
                    {sortField === c.key ? (
                      sortDir === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                    ) : (
                      <ChevronsUpDown size={13} className="text-faint" />
                    )}
                  </button>
                ) : (
                  c.label
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {leads.map((lead) => {
            const overdue = isFollowUpOverdue(lead);
            return (
              <tr key={lead.id} className="cursor-pointer" onClick={() => router.push(`/leads/${lead.id}`)}>
                <td className="whitespace-nowrap">
                  <Link href={`/leads/${lead.id}`} className="link font-medium" onClick={(e) => e.stopPropagation()}>
                    {lead.id}
                  </Link>
                </td>
                <td>
                  <p className="font-medium text-ink">{lead.customer.name}</p>
                  <p className="meta whitespace-nowrap">{formatPhone(lead.customer.mobile)}</p>
                  <p className="meta max-w-[220px] truncate">{lead.customer.email}</p>
                </td>
                <td className="whitespace-nowrap">
                  {getLeadType(lead.type).label}
                  {lead.company && <p className="meta max-w-[180px] truncate">{lead.company.name}</p>}
                </td>
                <td>{lead.outlet.name}</td>
                <td className="whitespace-nowrap">
                  {formatDate(lead.event.date)}
                  <p className="meta">{lead.event.guests} guests</p>
                </td>
                <td className="whitespace-nowrap">{lead.assignee?.name || <span className="text-muted">Unassigned</span>}</td>
                <td>
                  <LeadStatusBadge status={lead.status} />
                </td>
                <td className="whitespace-nowrap text-body">{formatDate(lead.createdAt)}</td>
                <td className="whitespace-nowrap">
                  {lead.lastFollowUpAt ? formatRelative(lead.lastFollowUpAt) : <span className="text-muted">None yet</span>}
                  {overdue && <p className="text-xs font-medium text-danger">Next is overdue</p>}
                </td>
                <td className="col-sticky-end" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-1">
                    <Link href={`/leads/${lead.id}`} className="btn btn-ghost btn-sm w-8 px-0" aria-label={`View ${lead.id}`}>
                      <Eye size={15} />
                    </Link>
                    {canEdit && !getStatus(lead.status).terminal && (
                      <Link href={`/leads/${lead.id}?edit=1`} className="btn btn-ghost btn-sm w-8 px-0" aria-label={`Edit ${lead.id}`}>
                        <Pencil size={15} />
                      </Link>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
