"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Eye, Receipt } from "lucide-react";
import { useToast } from "@/context/ToastContext";
import { addDays, endOfDay, formatDate } from "@/lib/format";
import { invoiceService, locationService } from "@/services/admin";
import {
  Badge, Button, DataTable, DropdownMenu, EmptyState, ErrorState, PageHeader, Pagination, Skeleton,
} from "@/components/ui";
import { useAdminList } from "@/components/admin/useAdminList";
import ListToolbar from "@/components/admin/ListToolbar";
import { useSearchParams } from "next/navigation";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const STATUS_TONE = { draft: "gray", sent: "violet", paid: "green", cancelled: "red" };

const STATUS_OPTIONS = [
  { value: "draft", label: "Draft" },
  { value: "sent", label: "Sent, awaiting advance" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
];

const SORT_OPTIONS = [
  { value: "createdAt:desc", label: "Newest first" },
  { value: "eventDate:asc", label: "Event date" },
  { value: "total:desc", label: "Highest value" },
];

/** No advance yet and the event is within three days: someone should chase it. */
const isUrgent = (inv) =>
  ["draft", "sent"].includes(inv.status) &&
  inv.eventDate &&
  new Date(inv.eventDate).getTime() <= endOfDay(addDays(Date.now(), 3));

export default function InvoicesView() {
  const toast = useToast();
  const params = useSearchParams();
  const list = useAdminList(invoiceService.listInvoices, {
    sort: "createdAt:desc",
    status: params.get("status") || "",
    locationId: "",
  });
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    // Not everyone may list locations; the filter is simply hidden then
    locationService
      .listLocations({ pageSize: 100, sort: "name:asc" })
      .then((r) => setLocations(r.items))
      .catch(() => setLocations([]));
  }, []);

  const openPdf = async (inv) => {
    try {
      await invoiceService.openInvoicePdf(inv.id);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const menu = (inv) => [
    { key: "lead", label: "Open lead", icon: Eye, href: `/leads/${inv.leadId}` },
    inv.pdfPath && { key: "pdf", label: "View PDF", icon: Download, onClick: () => openPdf(inv) },
  ];

  const status = (inv) => (
    <>
      <Badge tone={STATUS_TONE[inv.status] || "gray"} className="capitalize">{inv.status}</Badge>
      {inv.status === "sent" && inv.sentAt && <span className="meta block">Sent {formatDate(inv.sentAt)}</span>}
      {inv.status === "paid" && <span className="meta block">Paid {formatDate(inv.paidAt)}</span>}
    </>
  );

  const advance = (inv) =>
    inv.status === "paid" ? (
      <span className="whitespace-nowrap text-success">
        {money(inv.advancePaid)} received
        {inv.advancePaid < inv.advanceDue && (
          <span className="meta block text-warning">{money(inv.advanceDue - inv.advancePaid)} short</span>
        )}
      </span>
    ) : inv.status === "cancelled" ? (
      <span className="text-muted">—</span>
    ) : (
      <span className="whitespace-nowrap text-body">{money(inv.advanceDue)} due</span>
    );

  const event = (inv) => (
    <span className="whitespace-nowrap text-body">
      {inv.eventDate ? formatDate(inv.eventDate) : "—"}
      {isUrgent(inv) && <span className="meta block font-medium text-danger">Advance not received</span>}
    </span>
  );

  const columns = [
    {
      key: "invoice",
      label: "Invoice",
      render: (inv) => (
        <div>
          <p className="font-medium text-ink">{inv.invoiceNumber}</p>
          <p className="meta">{formatDate(inv.createdAt)}{inv.createdByName ? ` by ${inv.createdByName}` : ""}</p>
        </div>
      ),
    },
    {
      key: "customer",
      label: "Customer",
      render: (inv) => (
        <div className="min-w-0">
          <Link href={`/leads/${inv.leadId}`} className="font-medium text-ink hover:underline">{inv.customerName}</Link>
          <p className="meta truncate">
            {inv.leadCode}{inv.billingName && inv.billingName !== inv.customerName ? ` · ${inv.billingName}` : ""}
          </p>
        </div>
      ),
    },
    { key: "location", label: "Location", render: (inv) => <span className="text-body">{inv.locationName}</span> },
    { key: "eventDate", label: "Event", sortable: true, render: event },
    {
      key: "total",
      label: "Total",
      sortable: true,
      align: "right",
      render: (inv) => <span className="whitespace-nowrap font-medium text-ink">{money(inv.total)}</span>,
    },
    { key: "advance", label: "Advance", render: advance },
    { key: "status", label: "Status", render: status },
    { key: "owner", label: "Sales POC", render: (inv) => <span className="text-body">{inv.assignedToName || "—"}</span> },
    {
      key: "actions",
      label: "Actions",
      sticky: true,
      align: "right",
      render: (inv) => (
        <div className="flex justify-end">
          <DropdownMenu items={menu(inv)} label={`Actions for ${inv.invoiceNumber}`} />
        </div>
      ),
    },
  ];

  const card = (inv) => (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <Link href={`/leads/${inv.leadId}`} className="font-medium text-ink">{inv.customerName}</Link>
        <p className="meta">{inv.invoiceNumber} · {money(inv.total)}</p>
        <p className="meta">{inv.locationName} · {inv.eventDate ? formatDate(inv.eventDate) : "No date"}</p>
        <div className="mt-1.5 flex flex-wrap items-center gap-2">
          <Badge tone={STATUS_TONE[inv.status] || "gray"} className="capitalize">{inv.status}</Badge>
          <span className="text-[13px]">{advance(inv)}</span>
        </div>
        {isUrgent(inv) && <p className="meta mt-1 font-medium text-danger">Event soon, advance not received</p>}
      </div>
      <DropdownMenu items={menu(inv)} label={`Actions for ${inv.invoiceNumber}`} />
    </div>
  );

  const filters = [
    { key: "status", placeholder: "All except cancelled", value: list.query.status, options: STATUS_OPTIONS },
    locations.length > 0 && {
      key: "locationId",
      placeholder: "All locations",
      value: String(list.query.locationId || ""),
      options: locations.map((l) => ({ value: String(l.id), label: l.name })),
    },
  ].filter(Boolean);

  const filtered = list.hasFilters || Boolean(list.query.locationId);
  console.log("proforma invoice", list);
  return (
    <div className="page">
      <PageHeader
        title="Proforma invoices"
        description={list.data ? `${list.data.total} invoice${list.data.total === 1 ? "" : "s"}` : "\u00a0"}
      />

      <section className="panel">
        <ListToolbar
          search={list.search}
          onSearch={list.setSearch}
          searchPlaceholder="Search customer, lead or invoice"
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
            icon={Receipt}
            title={filtered ? "No invoices match these filters" : "No proforma invoices yet"}
            description={filtered ? "Try a different search or status." : "Invoices are created from a lead's Proforma invoice tab."}
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
              minWidth={1200}
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