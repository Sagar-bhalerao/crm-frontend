"use client";

import { useEffect, useState } from "react";
import { useAction } from "@/hooks/useAction";
import { locationService } from "@/services/admin";
import { Button, Field, Input, Modal, Select, Textarea } from "@/components/ui";

const EMPTY = {
  brandId: "", name: "", code: "", city: "", state: "",
  address: "", pincode: "", contactNumber: "", email: "", status: "active",
};

function validate(form) {
  const errors = {};
  if (!form.brandId) errors.brandId = "Choose a brand";
  if (form.name.trim().length < 2) errors.name = "Enter the location name";
  if (form.code.trim().length < 2) errors.code = "Enter a location code";
  else if (!/^[A-Za-z0-9-]+$/.test(form.code.trim())) errors.code = "Use letters, numbers and hyphens only";
  if (form.pincode && !/^\d{6}$/.test(form.pincode.trim())) errors.pincode = "Pincode must be 6 digits";
  if (form.email && !/^\S+@\S+\.\S+$/.test(form.email.trim())) errors.email = "Enter a valid email address";
  if (form.contactNumber && !/^[0-9+\- ]{6,20}$/.test(form.contactNumber.trim())) errors.contactNumber = "Enter a valid contact number";
  return errors;
}

export default function LocationFormDialog({ open, location, brands = [], defaultBrandId = "", onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [run, busy] = useAction();
  const isEdit = Boolean(location);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      location
        ? {
            brandId: String(location.brandId ?? ""),
            name: location.name || "",
            code: location.code || "",
            city: location.city || "",
            state: location.state || "",
            address: location.address || "",
            pincode: location.pincode || "",
            contactNumber: location.contactNumber || "",
            email: location.email || "",
            status: location.status || "active",
          }
        : { ...EMPTY, brandId: defaultBrandId ? String(defaultBrandId) : brands.length === 1 ? String(brands[0].id) : "" }
    );
  }, [open, location, defaultBrandId, brands]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      brandId: Number(form.brandId),
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      city: form.city.trim(),
      state: form.state.trim(),
      address: form.address.trim(),
      pincode: form.pincode.trim(),
      contactNumber: form.contactNumber.trim(),
      email: form.email.trim(),
      status: form.status,
    };

    const saved = await run(
      () => (isEdit ? locationService.updateLocation(location.id, payload) : locationService.createLocation(payload)),
      { success: isEdit ? "Location updated" : "Location created", successDescription: (l) => `${l.name} (${l.code})` }
    );
    if (saved) {
      onSaved?.(saved);
      onClose();
    }
  };

  const brandOptions = brands.map((b) => ({ value: String(b.id), label: `${b.name} (${b.code})` }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={isEdit ? `Edit ${location.name}` : "Add location"}
      description="A location belongs to one brand."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" type="submit" form="location-form" loading={busy}>
            {isEdit ? "Save changes" : "Create location"}
          </Button>
        </>
      }
    >
      <form id="location-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Brand" required error={errors.brandId} className="sm:col-span-2">
          {(p) => <Select {...p} value={form.brandId} onChange={set("brandId")} placeholder="Choose brand" options={brandOptions} />}
        </Field>

        <Field label="Location name" required error={errors.name}>
          {(p) => <Input {...p} value={form.name} onChange={set("name")} placeholder="Mumbai" />}
        </Field>

        <Field label="Location code" required error={errors.code} hint="Unique across all brands, e.g. DB-MUM">
          {(p) => <Input {...p} value={form.code} onChange={set("code")} className="uppercase" maxLength={30} placeholder="DB-MUM" />}
        </Field>

        <Field label="City">{(p) => <Input {...p} value={form.city} onChange={set("city")} placeholder="Mumbai" />}</Field>
        <Field label="State">{(p) => <Input {...p} value={form.state} onChange={set("state")} placeholder="Maharashtra" />}</Field>

        <Field label="Address" className="sm:col-span-2">
          {(p) => <Textarea {...p} rows={2} value={form.address} onChange={set("address")} />}
        </Field>

        <Field label="Pincode" error={errors.pincode}>
          {(p) => <Input {...p} value={form.pincode} onChange={set("pincode")} inputMode="numeric" maxLength={6} placeholder="400001" />}
        </Field>

        <Field label="Contact number" error={errors.contactNumber}>
          {(p) => <Input {...p} value={form.contactNumber} onChange={set("contactNumber")} placeholder="+91 22 1234 5678" />}
        </Field>

        <Field label="Email" error={errors.email}>
          {(p) => <Input {...p} type="email" value={form.email} onChange={set("email")} placeholder="mumbai@example.com" />}
        </Field>

        <Field label="Status">
          {(p) => (
            <Select
              {...p}
              value={form.status}
              onChange={set("status")}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          )}
        </Field>
      </form>
    </Modal>
  );
}
