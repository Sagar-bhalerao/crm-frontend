"use client";

import { Field, Input, Select, Textarea } from "@/components/ui";

/**
 * The one lead form, for every brand: the New lead page and the add/edit
 * dialog both use it. Values match the API's field names, so turning the
 * form into a request is a straight copy (see formToPayload).
 */
export const EMPTY_LEAD = {
  brandId: "", // only narrows the location list; the API takes the brand from the location
  locationId: "",
  leadType: "",
  source: "phone",
  firstName: "",
  lastName: "",
  mobile: "",
  email: "",
  companyName: "",
  companyGstin: "",
  eventDate: "",
  eventTimeSlot: "",
  guests: "",
  kids: "",
  remarks: "",
};

const LEAD_TYPE_MAX = 30;

/** A saved lead (from the API) as form values. */
export function leadToForm(lead) {
  return {
    ...EMPTY_LEAD,
    brandId: String(lead.brandId ?? ""),
    locationId: String(lead.locationId ?? ""),
    leadType: lead.leadType || "",
    source: lead.source || "phone",
    firstName: lead.firstName || "",
    lastName: lead.lastName || "",
    mobile: lead.mobile || "",
    email: lead.email || "",
    companyName: lead.companyName || "",
    companyGstin: lead.companyGstin || "",
    eventDate: lead.eventDate ? String(lead.eventDate).slice(0, 10) : "",
    eventTimeSlot: lead.eventTimeSlot || "",
    guests: lead.guests ?? "",
    kids: lead.kids ?? "",
    remarks: lead.remarks || "",
  };
}

export function validateLead(v) {
  const e = {};
  if (!v.locationId) e.locationId = "Choose a location";
  const type = v.leadType.trim();
  if (type.length < 2) e.leadType = "Enter the lead type";
  else if (type.length > LEAD_TYPE_MAX) e.leadType = `Keep it under ${LEAD_TYPE_MAX} characters`;
  if (v.firstName.trim().length < 2) e.firstName = "Enter the customer's name";
  if (!/^[0-9+\- ]{10,20}$/.test(v.mobile.trim())) e.mobile = "Enter a valid mobile number";
  if (v.email.trim() && !/^\S+@\S+\.\S+$/.test(v.email.trim())) e.email = "Enter a valid email address";
  if (v.companyGstin.trim() && v.companyGstin.trim().length !== 15) e.companyGstin = "A GSTIN has 15 characters";
  if (v.guests !== "" && !(Number(v.guests) > 0)) e.guests = "Enter a number above 0";
  return e;
}

/** Form values as the request body. Source is only set when the lead is created. */
export function formToPayload(v, { isEdit = false } = {}) {
  const payload = {
    locationId: Number(v.locationId),
    leadType: v.leadType.trim(),
    firstName: v.firstName.trim(),
    lastName: v.lastName.trim(),
    mobile: v.mobile.trim(),
    email: v.email.trim(),
    companyName: v.companyName.trim(),
    companyGstin: v.companyGstin.trim().toUpperCase(),
    eventDate: v.eventDate || null,
    eventTimeSlot: v.eventTimeSlot,
    guests: v.guests === "" ? null : Number(v.guests),
    kids: v.kids === "" ? null : Number(v.kids),
    remarks: v.remarks.trim(),
  };
  if (!isEdit) payload.source = v.source;
  return payload;
}

/** Brands present in the location list, in the order they first appear. */
export function brandsOf(locations) {
  const seen = new Map();
  for (const l of locations) if (!seen.has(l.brandId)) seen.set(l.brandId, l.brandName);
  return [...seen].map(([id, name]) => ({ id, name }));
}

/**
 * locations: [{ id, name, brandId, brandName }] the user may add leads for,
 * from GET /leads/options. options: { sources, timeSlots } from the same call.
 */
