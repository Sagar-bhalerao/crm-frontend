"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/context/SettingsContext";
import { useAction } from "@/hooks/useAction";
import { addDays, formatCurrency, toDateInput } from "@/lib/format";
import { calcTotals } from "@/lib/quotation";
import { leadService } from "@/services";
import { Button, Field, Input, Modal, Textarea } from "@/components/ui";

export default function InvoiceDialog({ open, lead, onClose }) {
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [run, busy] = useAction();
  const { settings } = useSettings();

  useEffect(() => {
    if (!open || !lead) return;
    setError("");
    setForm({
      billingName: lead.invoice?.billingName || lead.company?.name || lead.customer.name,
      billingGstin: lead.invoice?.billingGstin || lead.company?.gstin || "",
      advancePercent: lead.invoice?.advancePercent ?? settings.advancePercent,
      dueDate: toDateInput(lead.invoice?.dueDate || addDays(new Date(), 3)),
      terms: lead.invoice?.terms || "Advance payment confirms the booking. Balance payable at the venue on the event date.",
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lead?.id]);

  if (!lead || !form || !lead.quotation) return null;
  const totals = calcTotals({ ...lead.quotation, advancePercent: form.advancePercent });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const save = async (e) => {
    e?.preventDefault();
    if (!form.billingName.trim()) return setError("Enter the billing name");
    const ok = await run(() => leadService.generateInvoice(lead.id, form), {
      success: "Proforma invoice generated",
      successDescription: "Shared with customer by email and WhatsApp (simulated)",
    });
    if (ok) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Generate proforma invoice"
      description={`From quotation ${lead.quotation.number} v${lead.quotation.version}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="invoice-form" loading={busy}>Generate and share</Button>
        </>
      }
    >
      <form id="invoice-form" onSubmit={save} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Bill to" required error={error}>
          {(p) => <Input {...p} value={form.billingName} onChange={set("billingName")} />}
        </Field>
        <Field label="GSTIN" hint={lead.company ? "Required for corporate GST credit" : "Optional"}>
          {(p) => <Input {...p} value={form.billingGstin} onChange={set("billingGstin")} className="uppercase" maxLength={15} />}
        </Field>
        <Field label="Advance required (%)">
          {(p) => <Input {...p} type="number" min={0} max={100} value={form.advancePercent} onChange={set("advancePercent")} />}
        </Field>
        <Field label="Advance due by">
          {(p) => <Input {...p} type="date" value={form.dueDate} onChange={set("dueDate")} />}
        </Field>
        <Field label="Payment terms" className="sm:col-span-2">
          {(p) => <Textarea {...p} rows={2} value={form.terms} onChange={set("terms")} />}
        </Field>

        <dl className="grid gap-1.5 rounded-md bg-subtle p-4 text-sm sm:col-span-2 sm:grid-cols-3">
          <div><dt className="meta">Invoice total</dt><dd className="text-[15px] font-semibold text-ink">{formatCurrency(totals.total)}</dd></div>
          <div><dt className="meta">Advance ({form.advancePercent || 0}%)</dt><dd className="text-[15px] font-semibold text-ink">{formatCurrency(totals.advance)}</dd></div>
          <div><dt className="meta">Balance at venue</dt><dd className="text-[15px] font-semibold text-ink">{formatCurrency(totals.balance)}</dd></div>
        </dl>
      </form>
    </Modal>
  );
}
