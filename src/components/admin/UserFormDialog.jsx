"use client";

import { useEffect, useState } from "react";
import { useAction } from "@/hooks/useAction";
import { locationService, userService } from "@/services/admin";
import { Button, Checkbox, Field, Input, Modal, Select, Spinner } from "@/components/ui";

const EMPTY = {
  firstName: "", lastName: "", email: "", mobile: "", password: "",
  brandId: "", roleId: "", locationIds: [], status: "1",
};

function validate(form, isEdit) {
  const errors = {};
  if (form.firstName.trim().length < 2) errors.firstName = "Enter the first name";
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = "Enter a valid email address";
  if (!/^[0-9+\- ]{6,20}$/.test(form.mobile.trim())) errors.mobile = "Enter a valid mobile number";
  if (!isEdit && form.password.length < 8) errors.password = "Password must be at least 8 characters";
  if (!form.brandId) errors.brandId = "Choose a brand";
  if (!form.roleId) errors.roleId = "Choose a role";
  return errors;
}

export default function UserFormDialog({ open, user, roles = [], brands = [], onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [locations, setLocations] = useState(null);
  const [run, busy] = useAction();
  const isEdit = Boolean(user);

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      user
        ? {
            firstName: user.firstName || "",
            lastName: user.lastName || "",
            email: user.email || "",
            mobile: user.mobile || "",
            password: "",
            brandId: String(user.brandId ?? ""),
            roleId: String(user.roleId ?? ""),
            locationIds: (user.locationIds || []).map(String),
            status: String(user.status ?? 1),
          }
        : { ...EMPTY, brandId: brands.length === 1 ? String(brands[0].id) : "" }
    );
  }, [open, user, brands]);

  // Locations belong to a brand, so reload them whenever the brand changes.
  useEffect(() => {
    if (!open || !form.brandId) {
      setLocations([]);
      return;
    }
    setLocations(null);
    locationService
      .listLocations({ brandId: form.brandId, pageSize: 100, sort: "name:asc" })
      .then((res) => setLocations(res.items))
      .catch(() => setLocations([]));
  }, [open, form.brandId]);

  const set = (key) => (e) => {
    const value = e.target.value;
    setForm((f) => ({
      ...f,
      [key]: value,
      // A different brand means the old locations no longer apply
      ...(key === "brandId" ? { locationIds: [] } : {}),
    }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggleLocation = (id) =>
    setForm((f) => ({
      ...f,
      locationIds: f.locationIds.includes(id) ? f.locationIds.filter((x) => x !== id) : [...f.locationIds, id],
    }));

  const submit = async (e) => {
    e.preventDefault();
    const found = validate(form, isEdit);
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim().toLowerCase(),
      mobile: form.mobile.trim(),
      brandId: Number(form.brandId),
      roleId: Number(form.roleId),
      locationIds: form.locationIds.map(Number),
      status: Number(form.status),
    };
    if (!isEdit) payload.password = form.password;

    const saved = await run(
      () => (isEdit ? userService.updateUser(user.id, payload) : userService.createUser(payload)),
      { success: isEdit ? "User updated" : "User created", successDescription: (u) => u.email }
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
      size="lg"
      title={isEdit ? `Edit ${user.name}` : "Add user"}
      description="The role decides what they can do. The locations decide which leads they see."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" type="submit" form="user-form" loading={busy}>
            {isEdit ? "Save changes" : "Create user"}
          </Button>
        </>
      }
    >
      <form id="user-form" onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" required error={errors.firstName}>
          {(p) => <Input {...p} value={form.firstName} onChange={set("firstName")} placeholder="Priya" />}
        </Field>

        <Field label="Last name">
          {(p) => <Input {...p} value={form.lastName} onChange={set("lastName")} placeholder="Nair" />}
        </Field>

        <Field label="Email" required error={errors.email} hint="They sign in with this.">
          {(p) => <Input {...p} type="email" value={form.email} onChange={set("email")} />}
        </Field>

        <Field label="Mobile" required error={errors.mobile}>
          {(p) => <Input {...p} value={form.mobile} onChange={set("mobile")} placeholder="98200 12345" />}
        </Field>

        {!isEdit && (
          <Field label="Password" required error={errors.password} hint="At least 8 characters." className="sm:col-span-2">
            {(p) => <Input {...p} type="text" autoComplete="new-password" value={form.password} onChange={set("password")} />}
          </Field>
        )}

        <Field label="Brand" required error={errors.brandId}>
          {(p) => (
            <Select
              {...p}
              value={form.brandId}
              onChange={set("brandId")}
              placeholder="Choose brand"
              options={brands.map((b) => ({ value: String(b.id), label: b.name }))}
            />
          )}
        </Field>

        <Field label="Role" required error={errors.roleId}>
          {(p) => (
            <Select
              {...p}
              value={form.roleId}
              onChange={set("roleId")}
              placeholder="Choose role"
              options={roles.map((r) => ({ value: String(r.id), label: r.name }))}
            />
          )}
        </Field>

        <Field
          label="Locations"
          hint="Leave empty for someone not tied to an outlet, such as an admin."
          className="sm:col-span-2"
        >
          {() =>
            !form.brandId ? (
              <p className="text-[13px] text-muted">Choose a brand first.</p>
            ) : locations === null ? (
              <Spinner />
            ) : locations.length === 0 ? (
              <p className="text-[13px] text-muted">This brand has no locations yet.</p>
            ) : (
              <div className="grid gap-2 rounded-md border border-line p-3 sm:grid-cols-2">
                {locations.map((l) => (
                  <Checkbox
                    key={l.id}
                    label={`${l.name} (${l.code})`}
                    checked={form.locationIds.includes(String(l.id))}
                    onChange={() => toggleLocation(String(l.id))}
                  />
                ))}
              </div>
            )
          }
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