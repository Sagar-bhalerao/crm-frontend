"use client";

import { useEffect, useState } from "react";
import { LEAD_SOURCES, LEAD_TYPES, REQUIREMENTS, TIME_SLOTS, leadTypeNeeds } from "@/config/leadOptions";
import { orgService } from "@/services";
import { toDateInput } from "@/lib/format";
import { cx } from "@/lib/utils";
import { ChipGroup, Field, Input, Select, Textarea } from "@/components/ui";

export const EMPTY_LEAD = {
  type: "birthday_party",
  outletId: "",
  source: "phone",
  assignedToId: "",
  customer: { name: "", mobile: "", email: "" },
  company: { name: "", gstin: "", contactPerson: "", designation: "" },
  event: { date: "", timeSlot: "evening", guests: "", kids: "", celebrantName: "", celebrantAge: "", requirements: [], remarks: "" },
};

/** Convert a saved lead to form values. */
export function leadToForm(lead) {
  return {
    ...EMPTY_LEAD,
    type: lead.type,
    outletId: lead.outletId,
    source: lead.source,
    customer: { ...lead.customer },
    company: { ...EMPTY_LEAD.company, ...(lead.company || {}) },
    event: { ...lead.event, date: toDateInput(lead.event.date), celebrantAge: lead.event.celebrantAge ?? "" },
  };
}

export function validateLead(v) {
  const e = {};
  if (!v.outletId) e.outletId = "Choose an outlet";
  if (!v.customer.name.trim()) e["customer.name"] = "Enter the customer's name";
  if (v.customer.mobile.replace(/\D/g, "").length !== 10) e["customer.mobile"] = "Enter a 10-digit mobile number";
  if (!/^\S+@\S+\.\S+$/.test(v.customer.email)) e["customer.email"] = "Enter a valid email address";
  if (leadTypeNeeds(v.type, "company") && !v.company.name.trim()) e["company.name"] = "Enter the company name";
  if (!v.event.date) e["event.date"] = "Choose the event date";
  if (!(Number(v.event.guests) > 0)) e["event.guests"] = "Enter the number of guests";
  return e;
}

/**
 * Lead form used for: manual lead creation, editing, and the website enquiry simulator.
 *   mode="create"  shows source + assignment
 *   mode="edit"    outlet is fixed
 *   mode="website" mirrors the public website form
 */
