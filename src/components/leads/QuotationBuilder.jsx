"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useAction } from "@/hooks/useAction";
import { quotationService } from "@/services/admin";
import { Button, Field, Input, Modal, Select, Skeleton, Textarea } from "@/components/ui";

const money = (n) =>
    `₹${Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const toDateInput = (v) => (v ? String(v).slice(0, 10) : "");

/** A fortnight from today, as the default validity. */
function defaultValidUntil() {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return toDateInput(d);
}

export default function QuotationBuilder({ open, lead, previous, onClose, onSaved }) {
    
    const [rateCard, setRateCard] = useState(null);
    const [items, setItems] = useState([]);
    const [discount, setDiscount] = useState("0");
    const [discountType, setDiscountType] = useState("");
    const [taxRate, setTaxRate] = useState("18");
    const [validUntil, setValidUntil] = useState(defaultValidUntil());
    const [notes, setNotes] = useState("");
    const [error, setError] = useState("");
    const [run, busy] = useAction();

    // Start from the previous version when revising, otherwise empty
    useEffect(() => {
        if (!open) return;
        setError("");
        setItems(previous?.items?.map((i) => ({ description: i.description, qty: String(i.qty), rate: String(i.rate) })) || []);
        setDiscount(String(previous?.discount ?? 0));
        setDiscountType(previous?.discountType || "rupees");
        setTaxRate(String(previous?.taxRate ?? 18));
        setValidUntil(toDateInput(previous?.validUntil) || defaultValidUntil());
        setNotes(previous?.notes || "");

        setRateCard(null);
        quotationService
            .rateCardForLead(lead.id)
            .then(setRateCard)
            .catch(() => setRateCard([]));
    }, [open, lead.id, previous]);

    const addFromRateCard = (id) => {
        const item = rateCard.find((r) => String(r.id) === String(id));
        if (!item) return;
        setItems((list) => [
            ...list,
            { description: item.name, qty: String(item.suggestedQty ?? 1), rate: String(item.rate) },
        ]);
    };

    const addBlank = () => setItems((list) => [...list, { description: "", qty: "1", rate: "" }]);

    const setItem = (index, key, value) =>
        setItems((list) => list.map((it, i) => (i === index ? { ...it, [key]: value } : it)));

    const removeItem = (index) => setItems((list) => list.filter((_, i) => i !== index));

    // Totals here are only for display; the API works them out again on save
    const subtotal = items.reduce((sum, i) => sum + (Number(i.qty) || 0) * (Number(i.rate) || 0), 0);

    const discountAmount = discountType === "percentage" ? subtotal * (Number(discount) || 0) / 100 : Number(discount) || 0;

    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (Number(taxRate) || 0) / 100;
    const total = afterDiscount + taxAmount;

    const submit = async (e) => {
        e.preventDefault();
        const valid = items.filter((i) => i.description.trim() && Number(i.qty) > 0);
        if (valid.length === 0) return setError("Add at least one item with a description and quantity.");

        const payload = {
            items: valid.map((i) => ({
                description: i.description.trim(),
                qty: Number(i.qty),
                rate: Number(i.rate) || 0,
            })),
            discountType: discountType,
            discount: Number(discount) || 0,
            taxRate: Number(taxRate) || 0,
            validUntil: validUntil || null,
            notes: notes.trim(),
        };
        
        const saved = await run(() => quotationService.createQuotation(lead.id, payload), {
            success: (q) => `Quotation ${q.quotationCode} v${q.version} created`,
            successDescription: (q) => (q.pdfError ? q.pdfError : "The PDF is ready."),
        });
        if (saved) {
            onSaved?.(saved);
            onClose();
        }
    };

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="xl"
            title={previous ? `Revise quotation (v${previous.version + 1})` : "Create quotation"}
            description={`${lead.name} · ${lead.guests || "?"} guests at ${lead.locationName}`}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
                    <Button variant="primary" type="submit" form="quotation-form" loading={busy}>
                        {previous ? "Save new version" : "Create quotation"}
                    </Button>
                </>
            }
        >
            <form id="quotation-form" onSubmit={submit} noValidate className="grid gap-5">
                {/* Rate card picker */}
                <div>
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                        <p className="label mb-0">Items</p>
                        {!lead.eventDate && (
                            <p className="meta">No event date set, so base rates are shown.</p>
                        )}
                    </div>

                    {rateCard === null ? (
                        <Skeleton className="h-10" />
                    ) : (
                        <div className="mb-3 flex flex-wrap items-center gap-2">
                            <Select
                                aria-label="Add from rate card"
                                value=""
                                onChange={(e) => e.target.value && addFromRateCard(e.target.value)}
                                placeholder={rateCard.length ? "Add from rate card" : "No rate card for this location"}
                                disabled={rateCard.length === 0}
                                options={rateCard
                                    .filter((r) => !r.blocked)
                                    .map((r) => ({
                                        value: String(r.id),
                                        label: `${r.name} — ${money(r.rate)}${r.unit === "per_guest" ? " per guest" : ""}`,
                                    }))}
                                className="w-auto"
                            />
                            <Button size="sm" icon={Plus} onClick={addBlank}>Add blank line</Button>
                        </div>
                    )}

                    {/* Column headings, desktop only */}
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
                                <Input
                                    aria-label="Description"
                                    value={item.description}
                                    onChange={(e) => setItem(index, "description", e.target.value)}
                                    placeholder="Item description"
                                />
                                <Button
                                    variant="ghost"
                                    iconOnly
                                    icon={Trash2}
                                    onClick={() => removeItem(index)}
                                    className="sm:order-last"
                                >
                                    Remove item
                                </Button>
                                <div className="col-span-2 grid grid-cols-3 gap-2 sm:contents">
                                    <Input
                                        aria-label="Quantity"
                                        type="number"
                                        min={0}
                                        value={item.qty}
                                        onChange={(e) => setItem(index, "qty", e.target.value)}
                                        className="text-right"
                                    />
                                    <Input
                                        aria-label="Rate"
                                        type="number"
                                        min={0}
                                        value={item.rate}
                                        onChange={(e) => setItem(index, "rate", e.target.value)}
                                        className="text-right"
                                    />
                                    <span className="flex h-9 items-center justify-end text-sm text-ink">
                                        {money((Number(item.qty) || 0) * (Number(item.rate) || 0))}
                                    </span>
                                </div>
                            </li>
                        ))}
                    </ul>

                    {items.length === 0 && (
                        <p className="rounded-md border border-dashed border-line px-3 py-6 text-center text-sm text-muted">
                            Pick something from the rate card, or add a blank line.
                        </p>
                    )}

                    {error && <p className="field-error mt-2">{error}</p>}
                </div>

                {/* Terms and totals */}
                <div className="grid gap-4 sm:grid-cols-[1fr_260px]">
                    <div className="grid gap-4 sm:grid-cols-3">

                        {/* discount in rupees and percentage dropdown selection*/}
                        <Field label="Discount type">
                            {(p) => (
                                <Select
                                    {...p}
                                    value={discountType}
                                    onChange={(e) => setDiscountType(e.target.value)}
                                    options={[
                                        { value: "rupees", label: "Rupees (₹)" },
                                        { value: "percentage", label: "Percentage (%)" },
                                    ]}
                                />
                            )}
                        </Field>


                        <Field label="Discount">
                            {(p) => <Input {...p} type="number" min={0} value={discount} onChange={(e) => setDiscount(e.target.value)} />}
                        </Field>

                        <Field label="GST (%)">
                            {(p) => <Input {...p} type="number" min={0} max={100} value={taxRate} onChange={(e) => setTaxRate(e.target.value)} />}
                        </Field>

                        <Field label="Valid until">
                            {(p) => <Input {...p} type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} />}
                        </Field>

                        <Field label="Notes for the customer" className="sm:col-span-3">
                            {(p) => (
                                <Textarea
                                    {...p}
                                    rows={2}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    placeholder="Rates valid for the date and guest count shown."
                                />
                            )}
                        </Field>
                    </div>

                    <dl className="grid content-start gap-1.5 rounded-md bg-subtle p-4 text-sm">
                        <Row label="Subtotal" value={money(subtotal)} />
                        {discountAmount > 0 && (
                            <Row
                                label={discountType === "percentage" ? `Discount (${discount}%)` : "Discount"}
                                value={`− ${money(discountAmount)}`}
                            />
                        )}
                        <Row label={`GST (${taxRate || 0}%)`} value={money(taxAmount)} />
                        <div className="mt-1 flex justify-between border-t border-line pt-2 text-[15px] font-semibold text-ink">
                            <dt>Total</dt>
                            <dd>{money(total)}</dd>
                        </div>
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