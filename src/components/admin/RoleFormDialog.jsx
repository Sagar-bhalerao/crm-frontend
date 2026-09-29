"use client";

import { useEffect, useState } from "react";
import { useAction } from "@/hooks/useAction";
import { roleService } from "@/services/admin";
import { Button, Checkbox, Field, Input, Modal, Select, Textarea } from "@/components/ui";

const EMPTY = { name: "", code: "", description: "", permissions: [], status: "1" };

/** Turns the flat permission list into [[module, permissions], ...] */
function groupByModule(permissions) {
  const groups = {};
  for (const p of permissions) (groups[p.module] ||= []).push(p);
  return Object.entries(groups);
}

export default function RoleFormDialog({ open, role, permissions = [], onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [run, busy] = useAction();
  const isEdit = Boolean(role);
  const locked = role?.code === "super_admin"; // always holds everything

  useEffect(() => {
    if (!open) return;
    setErrors({});
    setForm(
      role
        ? {
            name: role.name || "",
            code: role.code || "",
            description: role.description || "",
            permissions: [...(role.permissions || [])],
            status: String(role.status ?? 1),
          }
        : EMPTY
    );
  }, [open, role]);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const toggle = (key) =>
    setForm((f) => ({
      ...f,
      permissions: f.permissions.includes(key) ? f.permissions.filter((k) => k !== key) : [...f.permissions, key],
    }));

  const toggleModule = (items, allOn) =>
    setForm((f) => {
      const keys = items.map((i) => i.key);
      return {
        ...f,
        permissions: allOn
          ? f.permissions.filter((k) => !keys.includes(k))
          : [...new Set([...f.permissions, ...keys])],
      };
    });

  const submit = async (e) => {
    e.preventDefault();
    const found = {};
    if (form.name.trim().length < 2) found.name = "Enter the role name";
    if (!/^[a-z0-9_]{2,40}$/.test(form.code.trim())) found.code = "Lowercase letters, numbers and underscores only";
    setErrors(found);
    if (Object.keys(found).length) return;

    const payload = {
      name: form.name.trim(),
      description: form.description.trim(),
      status: Number(form.status),
    };
    // Built-in roles keep their code; Super Admin keeps its permissions.
    if (!role?.isSystem) payload.code = form.code.trim();
    if (!locked) payload.permissions = form.permissions;

    const saved = await run(
      () =>
        isEdit
          ? roleService.updateRole(role.id, payload)
          : roleService.createRole({ ...payload, code: form.code.trim() }),
      { success: isEdit ? "Role updated" : "Role created" }
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
      size="xl"
      title={isEdit ? `Edit ${role.name}` : "Add role"}
      description={locked ? "Super Admin always has every permission." : "Tick what this role is allowed to do."}
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button variant="primary" type="submit" form="role-form" loading={busy}>
            {isEdit ? "Save changes" : "Create role"}
          </Button>
        </>
      }
    >
      <form id="role-form" onSubmit={submit} noValidate className="grid gap-5">
        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Role name" required error={errors.name}>
            {(p) => <Input {...p} value={form.name} onChange={set("name")} placeholder="Sales Head" />}
          </Field>

          <Field
            label="Role code"
            required
            error={errors.code}
            hint={role?.isSystem ? "Built-in roles keep their code." : "Used in code, e.g. sales_head"}
          >
            {(p) => <Input {...p} value={form.code} onChange={set("code")} disabled={role?.isSystem} placeholder="sales_head" />}
          </Field>

          <Field label="Status">
            {(p) => (
              <Select
                {...p}
                value={form.status}
                onChange={set("status")}
                disabled={locked}
                options={[
                  { value: "1", label: "Active" },
                  { value: "0", label: "Inactive" },
                ]}
              />
            )}
          </Field>

          <Field label="Description" className="sm:col-span-3">
            {(p) => <Textarea {...p} rows={2} value={form.description} onChange={set("description")} />}
          </Field>
        </div>

        {!locked && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="label mb-0">Permissions</p>
              <p className="meta">{form.permissions.length} selected</p>
            </div>

            <div className="grid gap-4">
              {groupByModule(permissions).map(([module, items]) => {
                const allOn = items.every((i) => form.permissions.includes(i.key));
                return (
                  <div key={module} className="rounded-md border border-line p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <p className="section-title">{module}</p>
                      <button
                        type="button"
                        onClick={() => toggleModule(items, allOn)}
                        className="link cursor-pointer text-[13px]"
                      >
                        {allOn ? "Clear all" : "Select all"}
                      </button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {items.map((p) => (
                        <Checkbox
                          key={p.key}
                          label={p.label}
                          checked={form.permissions.includes(p.key)}
                          onChange={() => toggle(p.key)}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </form>
    </Modal>
  );
}