"use client";

import { useEffect, useState } from "react";
import { useAction } from "@/hooks/useAction";
import { leadService } from "@/services/admin";
import { Button, Field, Input, Modal, Select, Textarea } from "@/components/ui";

const EMPTY = {
  locationId: "", firstName: "", lastName: "", mobile: "", email: "",
  leadType: "", source: "phone", eventDate: "", eventTimeSlot: "",
  guests: "", kids: "", requirements: "", remarks: "",
  companyName: "", companyGstin: "",
};

/** Turns an ISO date into the yyyy-mm-dd a date input needs. */
const toDateInput = (value) => (value ? String(value).slice(0, 10) : "");

export default function LeadFormDialog({ open, lead, options, locations = [], onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [run, busy] = useAction();
  const isEdit = Boolean(lead);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      lead
        ? {
            locationId: String(lead.locationId ?? ""),
            firstName: lead.firstName || "",
            lastName: lead.lastName || "",
            mobile: lead.mobile || "",
            email: lead.email || "",
            leadType: lead.leadType || "",
            source: lead.source || "phone",
            eventDate: toDateInput(lead.eventDate),
            eventTimeSlot: lead.eventTimeSlot || "",
            guests: lead.guests ?? "",
            kids: lead.kids ?? "",
            requirements: lead.requirements || "",
            remarks: lead.remarks || "",
            companyName: lead.companyName || "",
            companyGstin: lead.companyGstin || "",
          }
        : { ...EMPTY, locationId: locations.length === 1 ? String(locations[0].id) : "" }
    );
  }, [open, lead, locations]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((p) => ({ ...p, [key]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (!form.locationId) found.locationId = "Choose a location";
    if (form.firstName.trim().length < 2) found.firstName = "Enter the customer's name";
    if (!/^[0-9+\- ]{10,20}$/.test(form.mobile.trim())) found.mobile = "Enter a valid mobile number";
    if (form.email && !/^\S+@\S+\.\S+$/.test(form.email)) found.email = "Enter a valid email address";
    if (!form.leadType) found.leadType = "Choose a lead type";
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      locationId: Number(form.locationId),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      mobile: form.mobile.trim(),
      email: form.email.trim(),
      leadType: form.leadType,
      eventDate: form.eventDate || null,
      eventTimeSlot: form.eventTimeSlot,
      guests: form.guests === "" ? null : Number(form.guests),
      kids: form.kids === "" ? null : Number(form.kids),
      requirements: form.requirements.trim(),
      remarks: form.remarks.trim(),
      companyName: form.companyName.trim(),
      companyGstin: form.companyGstin.trim(),
    };
    if (!isEdit) payload.source = form.source;
    
    const saved = await run(
      () => (isEdit ? leadService.updateLead(lead.id, payload) : leadService.createLead(payload)),
      {
        success: isEdit ? "Lead updated" : "Lead created",
        successDescription: (l) => (isEdit ? undefined : `${l.leadCode}${l.assignedToName ? `, assigned to ${l.assignedToName}` : ""}`),
      }
    );
    if (saved) {
      onSaved?.(saved);
      onClose();
    }
  };

  const isCorporate = form.leadType === "corporate_event";

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? `Edit ${lead.leadCode}` : "Add lead"}
      description={isEdit ? undefined : "For enquiries that come in by phone, walk-in, email or referral."}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" type="submit" form="lead-form" loading={busy}>
            {isEdit ? "Save changes" : "Create lead"}
          </Button>
        </>
      }
    >
      <form id="lead-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Location" required error={errors.locationId}>
          {(p) => (
            <Select
              {...p}
              value={form.locationId}
              onChange={set("locationId")}
              placeholder="Choose location"
              options={locations.map((l) => ({ value: String(l.id), label: l.name }))}
            />
          )}
        </Field>

        <Field label="Lead type" required error={errors.leadType}>
          {(p) => (
            <Select
              {...p}
              value={form.leadType}
              onChange={set("leadType")}
              placeholder="Choose type"
              options={(options.types || []).map((t) => ({ value: t.key, label: t.label }))}
            />
          )}
        </Field>

        <Field label="First name" required error={errors.firstName}>
          {(p) => <Input {...p} value={form.firstName} onChange={set("firstName")} />}
        </Field>

        <Field label="Last name">
          {(p) => <Input {...p} value={form.lastName} onChange={set("lastName")} />}
        </Field>

        <Field label="Mobile" required error={errors.mobile}>
          {(p) => <Input {...p} value={form.mobile} onChange={set("mobile")} placeholder="98200 12345" />}
        </Field>

        <Field label="Email" error={errors.email}>
          {(p) => <Input {...p} type="email" value={form.email} onChange={set("email")} />}
        </Field>

        {!isEdit && (
          <Field label="Source" hint="Where this enquiry came from.">
            {(p) => (
              <Select
                {...p}
                value={form.source}
                onChange={set("source")}
                options={(options.sources || []).map((s) => ({ value: s, label: s.replace(/_/g, " ") }))}
              />
            )}
          </Field>
        )}

        <Field label="Event date">
          {(p) => <Input {...p} type="date" value={form.eventDate} onChange={set("eventDate")} />}
        </Field>

        <Field label="Preferred time">
          {(p) => (
            <Select
              {...p}
              value={form.eventTimeSlot}
              onChange={set("eventTimeSlot")}
              placeholder="Any time"
              options={(options.timeSlots || []).map((t) => ({ value: t.key, label: t.label }))}
            />
          )}
        </Field>

        <Field label="Guests">
          {(p) => <Input {...p} type="number" min={0} value={form.guests} onChange={set("guests")} />}
        </Field>

        <Field label="Kids among guests">
          {(p) => <Input {...p} type="number" min={0} value={form.kids} onChange={set("kids")} />}
        </Field>

        {isCorporate && (
          <>
            <Field label="Company name">
              {(p) => <Input {...p} value={form.companyName} onChange={set("companyName")} />}
            </Field>

            <Field label="GSTIN">
              {(p) => <Input {...p} value={form.companyGstin} onChange={set("companyGstin")} className="uppercase" maxLength={15} />}
            </Field>
          </>
        )}

        <Field label="Requirements" className="sm:col-span-2">
          {(p) => <Textarea {...p} rows={2} value={form.requirements} onChange={set("requirements")} placeholder="Cake, decorations, return gifts…" />}
        </Field>

        <Field label="Remarks" className="sm:col-span-2">
          {(p) => <Textarea {...p} rows={2} value={form.remarks} onChange={set("remarks")} placeholder="Anything the customer mentioned" />}
        </Field>
      </form>
    </Modal>
  );
}