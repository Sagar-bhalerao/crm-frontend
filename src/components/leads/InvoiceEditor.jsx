"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { DEFAULT_ADVANCE_PERCENT } from "@/config/app";
import { useAction } from "@/hooks/useAction";
import { invoiceService } from "@/services/admin";
import { Button, Field, Input, Modal, Select, Textarea } from "@/components/ui";

const money = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

/**
 * Creating copies the items from the quotation on the server, so only the
 * billing details and advance are asked for. Editing a draft opens the
 * items as well, since the POC may need to adjust them.
 */
export default function InvoiceEditor({ open, lead, invoice, quotation, replaces, onClose, onSaved }) {
  const editing = Boolean(invoice);
  const [form, setForm] = useState(null);
  const [items, setItems] = useState([]);
  const [errors, setErrors] = useState({});
  const [run, busy] = useAction();

  useEffect(() => {
    if (!open) return;
    setErrors({});
    const source = invoice || quotation;
    const total = Number(source?.total || 0);

    // A new version starts from the billing details of the one it replaces
    const billing = invoice || replaces;
    setForm({
      billingName: billing?.billingName || lead.companyName || lead.name,
      billingGstin: billing?.billingGstin || lead.companyGstin || "",
      billingAddress: billing?.billingAddress || "",
      // Whole rupees: nobody asks a customer for ₹12,345.67
      advanceDue: String(invoice ? invoice.advanceDue : Math.round((total * DEFAULT_ADVANCE_PERCENT) / 100)),
      notes: billing?.notes || "",
      discount: String(invoice?.discount ?? 0),
      discountType: invoice?.discountType || "rupees",
      taxRate: String(invoice?.taxRate ?? 18),
    });
    setItems(invoice?.items?.map((i) => ({ description: i.description, qty: String(i.qty), rate: String(i.rate) })) || []);
  }, [open, invoice, quotation, replaces, lead]);

  if (!form) return null;

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));
  const setItem = (index, key, value) =>
    setItems((list) => list.map((it, i) => (i === index ? { ...it, [key]: value } : it)));

  // Display only; the API recalculates on save
  let total = Number(quotation?.total || 0);
  let subtotal = 0, discountAmount = 0, taxAmount = 0;
  if (editing) {
    subtotal = items.reduce((sum, i) => sum + (Number(i.qty) || 0) * (Number(i.rate) || 0), 0);
    discountAmount = form.discountType === "percentage"
      ? (subtotal * (Number(form.discount) || 0)) / 100
      : Number(form.discount) || 0;
    const afterDiscount = Math.max(0, subtotal - discountAmount);
    taxAmount = (afterDiscount * (Number(form.taxRate) || 0)) / 100;
    total = afterDiscount + taxAmount;
  }
  const advance = Number(form.advanceDue) || 0;

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.billingName.trim()) found.billingName = "Enter the name to bill";
    if (advance < 0) found.advanceDue = "The advance can't be negative";
    // total is 0 when the quotation couldn't be loaded; the API checks it then
    if (total > 0 && advance > total) found.advanceDue = `The advance can't be more than the total of ${money(total)}`;

    const validItems = items.filter((i) => i.description.trim() && Number(i.qty) > 0);
    if (editing && validItems.length === 0) found.items = "Add at least one item with a description and quantity.";

    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      billingName: form.billingName.trim(),
      billingGstin: form.billingGstin.trim(),
      billingAddress: form.billingAddress.trim(),
      advanceDue: advance,
      notes: form.notes.trim(),
    };
    // Without it the server uses the newest quotation, not the one picked
    if (!editing && quotation) payload.quotationId = quotation.id;
    if (editing) {
      payload.items = validItems.map((i) => ({ description: i.description.trim(), qty: Number(i.qty), rate: Number(i.rate) || 0 }));
      payload.discount = Number(form.discount) || 0;
      payload.discountType = form.discountType;
      payload.taxRate = Number(form.taxRate) || 0;
    }

    const saved = await run(
      () => (editing
        ? invoiceService.updateInvoice(invoice.id, payload)
        : invoiceService.createInvoice(lead.id, payload)),
      {
        success: (inv) => (editing ? `${inv.invoiceNumber} updated` : `Proforma invoice ${inv.invoiceNumber} created`),
        successDescription: (inv) => inv.pdfError || "The PDF is ready.",
      }
    );
    if (saved) {
      onSaved?.(saved);
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size={editing ? "xl" : "lg"}
      title={editing ? `Edit ${invoice.invoiceNumber}` : "Create proforma invoice"}
      description={
        editing
          ? "Only drafts can be changed. Once sent, cancel and reissue instead."
          : quotation
            ? `From ${quotation.quotationCode} v${quotation.version}, total ${money(quotation.total)}`
            : "From the current quotation"
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" type="submit" form="invoice-form" loading={busy}>
            {editing ? "Save changes" : "Create invoice"}
          </Button>
        </>
      }
    >
      <form id="invoice-form" onSubmit={submit} noValidate className="grid gap-5">
        {!editing && replaces && (
          <p className="rounded-md bg-warning-soft px-3 py-2 text-[13px] text-warning">
            This becomes the new version. {replaces.invoiceNumber} ({replaces.status}) will be marked superseded:
            it stays on record but can no longer be emailed or paid against.
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bill to" required error={errors.billingName}>
            {(p) => <Input {...p} value={form.billingName} onChange={set("billingName")} />}
          </Field>
          <Field label="GSTIN" hint="Leave empty for individual customers.">
            {(p) => (
              <Input
                {...p}
                value={form.billingGstin}
                maxLength={15}
                onChange={(e) => setForm((f) => ({ ...f, billingGstin: e.target.value.toUpperCase() }))}
              />
            )}
          </Field>
          <Field label="Billing address" className="sm:col-span-2">
            {(p) => <Textarea {...p} rows={2} value={form.billingAddress} onChange={set("billingAddress")} />}
          </Field>
        </div>

        {editing && (
          <div>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="label mb-0">Items</p>
              <Button size="sm" icon={Plus} onClick={() => setItems((l) => [...l, { description: "", qty: "1", rate: "" }])}>
                Add line
              </Button>
            </div>

            {items.length > 0 && (
              <div className="hidden grid-cols-[1fr_90px_120px_120px_36px] gap-2 px-1 pb-1 text-xs text-muted sm:grid">
                <span>Description</span>
                <span className="text-right">Qty</span>
                <span className="text-right">Rate (₹)</span>
                <span className="text-right">Amount</span>
                <span />
              </div>
            )}

            <ul className="grid gap-2">
              {items.map((item, index) => (
                <li
                  key={index}
                  className="grid grid-cols-[1fr_36px] gap-2 rounded-md border border-line p-2 sm:grid-cols-[1fr_90px_120px_120px_36px] sm:border-0 sm:p-0"
                >
                  <Input aria-label="Description" value={item.description} onChange={(e) => setItem(index, "description", e.target.value)} />
                  <Button
                    variant="ghost"
                    iconOnly
                    icon={Trash2}
                    onClick={() => setItems((l) => l.filter((_, i) => i !== index))}
                    className="sm:order-last"
                  >
                    Remove item
                  </Button>
                  <div className="col-span-2 grid grid-cols-3 gap-2 sm:contents">
                    <Input aria-label="Quantity" type="number" min={0} value={item.qty} onChange={(e) => setItem(index, "qty", e.target.value)} className="text-right" />
                    <Input aria-label="Rate" type="number" min={0} value={item.rate} onChange={(e) => setItem(index, "rate", e.target.value)} className="text-right" />
                    <span className="flex h-9 items-center justify-end text-sm text-ink">
                      {money((Number(item.qty) || 0) * (Number(item.rate) || 0))}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
            {errors.items && <p className="field-error mt-2">{errors.items}</p>}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-[1fr_260px]">
          <div className="grid content-start gap-4 sm:grid-cols-3">
            {editing && (
              <>
                <Field label="Discount type">
                  {(p) => (
                    <Select
                      {...p}
                      value={form.discountType}
                      onChange={set("discountType")}
                      options={[
                        { value: "rupees", label: "Rupees (₹)" },
                        { value: "percentage", label: "Percentage (%)" },
                      ]}
                    />
                  )}
                </Field>
                <Field label="Discount">
                  {(p) => <Input {...p} type="number" min={0} value={form.discount} onChange={set("discount")} />}
                </Field>
                <Field label="GST (%)">
                  {(p) => <Input {...p} type="number" min={0} max={100} value={form.taxRate} onChange={set("taxRate")} />}
                </Field>
              </>
            )}

            <Field
              label="Advance due (₹)"
              required
              error={errors.advanceDue}
              hint={!errors.advanceDue && total > 0 ? `${Math.round((advance / total) * 100)}% of the total` : undefined}
              className="sm:col-span-3"
            >
              {(p) => <Input {...p} type="number" min={0} value={form.advanceDue} onChange={set("advanceDue")} />}
            </Field>

            <Field label="Notes for the customer" className="sm:col-span-3">
              {(p) => <Textarea {...p} rows={2} value={form.notes} onChange={set("notes")} />}
            </Field>
          </div>

          <dl className="grid content-start gap-1.5 rounded-md bg-subtle p-4 text-sm">
            {editing && (
              <>
                <Row label="Subtotal" value={money(subtotal)} />
                {discountAmount > 0 && <Row label="Discount" value={`− ${money(discountAmount)}`} />}
                <Row label={`GST (${form.taxRate || 0}%)`} value={money(taxAmount)} />
              </>
            )}
            <div className="flex justify-between border-t border-line pt-2 font-semibold text-ink first:border-t-0 first:pt-0">
              <dt>Total</dt>
              <dd>{money(total)}</dd>
            </div>
            <Row label="Advance due" value={money(advance)} />
            <Row label="Balance at venue" value={money(Math.max(0, total - advance))} />
          </dl>
        </div>
      </form>
    </Modal>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex justify-between text-body">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}