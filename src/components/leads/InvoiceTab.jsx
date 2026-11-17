"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, Download, IndianRupee, Pencil, Receipt, RefreshCw, Send, XCircle } from "lucide-react";
import { P } from "@/config/permissions";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useAction } from "@/hooks/useAction";
import { formatDate, formatDateTime, toDateInput } from "@/lib/format";
import { invoiceService, quotationService } from "@/services/admin";
import { Badge, Button, EmptyState, ErrorState, Field, Input, Modal, Select, Skeleton, Textarea } from "@/components/ui";
import InvoiceEditor from "./InvoiceEditor";

const money = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;

const STATUS_TONE = { draft: "gray", sent: "violet", paid: "green", cancelled: "red" };

const PAYMENT_MODES = [
  { value: "upi", label: "UPI" },
  { value: "card", label: "Card" },
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "cash", label: "Cash" },
  { value: "cheque", label: "Cheque" },
];

export default function InvoiceTab({ lead, onChanged }) {
  const { can } = useAuth();
  const toast = useToast();
  const [invoices, setInvoices] = useState(null);
  const [quotation, setQuotation] = useState(undefined); // undefined = couldn't check
  const [error, setError] = useState(null);
  const [dialog, setDialog] = useState(null); // create | edit | payment | cancel
  const [editing, setEditing] = useState(null);
  const [run, busy] = useAction();

  const canCreate = can(P.INVOICE_CREATE);
  const canPay = can(P.LEAD_FINALIZE);
  const closed = ["finalized", "cancelled"].includes(lead.status);

  const load = async () => {
    setError(null);
    try {
      const [list, quotes] = await Promise.all([
        invoiceService.listForLead(lead.id),
        // Only used to label the Create button, so a missing permission is fine
        quotationService.listForLead(lead.id).catch(() => undefined),
      ]);
      setInvoices(list);
      setQuotation(quotes === undefined ? undefined : quotes.find((q) => q.status !== "superseded") || null);
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lead.id]);

  if (error) return <ErrorState error={error} onRetry={load} />;
  if (!invoices) return <Skeleton className="h-48" />;

  const active = invoices.find((i) => i.status !== "cancelled") || null;
  const cancelled = invoices.filter((i) => i.status === "cancelled");

  const refresh = () => {
    load();
    onChanged?.();
  };

  const openPdf = async (id) => {
    try {
      await invoiceService.openInvoicePdf(id);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const regenerate = async (id) => {
    if (await run(() => invoiceService.generatePdf(id), { success: "PDF generated" })) load();
  };

  // The list comes without items, so fetch the full invoice before editing
  const openEdit = async () => {
    const full = await run(() => invoiceService.getInvoice(active.id));
    if (full) {
      setEditing(full);
      setDialog("edit");
    }
  };

  const send = async () => {
    const ok = await run(() => invoiceService.sendInvoice(active.id), {
      success: "Proforma invoice emailed",
      successDescription: `Sent to ${lead.email} with the PDF attached.`,
    });
    if (ok) refresh();
  };

  const editor = (
    <InvoiceEditor
      open={dialog === "create" || dialog === "edit"}
      lead={lead}
      invoice={dialog === "edit" ? editing : null}
      quotation={quotation || null}
      onClose={() => setDialog(null)}
      onSaved={refresh}
    />
  );

  if (!active) {
    const noQuote = quotation === null;
    return (
      <>
        <EmptyState
          icon={Receipt}
          title="No proforma invoice yet"
          description={
            closed ? "This lead is closed."
              : noQuote ? "Create a quotation first. The invoice is built from it."
                : quotation ? `It will be created from ${quotation.quotationCode} v${quotation.version} (${money(quotation.total)}).`
                  : "It will be created from the current quotation."
          }
          action={
            canCreate && !closed && !noQuote && (
              <Button variant="primary" onClick={() => setDialog("create")}>Create proforma invoice</Button>
            )
          }
        />
        {cancelled.length > 0 && <CancelledList invoices={cancelled} onOpen={openPdf} />}
        {editor}
      </>
    );
  }

  const open = ["draft", "sent"].includes(active.status);

  return (
    <div>
      <div className="rounded-md border border-line-strong p-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-ink">{active.invoiceNumber}</span>
              <Badge tone={STATUS_TONE[active.status] || "gray"}>{active.status}</Badge>
            </p>
            <p className="meta mt-0.5">
              {formatDateTime(active.createdAt)}
              {active.createdByName ? ` by ${active.createdByName}` : ""}
              {` · from quotation v${active.quotationVersion}`}
            </p>
            {active.sentAt && <p className="meta">Emailed {formatDateTime(active.sentAt)}</p>}
          </div>
          <p className="text-[15px] font-semibold text-ink">{money(active.total)}</p>
        </div>

        {open && active.quotationOutdated && (
          <p className="mt-3 flex gap-2 rounded-md bg-warning-soft px-3 py-2 text-[13px] text-warning">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            The quotation was revised after this invoice was made. Cancel this one and create a new invoice to pick up the changes.
          </p>
        )}

        <dl className="dl mt-4">
          <div><dt>Bill to</dt><dd>{active.billingName}</dd></div>
          <div><dt>GSTIN</dt><dd>{active.billingGstin || "—"}</dd></div>
          <div><dt>Advance due</dt><dd className="font-medium text-ink">{money(active.advanceDue)}</dd></div>
          <div><dt>Balance at venue</dt><dd>{money(active.balanceDue)}</dd></div>
        </dl>

        {active.status === "paid" && (
          <div className="mt-4 rounded-md bg-success-soft px-3 py-2 text-[13px] text-success">
            <p className="font-medium">
              Advance of {money(active.advancePaid)} received on {formatDate(active.paidAt)}
              {active.paymentMode ? ` by ${PAYMENT_MODES.find((m) => m.value === active.paymentMode)?.label || active.paymentMode}` : ""}
              {active.paymentReference ? ` (ref. ${active.paymentReference})` : ""}
            </p>
            {active.advancePaid < active.advanceDue && (
              <p>{money(active.advanceDue - active.advancePaid)} short of the advance due.</p>
            )}
            {lead.status !== "finalized" && <p>The booking can now be finalized from Update status.</p>}
          </div>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {active.pdfPath ? (
            <Button size="sm" icon={Download} onClick={() => openPdf(active.id)}>View PDF</Button>
          ) : (
            canCreate && <Button size="sm" icon={RefreshCw} onClick={() => regenerate(active.id)} loading={busy}>Generate PDF</Button>
          )}

          {canCreate && active.status === "draft" && (
            <Button size="sm" icon={Pencil} onClick={openEdit} loading={busy}>Edit</Button>
          )}

          {canCreate && open && active.pdfPath && (
            <Button
              size="sm"
              variant={active.status === "draft" ? "primary" : "secondary"}
              icon={Send}
              onClick={send}
              loading={busy}
              disabled={!lead.email}
              title={lead.email ? undefined : "This customer has no email address"}
            >
              {active.status === "draft" ? "Email to customer" : "Email again"}
            </Button>
          )}

          {canPay && open && (
            <Button size="sm" variant="success" icon={IndianRupee} onClick={() => setDialog("payment")}>
              Record advance
            </Button>
          )}

          {canCreate && open && (
            <Button size="sm" variant="ghost" icon={XCircle} onClick={() => setDialog("cancel")} className="text-danger">
              Cancel invoice
            </Button>
          )}
        </div>
      </div>

      {cancelled.length > 0 && <CancelledList invoices={cancelled} onOpen={openPdf} />}

      {editor}
      <PaymentDialog open={dialog === "payment"} invoice={active} onClose={() => setDialog(null)} onSaved={refresh} />
      <CancelDialog open={dialog === "cancel"} invoice={active} onClose={() => setDialog(null)} onSaved={refresh} />
    </div>
  );
}

/** Cancelled invoices stay on record, numbers and all. */
function CancelledList({ invoices, onOpen }) {
  return (
    <div className="mt-5">
      <p className="section-title mb-2">Cancelled</p>
      <ul className="grid gap-2">
        {invoices.map((i) => (
          <li key={i.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-subtle/40 px-3 py-2.5">
            <div className="min-w-0">
              <p className="text-sm text-ink">{i.invoiceNumber} · {money(i.total)}</p>
              <p className="meta">Cancelled {formatDate(i.cancelledAt)}{i.cancelReason ? `: ${i.cancelReason}` : ""}</p>
            </div>
            {i.pdfPath && <Button size="sm" variant="ghost" icon={Download} onClick={() => onOpen(i.id)}>PDF</Button>}
          </li>
        ))}
      </ul>
    </div>
  );
}

function PaymentDialog({ open, invoice, onClose, onSaved }) {
  const [form, setForm] = useState({ advancePaid: "", paidAt: "", paymentMode: "upi", paymentReference: "" });
  const [error, setError] = useState("");
  const [run, busy] = useAction();

  useEffect(() => {
    if (!open) return;
    setError("");
    setForm({ advancePaid: String(invoice.advanceDue), paidAt: toDateInput(new Date()), paymentMode: "upi", paymentReference: "" });
  }, [open, invoice]);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    const amount = Number(form.advancePaid);
    if (!(amount > 0)) return setError("Enter the amount received");
    if (amount > invoice.total) return setError(`That's more than the invoice total of ${money(invoice.total)}`);

    const ok = await run(
      () => invoiceService.recordPayment(invoice.id, {
        advancePaid: amount,
        paidAt: form.paidAt || undefined,
        paymentMode: form.paymentMode,
        paymentReference: form.paymentReference.trim(),
      }),
      { success: "Advance recorded" }
    );
    if (ok) {
      onSaved();
      onClose();
    }
  };

  const short = Number(form.advancePaid) > 0 && Number(form.advancePaid) < invoice.advanceDue;

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Record advance payment"
      description={`${invoice.invoiceNumber} · advance due ${money(invoice.advanceDue)}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="payment-form" loading={busy}>Record payment</Button>
        </>
      }
    >
      <form id="payment-form" onSubmit={submit} noValidate className="grid gap-4">
        <Field
          label="Amount received (₹)"
          required
          error={error}
          hint={short ? `${money(invoice.advanceDue - Number(form.advancePaid))} less than the advance due. It will be noted on the lead.` : undefined}
        >
          {(p) => <Input {...p} type="number" min={0} value={form.advancePaid} onChange={set("advancePaid")} />}
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Received on">
            {(p) => <Input {...p} type="date" max={toDateInput(new Date())} value={form.paidAt} onChange={set("paidAt")} />}
          </Field>
          <Field label="Mode">
            {(p) => <Select {...p} value={form.paymentMode} onChange={set("paymentMode")} options={PAYMENT_MODES} />}
          </Field>
        </div>
        <Field label="Reference" hint="UTR, transaction ID or cheque number.">
          {(p) => <Input {...p} maxLength={100} value={form.paymentReference} onChange={set("paymentReference")} />}
        </Field>
      </form>
    </Modal>
  );
}

function CancelDialog({ open, invoice, onClose, onSaved }) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [run, busy] = useAction();

  useEffect(() => {
    if (open) {
      setReason("");
      setError("");
    }
  }, [open]);

  const submit = async (e) => {
    e.preventDefault();
    if (reason.trim().length < 3) return setError("Give a reason for cancelling");
    const ok = await run(() => invoiceService.cancelInvoice(invoice.id, reason.trim()), {
      success: `${invoice.invoiceNumber} cancelled`,
      successDescription: "You can now create a new invoice for this lead.",
    });
    if (ok) {
      onSaved();
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={`Cancel ${invoice.invoiceNumber}?`}
      description="It stays on record as cancelled. A new invoice gets the next number."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Keep it</Button>
          <Button variant="danger" type="submit" form="cancel-invoice-form" loading={busy}>Cancel invoice</Button>
        </>
      }
    >
      <form id="cancel-invoice-form" onSubmit={submit} noValidate>
        <Field label="Reason" required error={error}>
          {(p) => <Textarea {...p} rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Guest count changed" />}
        </Field>
      </form>
    </Modal>
  );
}