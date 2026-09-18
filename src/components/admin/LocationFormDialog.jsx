"use client";

import { useEffect, useState } from "react";
import { useAction } from "@/hooks/useAction";
import { locationService } from "@/services/admin";
import { Button, Field, Input, Modal, Select } from "@/components/ui";

const EMPTY = { brandId: "", name: "", status: "1" };

function validate(form) {
  const errors = {};
  if (!form.brandId) errors.brandId = "Choose a brand";
  if (form.name.trim().length < 2) errors.name = "Enter the location name";
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
          status: location.status || "1",
        }
        : {
          ...EMPTY,
          brandId: defaultBrandId
            ? String(defaultBrandId)
            : brands.length === 1
              ? String(brands[0].id)
              : "",
        }
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
      status: Number(form.status),
    };

    const saved = await run(
      () => (isEdit ? locationService.updateLocation(location.id, payload) : locationService.createLocation(payload)),
      {
        success: isEdit ? "Location updated" : "Location created",
        successDescription: (l) => `${l.name} — ${l.brandName}`,
      }
    );
    if (saved) {
      onSaved?.(saved);
      onClose();
    }
  };

  const brandOptions = brands.map((b) => ({
    value: String(b.id),
    label: b.code ? `${b.name} (${b.code})` : b.name,
  }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="md"
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
      <form id="location-form" onSubmit={submit} noValidate className="grid gap-4">
        <Field label="Brand" required error={errors.brandId}>
          {(p) => (
            <Select
              {...p}
              value={form.brandId}
              onChange={set("brandId")}
              placeholder="Choose brand"
              options={brandOptions}
            />
          )}
        </Field>

        <Field label="Location name" required error={errors.name}>
          {(p) => <Input {...p} value={form.name} onChange={set("name")} maxLength={120} placeholder="Mumbai" />}
        </Field>

        <Field label="Status">
          {(p) => (
            <Select
              {...p}
              value={form.status}
              onChange={set("status")}
              options={[
                { value: "1", label: "Active" },
                { value: "0", label: "Inactive" },
              ]}
            />
          )}
        </Field>
      </form>
    </Modal>
  );
}