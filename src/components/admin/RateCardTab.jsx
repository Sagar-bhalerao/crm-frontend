"use client";

import { useEffect, useState } from "react";
import { Copy, IndianRupee, Pencil, Plus, Power, PowerOff, Trash2 } from "lucide-react";
import { P } from "@/config/permissions";
import { useAuth } from "@/context/AuthContext";
import { useAction } from "@/hooks/useAction";
import { leadService, locationService, rateCardService } from "@/services/admin";
import {
    Button, ConfirmDialog, DropdownMenu, EmptyState, ErrorState, Field,
    Input, Modal, Panel, Select, Skeleton, StatusBadge, Textarea,
} from "@/components/ui";
import { cx } from "@/lib/utils";
import { formatDate } from "@/lib/format";

const STATUS_OPTIONS = [
    { value: "1", label: "Active" },
    { value: "0", label: "Inactive" },
];
const toDateInput = (v) => (v ? String(v).slice(0, 10) : "");

const WEEKDAYS = [
    { value: "1", label: "Mon" }, { value: "2", label: "Tue" }, { value: "3", label: "Wed" },
    { value: "4", label: "Thu" }, { value: "5", label: "Fri" }, { value: "6", label: "Sat" },
    { value: "7", label: "Sun" },
];
const money = (n) => `₹${Number(n).toLocaleString("en-IN")}`;

