"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Eye, FileText } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { formatDate, startOfDay } from "@/lib/format";
import { locationService, quotationService } from "@/services/admin";
import {
  Badge, Button, DataTable, DropdownMenu, EmptyState, ErrorState, PageHeader, Pagination, Skeleton,
} from "@/components/ui";
import { useAdminList } from "@/components/admin/useAdminList";
import ListToolbar from "@/components/admin/ListToolbar";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const STATUS_TONE = { draft: "gray", shared: "violet", accepted: "green", rejected: "red", superseded: "gray" };

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "shared", label: "Shared" },
  { value: "accepted", label: "Accepted" },
  { value: "rejected", label: "Rejected" },
];

const SORT_OPTIONS = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "eventDate:asc", label: "Event date" },
  { value: "total:desc", label: "Highest value" },
];

/** Still open with the customer, but past its validity date. */
const isExpired = (q) =>
  ["draft", "shared"].includes(q.status) && q.validUntil && new Date(q.validUntil).getTime() < startOfDay(Date.now());

export default function QuotationsView() {
  const toast = useToast();
  const list = useAdminList(quotationService.listQuotations, { sort: "createdAt:desc", locationId: "", versions: "" });
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    // Not everyone may list locations; the filter is simply hidden then
    locationService
      .listLocations({ pageSize: 100, sort: "name:asc" })
      .then((r) => setLocations(r.items))
      .catch(() => setLocations([]));
  }, []);

  const openPdf = async (q) => {
    try {
      await quotationService.openQuotationPdf(q.id);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const menu = (q) => [
    { key: "lead", label: "Open lead", icon: Eye, href: `/leads/${q.leadId}` },
    q.pdfPath && { key: "pdf", label: "View PDF", icon: Download, onClick: () => openPdf(q) },
  ];

  const status = (q) => (
    <>
      <Badge tone={STATUS_TONE[q.status] || "gray"} className="capitalize">{q.status}</Badge>
      {isExpired(q) && <span className="meta block text-danger">Expired {formatDate(q.validUntil)}</span>}
    </>
  );

  const columns = [
    {
      key: "quotation",
      label: "Quotation",
      render: (q) => (
        <div>
          <p className="font-medium text-ink">{q.quotationCode} <span className="meta">v{q.version}</span></p>
          <p className="meta">{formatDate(q.createdAt)}{q.createdByName ? ` by ${q.createdByName}` : ""}</p>
        </div>
      ),
    },
    {
      key: "customer",
      label: "Customer",
      render: (q) => (
        <div className="min-w-0">
          <Link href={`/leads/${q.leadId}`} className="font-medium text-ink hover:underline">{q.customerName}</Link>
          <p className="meta">{q.leadCode}</p>
        </div>
      ),
    },
    { key: "location", label: "Location", render: (q) => <span className="text-body">{q.locationName}</span> },
    {
      key: "eventDate",
      label: "Event",
      sortable: true,
      render: (q) => (
        <span className="whitespace-nowrap text-body">
          {q.eventDate ? formatDate(q.eventDate) : "—"}
          {q.guests ? <span className="meta block">{q.guests} guests</span> : null}
        </span>
      ),
    },
    {
      key: "total",
      label: "Total",
      sortable: true,
      align: "right",
      render: (q) => <span className="whitespace-nowrap font-medium text-ink">{money(q.total)}</span>,
    },
    { key: "status", label: "Status", render: status },
    {
      key: "owner",
      label: "Sales POC",
      render: (q) => <span className="text-body">{q.assignedToName || "—"}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      sticky: true,
      align: "right",
      render: (q) => (
        <div className="flex justify-end">
          <DropdownMenu items={menu(q)} label={`Actions for ${q.quotationCode}`} />
        </div>
      ),
    },
  ];

  const card = (q) => (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <Link href={`/leads/${q.leadId}`} className="font-medium text-ink">{q.customerName}</Link>
        <p className="meta">{q.quotationCode} v{q.version} · {money(q.total)}</p>
        <p className="meta">{q.locationName} · {q.eventDate ? formatDate(q.eventDate) : "No date"}</p>
        <div className="mt-1.5">{status(q)}</div>
      </div>
      <DropdownMenu items={menu(q)} label={`Actions for ${q.quotationCode}`} />
    </div>
  );

  const filters = [
    { key: "status", placeholder: "All statuses", value: list.query.status, options: STATUS_OPTIONS },
    locations.length > 0 && {
      key: "locationId",
      placeholder: "All locations",
      value: String(list.query.locationId || ""),
      options: locations.map((l) => ({ value: String(l.id), label: l.name })),
    },
    {
      key: "versions",
      placeholder: "Latest versions",
      value: list.query.versions || "",
      options: [{ value: "all", label: "All versions" }],
    },
  ].filter(Boolean);

  const filtered = list.hasFilters || Boolean(list.query.locationId) || Boolean(list.query.versions);
  console.log("quotation list",list)

  return (
    <div className="page">
      <PageHeader
        title="Quotations"
        description={list.data ? `${list.data.total} quotation${list.data.total === 1 ? "" : "s"}` : "\u00a0"}
      />

      <section className="panel">
        <ListToolbar
          search={list.search}
          onSearch={list.setSearch}
          searchPlaceholder="Search customer, lead or quotation"
          filters={filters}
          sortOptions={SORT_OPTIONS}
          sort={list.query.sort}
          onChange={list.update}
          onClear={list.clear}
          showClear={filtered}
        />

        {list.error ? (
          <ErrorState error={list.error} onRetry={list.reload} />
        ) : !list.data ? (
          <div className="grid gap-3 p-4">
            {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : list.data.items.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={filtered ? "No quotations match these filters" : "No quotations yet"}
            description={filtered ? "Try a different search or status." : "Quotations are created from a lead's Quotation tab."}
            action={filtered && <Button size="sm" onClick={list.clear}>Clear filters</Button>}
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
              minWidth={1100}
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
    </div>
  );
}