"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, Inbox, Pencil, Plus, Trash2 } from "lucide-react";
import { P } from "@/config/permissions";
import { useAuth } from "@/context/AuthContext";
import { useAction } from "@/hooks/useAction";
import { formatDate } from "@/lib/format";
import { leadService, locationService } from "@/services/admin";
import {
  Badge, Button, ConfirmDialog, DataTable, DropdownMenu, EmptyState, ErrorState,
  PageHeader, Pagination, Skeleton,
} from "@/components/ui";
import { useAdminList } from "@/components/admin/useAdminList";
import ListToolbar from "@/components/admin/ListToolbar";
import LeadFormDialog from "./LeadFormDialog";

/** Colour per stage, so the pipeline reads at a glance. */
const STATUS_TONE = {
  new: "blue",
  assigned: "violet",
  in_progress: "amber",
  quotation: "violet",
  proforma_invoice: "teal",
  finalized: "green",
  not_interested: "gray",
  cancelled: "gray",
};

const SORT_OPTIONS = [
  { value: "created_date:desc", label: "Newest first" },
  { value: "event_date:asc", label: "Event date" },
  { value: "next_followup_at:asc", label: "Follow-up due" },
];

export default function LeadsListView() {
  const { can } = useAuth();
  const list = useAdminList(leadService.listLeads, { sort: "created_date:desc", leadType: "", locationId: "" });
  const [options, setOptions] = useState({ statuses: [], types: [] });
  const [locations, setLocations] = useState([]);
  const [form, setForm] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [run, busy] = useAction();

  const canCreate = can(P.LEAD_CREATE);
  const canUpdate = can(P.LEAD_UPDATE);
  const canDelete = can(P.LEAD_DELETE);

  useEffect(() => {
    leadService.getOptions().then(setOptions).catch(() => {});
    locationService
      .listLocations({ pageSize: 100, sort: "name:asc" })
      .then((r) => setLocations(r.items))
      .catch(() => setLocations([]));
  }, []);

  const statusLabel = (key) => options.statuses.find((s) => s.key === key)?.label || key;
  const typeLabel = (key) => options.types.find((t) => t.key === key)?.label || key;

  const confirmDelete = async () => {
    const ok = await run(() => leadService.deleteLead(deleting.id), { success: `${deleting.leadCode} deleted` });
    setDeleting(null);
    if (ok) list.reload();
  };

  const menu = (l) => [
    { key: "view", label: "View details", icon: Eye, href: `/leads/${l.id}` },
    canUpdate && { key: "edit", label: "Edit lead", icon: Pencil, onClick: () => setForm({ lead: l }) },
    canDelete && { key: "delete", label: "Delete lead", icon: Trash2, tone: "danger", onClick: () => setDeleting(l), separator: true },
  ];

  const columns = [
    {
      key: "lead_code",
      label: "Lead",
      render: (l) => (
        <div>
          <Link href={`/leads/${l.id}`} className="font-medium text-ink hover:underline">{l.leadCode}</Link>
          <p className="meta">{formatDate(l.createdAt)}</p>
        </div>
      ),
    },
    {
      key: "first_name",
      label: "Customer",
      sortable: true,
      render: (l) => (
        <div className="min-w-0">
          <p className="font-medium text-ink">{l.name}</p>
          <p className="meta truncate">{l.mobile}{l.email ? ` · ${l.email}` : ""}</p>
        </div>
      ),
    },
    { key: "lead_type", label: "Type", render: (l) => <span className="text-body">{typeLabel(l.leadType)}</span> },
    { key: "location", label: "Location", render: (l) => <span className="text-body">{l.locationName}</span> },
    {
      key: "event_date",
      label: "Event",
      sortable: true,
      render: (l) => (
        <span className="whitespace-nowrap text-body">
          {l.eventDate ? formatDate(l.eventDate) : "—"}
          {l.guests ? <span className="meta block">{l.guests} guests</span> : null}
        </span>
      ),
    },
    { key: "assigned", label: "Assigned to", render: (l) => <span className="text-body">{l.assignedToName || "Unassigned"}</span> },
    {
      key: "status",
      label: "Status",
      sortable: true,
      render: (l) => <Badge tone={STATUS_TONE[l.status] || "gray"} dot>{statusLabel(l.status)}</Badge>,
    },
    {
      key: "next_followup_at",
      label: "Follow-up",
      sortable: true,
      render: (l) => <span className="whitespace-nowrap text-body">{l.nextFollowupAt ? formatDate(l.nextFollowupAt) : "—"}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      sticky: true,
      align: "right",
      render: (l) => (
        <div className="flex justify-end">
          <DropdownMenu items={menu(l)} label={`Actions for ${l.leadCode}`} />
        </div>
      ),
    },
  ];

  const card = (l) => (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <Link href={`/leads/${l.id}`} className="font-medium text-ink">{l.name}</Link>
        <p className="meta">{l.leadCode} · {typeLabel(l.leadType)}</p>
        <p className="meta">{l.locationName} · {l.eventDate ? formatDate(l.eventDate) : "No date"}</p>
        <div className="mt-1.5">
          <Badge tone={STATUS_TONE[l.status] || "gray"} dot>{statusLabel(l.status)}</Badge>
        </div>
      </div>
      <DropdownMenu items={menu(l)} label={`Actions for ${l.leadCode}`} />
    </div>
  );

  return (
    <div className="page">
      <PageHeader
        title="Leads"
        description={list.data ? `${list.data.total} lead${list.data.total === 1 ? "" : "s"}` : "\u00a0"}
        actions={canCreate && <Button variant="primary" icon={Plus} onClick={() => setForm({ lead: null })}>Add lead</Button>}
      />

      <section className="panel">
        <ListToolbar
          search={list.search}
          onSearch={list.setSearch}
          filters={[
            {
              key: "status",
              placeholder: "All statuses",
              value: list.query.status,
              options: options.statuses.map((s) => ({ value: s.key, label: s.label })),
            },
            {
              key: "leadType",
              placeholder: "All types",
              value: list.query.leadType,
              options: options.types.map((t) => ({ value: t.key, label: t.label })),
            },
            {
              key: "locationId",
              placeholder: "All locations",
              value: String(list.query.locationId || ""),
              options: locations.map((l) => ({ value: String(l.id), label: l.name })),
            },
          ]}
          sortOptions={SORT_OPTIONS}
          sort={list.query.sort}
          onChange={list.update}
          onClear={list.clear}
          showClear={list.hasFilters}
        />

        {list.error ? (
          <ErrorState error={list.error} onRetry={list.reload} />
        ) : !list.data ? (
          <div className="grid gap-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : list.data.items.length === 0 ? (
          <EmptyState
            icon={Inbox}
            title={list.hasFilters ? "No leads match these filters" : "No leads yet"}
            description={list.hasFilters ? "Try a different search or status." : "Website enquiries will appear here, or add one by hand."}
            action={
              list.hasFilters ? (
                <Button size="sm" onClick={list.clear}>Clear filters</Button>
              ) : (
                canCreate && <Button size="sm" variant="primary" onClick={() => setForm({ lead: null })}>Add lead</Button>
              )
            }
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={list.data.items}
              sort={list.query.sort}
              onSort={(sort) => list.update({ sort })}
              renderCard={card}
              busy={list.loading}
              minWidth={1180}
            />
            <div className="border-t border-line">
              <Pagination
                page={list.data.page}
                totalPages={list.data.totalPages}
                total={list.data.total}
                pageSize={list.data.pageSize}
                onChange={list.setPage}
              />
            </div>
          </>
        )}
      </section>


    {/* to add & edit leads */}
      <LeadFormDialog
        open={Boolean(form)}
        lead={form?.lead}
        options={options}
        locations={locations}
        onClose={() => setForm(null)}
        onSaved={list.reload}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete ${deleting?.leadCode}?`}
        description="This removes the lead and its follow-ups permanently. Mark it Not interested instead if you want to keep the history."
        confirmLabel="Delete lead"
        tone="danger"
        loading={busy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}