"use client";

import { useEffect, useState } from "react";
import { useAction } from "@/hooks/useAction";
import { brandService } from "@/services/admin";
import { Button, Field, Input, Modal, Select, Textarea } from "@/components/ui";

const EMPTY = { name: "", code: "", description: "", logoUrl: "", status: 1 };

function validate(form) {
  const errors = {};
  if (form.name.trim().length < 2) errors.name = "Enter the brand name";
  if (form.code.trim().length < 2) errors.code = "Enter a brand code";
  else if (!/^[A-Za-z0-9-]+$/.test(form.code.trim())) errors.code = "Use letters, numbers and hyphens only";
  if (form.logoUrl && !/^https?:\/\/\S+$/.test(form.logoUrl.trim())) errors.logoUrl = "Enter a full URL starting with http";
  return errors;
}

/** Create or edit a brand. `brand` null means create. */
export default function BrandFormDialog({ open, brand, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [run, busy] = useAction();
  const isEdit = Boolean(brand);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      brand
        ? {
            name: brand.name || "",
            code: brand.code || "",
            description: brand.description || "",
            logoUrl: brand.logoUrl || "",
            status: Number(brand.status) || 1,
          }
        : EMPTY
    );
  }, [open, brand]);

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
      name: form.name.trim(),
      code: form.code.trim().toUpperCase(),
      description: form.description.trim(),
      logoUrl: form.logoUrl.trim(),
      status: form.status,
    };

    const saved = await run(() => (isEdit ? brandService.updateBrand(brand.id, payload) : brandService.createBrand(payload)), {
      success: isEdit ? "Brand updated" : "Brand created",
      successDescription: (b) => `${b.name} (${b.code})`,
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
      size="lg"
      title={isEdit ? `Edit ${brand.name}` : "Add brand"}
      description={isEdit ? "Locations and leads stay linked to this brand." : "Brands group the outlets and leads in the CRM."}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" type="submit" form="brand-form" loading={busy}>
            {isEdit ? "Save changes" : "Create brand"}
          </Button>
        </>
      }
    >
      <form id="brand-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="Brand name" required error={errors.name}>
          {(p) => <Input {...p} value={form.name} onChange={set("name")} placeholder="Dave &amp; Buster's India" />}
        </Field>

        <Field label="Brand code" required error={errors.code} hint="Short unique code, e.g. DBI">
          {(p) => <Input {...p} value={form.code} onChange={set("code")} className="uppercase" maxLength={20} placeholder="DBI" />}
        </Field>

        <Field label="Description" className="sm:col-span-2">
          {(p) => <Textarea {...p} rows={3} value={form.description} onChange={set("description")} placeholder="What this brand covers" />}
        </Field>

        <Field label="Logo URL" error={errors.logoUrl} hint="Optional. File upload comes later.">
          {(p) => <Input {...p} value={form.logoUrl} onChange={set("logoUrl")} placeholder="https://..." />}
        </Field>

        <Field label="Status" hint="Inactive brands are hidden from new configuration.">
          {(p) => (
            <Select
              {...p}
              value={form.status}
              onChange={set("status")}
              options={[
                { value: 1, label: "Active" },
                { value: 0, label: "Inactive" },
              ]}
            />
          )}
        </Field>
      </form>
    </Modal>
  );
}