export default function LeadForm({ id, mode = "create", value, onChange, errors = {}, outlets = [], canAssign = false, onSubmit }) {
  const [assignees, setAssignees] = useState([]);
  const set = (path, val) => {
    const [group, key] = path.split(".");
    onChange(key ? { ...value, [group]: { ...value[group], [key]: val } } : { ...value, [group]: val });
  };
  const bind = (path) => {
    const [group, key] = path.split(".");
    return {
      value: key ? value[group][key] ?? "" : value[group] ?? "",
      onChange: (e) => set(path, e.target.value),
    };
  };

  useEffect(() => {
    if (mode !== "create" || !canAssign || !value.outletId) return;
    orgService.listAssignees(value.outletId).then(setAssignees).catch(() => setAssignees([]));
  }, [mode, canAssign, value.outletId]);

  const needsCompany = leadTypeNeeds(value.type, "company");
  const isBirthday = leadTypeNeeds(value.type, "celebrant");

  return (
    <form
      id={id}
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit?.();
      }}
      className="grid gap-6"
    >
      <FormSection title="Enquiry">
        <div className="sm:col-span-2">
          <p className="label" id={`${id}-type`}>Lead type</p>
          <div role="radiogroup" aria-labelledby={`${id}-type`} className="grid grid-cols-3 gap-1 rounded-md border border-line-strong bg-subtle p-1">
            {LEAD_TYPES.map((t) => (
              <button
                key={t.key}
                type="button"
                role="radio"
                aria-checked={value.type === t.key}
                onClick={() => set("type", t.key)}
                className={cx(
                  "h-8 rounded text-[13px] font-medium cursor-pointer transition-colors",
                  value.type === t.key ? "bg-surface text-ink shadow-[0_1px_2px_rgba(21,32,51,0.12)]" : "text-muted hover:text-ink"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <Field label="Outlet" required error={errors.outletId}>
          {(p) => (
            <Select
              {...p}
              {...bind("outletId")}
              onChange={(e) => onChange({ ...value, outletId: e.target.value, assignedToId: "" })}
              disabled={mode === "edit"}
              placeholder="Choose outlet"
              options={outlets.map((o) => ({ value: o.id, label: o.name }))}
            />
          )}
        </Field>

        {mode === "create" && (
          <Field label="Source">
            {(p) => (
              <Select {...p} {...bind("source")} options={LEAD_SOURCES.filter((s) => s.manual).map((s) => ({ value: s.key, label: s.label }))} />
            )}
          </Field>
        )}

        {mode === "create" && canAssign && (
          <Field label="Assign to" hint="Automatic picks the outlet Sales POC with the fewest open leads.">
            {(p) => (
              <Select
                {...p}
                {...bind("assignedToId")}
                disabled={!value.outletId}
                placeholder="Assign automatically"
                options={assignees.map((u) => ({ value: u.id, label: `${u.name} (${u.roleLabel})` }))}
              />
            )}
          </Field>
        )}
      </FormSection>

      <FormSection title="Customer">
        <Field label="Full name" required error={errors["customer.name"]}>
          {(p) => <Input {...p} {...bind("customer.name")} autoComplete="name" />}
        </Field>
        <Field label="Mobile number" required error={errors["customer.mobile"]}>
          {(p) => <Input {...p} {...bind("customer.mobile")} type="tel" inputMode="numeric" maxLength={14} placeholder="10-digit mobile" />}
        </Field>
        <Field label="Email" required error={errors["customer.email"]} className="sm:col-span-2">
          {(p) => <Input {...p} {...bind("customer.email")} type="email" autoComplete="email" />}
        </Field>
      </FormSection>

      {needsCompany && (
        <FormSection title="Company" description="Needed for corporate quotations and GST invoices.">
          <Field label="Company name" required error={errors["company.name"]}>
            {(p) => <Input {...p} {...bind("company.name")} autoComplete="organization" />}
          </Field>
          <Field label="GSTIN" hint="Optional">
            {(p) => <Input {...p} {...bind("company.gstin")} maxLength={15} className="uppercase" />}
          </Field>
          <Field label="Contact designation">
            {(p) => <Input {...p} {...bind("company.designation")} placeholder="e.g. HR Manager" />}
          </Field>
        </FormSection>
      )}

      <FormSection title="Event">
        <Field label="Preferred date" required error={errors["event.date"]}>
          {(p) => <Input {...p} {...bind("event.date")} type="date" />}
        </Field>
        <Field label="Preferred time">
          {(p) => <Select {...p} {...bind("event.timeSlot")} options={TIME_SLOTS.map((t) => ({ value: t.key, label: t.label }))} />}
        </Field>
        <Field label="Number of guests" required error={errors["event.guests"]}>
          {(p) => <Input {...p} {...bind("event.guests")} type="number" min={1} inputMode="numeric" />}
        </Field>
        {isBirthday && (
          <>
            <Field label="Kids among guests">
              {(p) => <Input {...p} {...bind("event.kids")} type="number" min={0} inputMode="numeric" />}
            </Field>
            <Field label="Birthday of">
              {(p) => <Input {...p} {...bind("event.celebrantName")} placeholder="Name" />}
            </Field>
            <Field label="Turning">
              {(p) => <Input {...p} {...bind("event.celebrantAge")} type="number" min={1} inputMode="numeric" placeholder="Age" />}
            </Field>
          </>
        )}
        <div className="sm:col-span-2">
          <p className="label">Requirements</p>
          <ChipGroup label="Requirements" options={REQUIREMENTS} value={value.event.requirements} onChange={(v) => set("event.requirements", v)} />
        </div>
        <Field label="Remarks" className="sm:col-span-2">
          {(p) => <Textarea {...p} {...bind("event.remarks")} rows={3} placeholder="Anything the customer mentioned" />}
        </Field>
      </FormSection>
    </form>
  );
}

function FormSection({ title, description, children }) {
  return (
    <fieldset className="min-w-0">
      <legend className="mb-3">
        <span className="section-title">{title}</span>
        {description && <span className="meta block">{description}</span>}
      </legend>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </fieldset>
  );
}