export default function LeadForm({ id, mode = "create", value, onChange, errors = {}, locations = [], options = {}, onSubmit }) {
  const brands = brandsOf(locations);
  const brandLocations = value.brandId
    ? locations.filter((l) => String(l.brandId) === String(value.brandId))
    : locations;

  const bind = (key) => ({
    value: value[key] ?? "",
    onChange: (e) => onChange({ ...value, [key]: e.target.value }),
  });

  // Changing brand clears a location from the old brand
  const setBrand = (e) => {
    const brandId = e.target.value;
    const keep = locations.some((l) => String(l.id) === String(value.locationId) && String(l.brandId) === brandId);
    onChange({ ...value, brandId, locationId: keep ? value.locationId : "" });
  };

  // Picking a location also settles the brand, so the two never disagree
  const setLocation = (e) => {
    const loc = locations.find((l) => String(l.id) === e.target.value);
    onChange({ ...value, locationId: e.target.value, brandId: loc ? String(loc.brandId) : value.brandId });
  };

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
        <Field label="Brand" required>
          {(p) => (
            <Select
              {...p}
              value={value.brandId}
              onChange={setBrand}
              placeholder="Choose brand"
              options={brands.map((b) => ({ value: String(b.id), label: b.name }))}
            />
          )}
        </Field>

        <Field
          label="Location"
          required
          error={errors.locationId}
          hint={locations.length === 0 ? "No locations are assigned to you. Ask an admin to add one." : undefined}
        >
          {(p) => (
            <Select
              {...p}
              value={value.locationId}
              onChange={setLocation}
              disabled={brands.length > 1 && !value.brandId}
              placeholder={brands.length > 1 && !value.brandId ? "Choose a brand first" : "Choose location"}
              options={brandLocations.map((l) => ({ value: String(l.id), label: l.name }))}
            />
          )}
        </Field>

        <Field
          label="Lead type"
          required
          error={errors.leadType}
          hint={!errors.leadType ? `${value.leadType.length}/${LEAD_TYPE_MAX}` : undefined}
        >
          {(p) => (
            <Input {...p} {...bind("leadType")} maxLength={LEAD_TYPE_MAX} placeholder="e.g. Birthday party, Corporate event" />
          )}
        </Field>

        {mode === "create" && (
          <Field label="Source" hint="Where this enquiry came from.">
            {(p) => (
              <Select
                {...p}
                {...bind("source")}
                options={(options.sources || []).map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
              />
            )}
          </Field>
        )}
      </FormSection>

      <FormSection title="Customer">
        <Field label="First name" required error={errors.firstName}>
          {(p) => <Input {...p} {...bind("firstName")} autoComplete="given-name" />}
        </Field>
        <Field label="Last name">
          {(p) => <Input {...p} {...bind("lastName")} autoComplete="family-name" />}
        </Field>
        <Field label="Mobile" required error={errors.mobile}>
          {(p) => <Input {...p} {...bind("mobile")} type="tel" inputMode="tel" maxLength={20} placeholder="98200 12345" />}
        </Field>
        <Field label="Email" error={errors.email} hint={!errors.email ? "Needed to email quotations and invoices." : undefined}>
          {(p) => <Input {...p} {...bind("email")} type="email" autoComplete="email" />}
        </Field>
      </FormSection>

      <FormSection title="Company" description="Optional. For corporate bookings and GST invoices.">
        <Field label="Company name">
          {(p) => <Input {...p} {...bind("companyName")} autoComplete="organization" />}
        </Field>
        <Field label="GSTIN" error={errors.companyGstin}>
          {(p) => <Input {...p} {...bind("companyGstin")} maxLength={15} className="uppercase" />}
        </Field>
      </FormSection>

      <FormSection title="Event">
        <Field label="Event date">
          {(p) => <Input {...p} {...bind("eventDate")} type="date" />}
        </Field>
        <Field label="Preferred time">
          {(p) => (
            <Select
              {...p}
              {...bind("eventTimeSlot")}
              placeholder="Any time"
              options={(options.timeSlots || []).map((t) => ({ value: t.key, label: t.label }))}
            />
          )}
        </Field>
        <Field label="Guests" error={errors.guests}>
          {(p) => <Input {...p} {...bind("guests")} type="number" min={1} inputMode="numeric" />}
        </Field>
        <Field label="Kids among guests">
          {(p) => <Input {...p} {...bind("kids")} type="number" min={0} inputMode="numeric" />}
        </Field>
        <Field label="Remarks" className="sm:col-span-2">
          {(p) => <Textarea {...p} {...bind("remarks")} rows={3} placeholder="Anything the customer mentioned" />}
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