export default function RateCardTab() {
    const { can } = useAuth();
    const canManage = can(P.SETTINGS_MANAGE);

    const [locations, setLocations] = useState([]);
    const [locationId, setLocationId] = useState("");
    const [options, setOptions] = useState({ categories: [], units: [] });
    const [leadTypes, setLeadTypes] = useState([]);
    const [items, setItems] = useState(null);
    const [error, setError] = useState(null);
    const [form, setForm] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [copying, setCopying] = useState(false);
    const [run, busy] = useAction();

    // Locations and the dropdown values, once
    useEffect(() => {
        locationService.listLocations({ status: 1, pageSize: 100, sort: "name:asc" }).then((r) => {
            setLocations(r.items);
            setLocationId((current) => current || String(r.items[0]?.id || ""));
        });
        rateCardService.getOptions().then(setOptions).catch(() => { });
        leadService.getOptions().then((o) => setLeadTypes(o.types || [])).catch(() => { });
    }, []);

    const load = async () => {
        if (!locationId) return;
        setError(null);
        setItems(null);
        try {
            setItems(await rateCardService.listRateCards({ locationId }));
        } catch (err) {
            setError(err);
        }
    };

    useEffect(() => {
        load();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [locationId]);

    const label = (list, key, fallback = "All types") => list.find((x) => x.key === key)?.label || fallback;

    const toggleStatus = async (item) => {
        const next = item.status === 1 ? 0 : 1;
        const ok = await run(() => rateCardService.setRateCardStatus(item.id, next), {
            success: next === 1 ? "Item activated" : "Item deactivated",
        });
        if (ok) load();
    };

    const confirmDelete = async () => {
        const ok = await run(() => rateCardService.deleteRateCard(deleting.id), { success: "Item deleted" });
        setDeleting(null);
        if (ok) load();
    };

    const menu = (item) => [
        canManage && { key: "edit", label: "Edit item", icon: Pencil, onClick: () => setForm({ item }) },
        canManage && {
            key: "status",
            label: item.status === 1 ? "Deactivate" : "Activate",
            icon: item.status === 1 ? PowerOff : Power,
            onClick: () => toggleStatus(item),
            separator: true,
        },
        canManage && { key: "delete", label: "Delete item", icon: Trash2, tone: "danger", onClick: () => setDeleting(item) },
    ];

    // Group by category so the list reads like a menu
    const grouped = items
        ? options.categories
            .map((c) => ({ ...c, items: items.filter((i) => i.category === c.key) }))
            .filter((g) => g.items.length > 0)
        : [];

    return (
        <div className="grid gap-4">
            <Panel
                title="Rate card"
                description="What this location sells, and the starting price. A Sales POC can change the price on any quotation."
                bodyClassName="p-0"
                actions={
                    <div className="flex items-center gap-2">
                        <Select
                            aria-label="Location"
                            value={locationId}
                            onChange={(e) => setLocationId(e.target.value)}
                            options={locations.map((l) => ({ value: String(l.id), label: l.name }))}
                            className="w-auto"
                        />
                        {canManage && (
                            <>
                                <Button size="sm" icon={Copy} onClick={() => setCopying(true)}>Copy</Button>
                                <Button size="sm" variant="primary" icon={Plus} onClick={() => setForm({ item: null })}>Add item</Button>
                            </>
                        )}
                    </div>
                }
            >
                {error ? (
                    <ErrorState error={error} onRetry={load} />
                ) : !items ? (
                    <div className="grid gap-2 p-4">{Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}</div>
                ) : items.length === 0 ? (
                    <EmptyState
                        icon={IndianRupee}
                        title="No items for this location yet"
                        description="Add the packages and add-ons this outlet sells, or copy them from another location."
                        action={canManage && <Button size="sm" variant="primary" onClick={() => setForm({ item: null })}>Add item</Button>}
                    />
                ) : (
                    <div className="divide-y divide-line">
                        {grouped.map((group) => (
                            <div key={group.key}>
                                <p className="bg-subtle px-4 py-2 text-xs font-semibold text-ink">{group.label}</p>
                                <ul className="divide-y divide-line">
                                    {group.items.map((item) => (
                                        <li key={item.id} className="flex items-start justify-between gap-3 px-4 py-3">
                                            <div className="min-w-0">
                                                <p className="flex flex-wrap items-center gap-2">
                                                    <span className="font-medium text-ink">{item.name}</span>
                                                    {item.status !== 1 && <StatusBadge status={item.status} />}
                                                </p>
                                                <p className="meta">
                                                    {label(options.units, item.unit, "")} · {label(leadTypes, item.leadType)}
                                                    {item.days?.length ? ` · ${item.days.map((d) => WEEKDAYS[d - 1].label).join(", ")}` : ""}
                                                    {item.visitFrom ? ` · from ${formatDate(item.visitFrom)}` : ""}
                                                    {item.visitTo ? ` to ${formatDate(item.visitTo)}` : ""}
                                                    {item.priority ? ` · priority ${item.priority}` : ""}
                                                </p>
                                                {item.description && <p className="meta mt-0.5">{item.description}</p>}
                                            </div>
                                            <div className="flex shrink-0 items-center gap-2">
                                                <span className="text-sm font-semibold text-ink">{money(item.rate)}</span>
                                                <DropdownMenu items={menu(item)} label={`Actions for ${item.name}`} />
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                )}
            </Panel>

            <RateCardDialog
                state={form}
                locationId={locationId}
                options={options}
                leadTypes={leadTypes}
                onClose={() => setForm(null)}
                onSaved={load}
            />

            <CopyDialog
                open={copying}
                locations={locations}
                toLocationId={locationId}
                onClose={() => setCopying(false)}
                onSaved={load}
            />

            <ConfirmDialog
                open={Boolean(deleting)}
                title={`Delete ${deleting?.name}?`}
                description="Quotations already created keep the price they were built with. Deactivate instead to stop offering it."
                confirmLabel="Delete item"
                tone="danger"
                loading={busy}
                onConfirm={confirmDelete}
                onClose={() => setDeleting(null)}
            />
        </div>
    );
}

function RateCardDialog({ state, locationId, options, leadTypes, onClose, onSaved }) {
    const EMPTY = {
        name: "", code: "", leadType: "", category: "package", unit: "per_guest",
        rate: "", minQty: "", description: "", sortOrder: "0", status: "1",
        visitFrom: "", visitTo: "", bookingFrom: "", bookingTo: "",
        days: [], priority: "0",
    };
    const [form, setForm] = useState(EMPTY);
    const [errors, setErrors] = useState({});
    const [run, busy] = useAction();
    const item = state?.item;

    useEffect(() => {
        if (!state) return;
        setErrors({});
        setForm(
            item
                ? {
                    name: item.name || "",
                    code: item.code || "",
                    leadType: item.leadType || "",
                    category: item.category,
                    unit: item.unit,
                    rate: String(item.rate ?? ""),
                    minQty: item.minQty ?? "",
                    description: item.description || "",
                    sortOrder: String(item.sortOrder ?? 0),
                    status: String(item.status),
                    visitFrom: toDateInput(item.visitFrom),
                    visitTo: toDateInput(item.visitTo),
                    bookingFrom: toDateInput(item.bookingFrom),
                    bookingTo: toDateInput(item.bookingTo),
                    days: (item.days || []).map(String),
                    priority: String(item.priority ?? 0),
                }
                : EMPTY
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state]);

    const set = (key) => (e) => {
        setForm((f) => ({ ...f, [key]: e.target.value }));
        setErrors((p) => ({ ...p, [key]: undefined }));
    };

    const submit = async (e) => {
        e.preventDefault();
        const found = {};
        if (form.name.trim().length < 2) found.name = "Enter a name";
        if (form.rate === "" || Number(form.rate) < 0) found.rate = "Enter the rate";
        setErrors(found);
        if (Object.keys(found).length) return;

        const payload = {
            name: form.name.trim(),
            code: form.code.trim(),
            leadType: form.leadType || null,
            category: form.category,
            unit: form.unit,
            rate: Number(form.rate),
            minQty: form.minQty === "" ? null : Number(form.minQty),
            description: form.description.trim(),
            sortOrder: Number(form.sortOrder) || 0,
            status: Number(form.status),
            visitFrom: form.visitFrom || null,
            visitTo: form.visitTo || null,
            bookingFrom: form.bookingFrom || null,
            bookingTo: form.bookingTo || null,
            days: form.days.map(Number),
            priority: Number(form.priority) || 0,
        };
        if (!item) payload.locationId = Number(locationId);

        const saved = await run(
            () => (item ? rateCardService.updateRateCard(item.id, payload) : rateCardService.createRateCard(payload)),
            { success: item ? "Item updated" : "Item added" }
        );
        if (saved) {
            onSaved();
            onClose();
        }
    };

    const unitHint = options.units.find((u) => u.key === form.unit)?.hint;

    return (
        <Modal
            open={Boolean(state)}
            onClose={onClose}
            size="lg"
            title={item ? `Edit ${item.name}` : "Add rate card item"}
            description="This is the starting price. It can be changed on any quotation."
            footer={
                <>
                    <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
                    <Button variant="primary" type="submit" form="rate-form" loading={busy}>
                        {item ? "Save changes" : "Add item"}
                    </Button>
                </>
            }
        >
            <form id="rate-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" required error={errors.name} className="sm:col-span-2">
                    {(p) => <Input {...p} value={form.name} onChange={set("name")} placeholder="Birthday package, per guest" />}
                </Field>

                <Field label="Category">
                    {(p) => (
                        <Select {...p} value={form.category} onChange={set("category")}
                            options={options.categories.map((c) => ({ value: c.key, label: c.label }))} />
                    )}
                </Field>

                <Field label="Offer for" hint="Leave empty to offer it for every lead type.">
                    {(p) => (
                        <Select {...p} value={form.leadType} onChange={set("leadType")} placeholder="All lead types"
                            options={leadTypes.map((t) => ({ value: t.key, label: t.label }))} />
                    )}
                </Field>

                <Field label="Unit" hint={unitHint}>
                    {(p) => (
                        <Select {...p} value={form.unit} onChange={set("unit")}
                            options={options.units.map((u) => ({ value: u.key, label: u.label }))} />
                    )}
                </Field>

                <Field label="Rate (₹)" required error={errors.rate}>
                    {(p) => <Input {...p} type="number" min={0} step="0.01" value={form.rate} onChange={set("rate")} />}
                </Field>

                <Field label="Minimum quantity" hint="Optional, e.g. 20 guests.">
                    {(p) => <Input {...p} type="number" min={0} value={form.minQty} onChange={set("minQty")} />}
                </Field>

                <Field label="Sort order" hint="Lower numbers appear first.">
                    {(p) => <Input {...p} type="number" min={0} value={form.sortOrder} onChange={set("sortOrder")} />}
                </Field>

                <Field label="Code" hint="Optional internal reference.">
                    {(p) => <Input {...p} value={form.code} onChange={set("code")} className="uppercase" />}
                </Field>

                <Field label="Status">
                    {(p) => <Select {...p} value={form.status} onChange={set("status")} options={STATUS_OPTIONS} />}
                </Field>

                <Field label="Description" className="sm:col-span-2">
                    {(p) => <Textarea {...p} rows={2} value={form.description} onChange={set("description")} placeholder="What the package includes" />}
                </Field>
                <div className="sm:col-span-2 border-t border-line pt-4">
                    <p className="label mb-1">When this price applies</p>
                    <p className="meta mb-3">
                        Leave everything empty for the normal price. Add a second row with the same name for weekend or
                        festival pricing, and give it a higher priority.
                    </p>
                </div>

                <Field label="Event date from" hint="When the party happens.">
                    {(p) => <Input {...p} type="date" value={form.visitFrom} onChange={set("visitFrom")} />}
                </Field>

                <Field label="Event date to" error={errors.visitTo}>
                    {(p) => <Input {...p} type="date" value={form.visitTo} onChange={set("visitTo")} />}
                </Field>

                <Field label="Booked from" hint="When the customer books. For early-bird pricing.">
                    {(p) => <Input {...p} type="date" value={form.bookingFrom} onChange={set("bookingFrom")} />}
                </Field>

                <Field label="Booked to" error={errors.bookingTo}>
                    {(p) => <Input {...p} type="date" value={form.bookingTo} onChange={set("bookingTo")} />}
                </Field>

                <Field label="Days" hint="Leave all unticked for every day." className="sm:col-span-2">
                    {() => (
                        <div className="flex flex-wrap gap-2">
                            {WEEKDAYS.map((d) => {
                                const on = form.days.includes(d.value);
                                return (
                                    <button
                                        key={d.value}
                                        type="button"
                                        onClick={() =>
                                            setForm((f) => ({
                                                ...f,
                                                days: on ? f.days.filter((x) => x !== d.value) : [...f.days, d.value],
                                            }))
                                        }
                                        className={cx("chip cursor-pointer", on && "chip-on")}
                                    >
                                        {d.label}
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </Field>

                <Field label="Priority" hint="Higher wins when two prices match the same date.">
                    {(p) => <Input {...p} type="number" min={0} max={100} value={form.priority} onChange={set("priority")} />}
                </Field>
            </form>
        </Modal>
    );
}

/** Copies another location's items into this one, skipping duplicates by name. */
function CopyDialog({ open, locations, toLocationId, onClose, onSaved }) {
    const [fromId, setFromId] = useState("");
    const [run, busy] = useAction();

    useEffect(() => {
        if (open) setFromId("");
    }, [open]);

    const submit = async (e) => {
        e.preventDefault();
        if (!fromId) return;
        const ok = await run(() => rateCardService.copyRateCard(Number(fromId), Number(toLocationId)), {
            success: (r) => `${r.copied} item${r.copied === 1 ? "" : "s"} copied`,
        });
        if (ok) {
            onSaved();
            onClose();
        }
    };

    const target = locations.find((l) => String(l.id) === String(toLocationId));

    return (
        <Modal
            open={open}
            onClose={onClose}
            size="sm"
            title="Copy rate card"
            description={target ? `Items will be added to ${target.name}.` : undefined}
            footer={
                <>
                    <Button variant="secondary" onClick={onClose}>Cancel</Button>
                    <Button variant="primary" type="submit" form="copy-form" loading={busy} disabled={!fromId}>Copy items</Button>
                </>
            }
        >
            <form id="copy-form" onSubmit={submit} noValidate>
                <Field label="Copy from" hint="Items with a name that already exists here are skipped.">
                    {(p) => (
                        <Select
                            {...p}
                            value={fromId}
                            onChange={(e) => setFromId(e.target.value)}
                            placeholder="Choose location"
                            options={locations
                                .filter((l) => String(l.id) !== String(toLocationId))
                                .map((l) => ({ value: String(l.id), label: l.name }))}
                        />
                    )}
                </Field>
            </form>
        </Modal>
    );
}