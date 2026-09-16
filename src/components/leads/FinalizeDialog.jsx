"use client";

import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { useAction } from "@/hooks/useAction";
import { formatCurrency, formatWeekday } from "@/lib/format";
import { calcTotals } from "@/lib/quotation";
import { leadService } from "@/services";
import { Button, Field, Input, Modal, Textarea } from "@/components/ui";

/** Confirmation step before a booking is finalized. */
export default function FinalizeDialog({ open, lead, onClose, onFinalized }) {
  const [form, setForm] = useState({ advancePaid: "", paymentReference: "", note: "" });
  const [run, busy] = useAction();

  const totals = lead?.invoice ? calcTotals(lead.invoice) : null;

  useEffect(() => {
    if (open && totals) setForm({ advancePaid: totals.advance, paymentReference: "", note: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lead?.id]);

  if (!lead || !lead.invoice) return null;

  const confirm = async () => {
    const updated = await run(() => leadService.finalizeLead(lead.id, form), { success: "Booking finalized" });
    if (updated) {
      onClose();
      onFinalized?.(updated);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Finalize this booking?"
      description={`${lead.id}, ${lead.customer.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="success" onClick={confirm} loading={busy}>Finalize booking</Button>
        </>
      }
    >
      <dl className="grid grid-cols-2 gap-3 rounded-md bg-subtle p-4 text-sm">
        <div><dt className="meta">Event</dt><dd className="text-ink">{formatWeekday(lead.event.date)}</dd></div>
        <div><dt className="meta">Guests</dt><dd className="text-ink">{lead.event.guests}</dd></div>
        <div><dt className="meta">Invoice {lead.invoice.number}</dt><dd className="font-semibold text-ink">{formatCurrency(totals.total)}</dd></div>
        <div><dt className="meta">Advance requested</dt><dd className="text-ink">{formatCurrency(totals.advance)}</dd></div>
      </dl>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <Field label="Advance received (₹)">
          {(p) => <Input {...p} type="number" min={0} value={form.advancePaid} onChange={(e) => setForm({ ...form, advancePaid: e.target.value })} />}
        </Field>
        <Field label="Payment reference" hint="UTR or transaction ID">
          {(p) => <Input {...p} value={form.paymentReference} onChange={(e) => setForm({ ...form, paymentReference: e.target.value })} />}
        </Field>
        <Field label="Note" className="sm:col-span-2">
          {(p) => <Textarea {...p} rows={2} value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />}
        </Field>
      </div>

      <p className="mt-4 flex gap-2 rounded-md bg-warning-soft px-3 py-2.5 text-[13px] text-warning">
        <AlertTriangle size={16} className="mt-0.5 shrink-0" />
        A finalized booking can&apos;t be edited. Next you&apos;ll review the customer confirmation before it&apos;s sent.
      </p>
    </Modal>
  );
}
