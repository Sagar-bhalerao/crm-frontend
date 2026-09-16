"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { DEFAULT_PACKAGE_BY_TYPE, getCatalog } from "@/config/pricing";
import { useAction } from "@/hooks/useAction";
import { addDays, formatCurrency, toDateInput } from "@/lib/format";
import { calcTotals } from "@/lib/quotation";
import { leadService } from "@/services";
import { Button, Field, Input, Modal, Select, Textarea } from "@/components/ui";

function initialForm(lead, settings) {
  if (lead.quotation) {
    return {
      items: lead.quotation.items.map((i) => ({ ...i })),
      discount: lead.quotation.discount,
      taxRate: lead.quotation.taxRate,
      validUntil: toDateInput(lead.quotation.validUntil),
      notes: lead.quotation.notes,
    };
  }
  const catalog = getCatalog(lead.brandId);
  const pkg = catalog.find((c) => c.key === DEFAULT_PACKAGE_BY_TYPE[lead.type]);
  return {
    items: pkg ? [{ description: pkg.label, qty: lead.event.guests, rate: pkg.rate }] : [{ description: "", qty: 1, rate: 0 }],
    discount: 0,
    taxRate: settings.taxRate,
    validUntil: toDateInput(addDays(new Date(), settings.quotationValidDays)),
    notes: "Rates valid for the selected date and guest count.",
  };
}

export default function QuotationEditor({ open, lead, onClose }) {
  const [form, setForm] = useState(null);
  const [error, setError] = useState("");
  const [run, busy] = useAction();
  const [pending, setPending] = useState(null); // "draft" | "share"
  const { settings } = useSettings();

  useEffect(() => {
    if (open && lead) {
      setForm(initialForm(lead, settings));
      setError("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, lead?.id]);

  if (!lead || !form) return null;
  const catalog = getCatalog(lead.brandId);
  const totals = calcTotals(form);

  const setItem = (idx, key, val) =>
    setForm((f) => ({ ...f, items: f.items.map((it, i) => (i === idx ? { ...it, [key]: val } : it)) }));
  const removeItem = (idx) => setForm((f) => ({ ...f, items: f.items.filter((_, i) => i !== idx) }));
  const addItem = (catalogKey) => {
    const c = catalog.find((x) => x.key === catalogKey);
    setForm((f) => ({ ...f, items: [...f.items, c ? { description: c.label, qty: 1, rate: c.rate } : { description: "", qty: 1, rate: 0 }] }));
  };

  const save = async (share) => {
    const valid = form.items.filter((i) => i.description.trim() && Number(i.qty) > 0);
    if (valid.length === 0) return setError("Add at least one item with a description and quantity.");
    setPending(share ? "share" : "draft");
    const ok = await run(() => leadService.saveQuotation(lead.id, { ...form, share }), {
      success: share ? "Quotation shared with customer" : "Quotation saved as draft",
      successDescription: share ? "Sent by email and WhatsApp (simulated)" : undefined,
    });
    setPending(null);
    if (ok) onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="xl"
      title={lead.quotation ? `Edit quotation ${lead.quotation.number}` : "Create quotation"}
      description={`${lead.customer.name}${lead.company ? ` (${lead.company.name})` : ""}, ${lead.event.guests} guests at ${lead.outlet.name}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="secondary" loading={busy && pending === "draft"} disabled={busy} onClick={() => save(false)}>Save draft</Button>
          <Button variant="primary" loading={busy && pending === "share"} disabled={busy} onClick={() => save(true)}>Share with customer</Button>
        </>
      }
    >
      <div className="grid gap-5">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="label mb-0">Items</p>
            <p className="meta">Sample rates. Replace with the outlet rate card.</p>
          </div>

          <div className="hidden grid-cols-[1fr_80px_120px_110px_36px] gap-2 px-1 pb-1 text-xs text-muted sm:grid">
            <span>Description</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Rate (₹)</span>
            <span className="text-right">Amount</span>
            <span />
          </div>

          <ul className="grid gap-2">
            {form.items.map((item, idx) => (
              <li key={idx} className="grid grid-cols-[1fr_36px] gap-2 rounded-md border border-line p-2 sm:grid-cols-[1fr_80px_120px_110px_36px] sm:border-0 sm:p-0">
                <Input aria-label="Description" value={item.description} onChange={(e) => setItem(idx, "description", e.target.value)} list="catalog-items" placeholder="Item description" />
                <Button variant="ghost" iconOnly icon={Trash2} onClick={() => removeItem(idx)} className="sm:order-last">Remove item</Button>
                <div className="col-span-2 grid grid-cols-3 gap-2 sm:contents">
                  <Input aria-label="Quantity" type="number" min={0} inputMode="numeric" value={item.qty} onChange={(e) => setItem(idx, "qty", e.target.value)} className="text-right" />
                  <Input aria-label="Rate" type="number" min={0} inputMode="numeric" value={item.rate} onChange={(e) => setItem(idx, "rate", e.target.value)} className="text-right" />
                  <span className="flex h-9 items-center justify-end text-sm text-ink">{formatCurrency((Number(item.qty) || 0) * (Number(item.rate) || 0))}</span>
                </div>
              </li>
            ))}
          </ul>
          <datalist id="catalog-items">
            {catalog.map((c) => <option key={c.key} value={c.label} />)}
          </datalist>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Button size="sm" icon={Plus} onClick={() => addItem("")}>Add item</Button>
            <Select
              aria-label="Add from rate card"
              value=""
              onChange={(e) => e.target.value && addItem(e.target.value)}
              placeholder="Add from rate card"
              options={catalog.map((c) => ({ value: c.key, label: `${c.label}, ${formatCurrency(c.rate)}` }))}
              className="h-8 w-auto text-[13px]"
            />
          </div>
          {error && <p className="field-error">{error}</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-[1fr_280px]">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Discount (₹)">
              {(p) => <Input {...p} type="number" min={0} value={form.discount} onChange={(e) => setForm({ ...form, discount: e.target.value })} />}
            </Field>
            <Field label="GST (%)">
              {(p) => <Input {...p} type="number" min={0} value={form.taxRate} onChange={(e) => setForm({ ...form, taxRate: e.target.value })} />}
            </Field>
            <Field label="Valid until">
              {(p) => <Input {...p} type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />}
            </Field>
            <Field label="Notes for customer" className="sm:col-span-3">
              {(p) => <Textarea {...p} rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />}
            </Field>
          </div>

          <dl className="grid content-start gap-1.5 rounded-md bg-subtle p-4 text-sm">
            <Total label="Subtotal" value={totals.subtotal} />
            {totals.discountAmount > 0 && <Total label="Discount" value={-totals.discountAmount} />}
            <Total label={`GST (${form.taxRate || 0}%)`} value={totals.tax} />
            <div className="mt-1 flex justify-between border-t border-line pt-2 text-[15px] font-semibold text-ink">
              <dt>Total</dt>
              <dd>{formatCurrency(totals.total)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </Modal>
  );
}

function Total({ label, value }) {
  return (
    <div className="flex justify-between text-body">
      <dt>{label}</dt>
      <dd>{value < 0 ? `− ${formatCurrency(-value)}` : formatCurrency(value)}</dd>
    </div>
  );
}
