"use client";

import { useEffect, useState } from "react";
import { Check, Minus, Pencil, Plus, Power, PowerOff, ShieldCheck, Trash2 } from "lucide-react";
import { P } from "@/config/permissions";
import { useAuth } from "@/context/AuthContext";
import { useAction } from "@/hooks/useAction";
import { roleService } from "@/services/admin";
import { cx } from "@/lib/utils";
import {
  Badge, Button, ConfirmDialog, DropdownMenu, ErrorState,
  PageHeader, Panel, Skeleton, StatusBadge,
} from "@/components/ui";
import ReadOnlyNotice from "./ReadOnlyNotice";
import RoleFormDialog from "./RoleFormDialog";

/** Turns the flat permission list into [[module, permissions], ...] */
function groupByModule(permissions) {
  const groups = {};
  for (const p of permissions) (groups[p.module] ||= []).push(p);
  return Object.entries(groups);
}

export default function RolesView() {
  const { can, user, refresh } = useAuth();
  const [roles, setRoles] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [error, setError] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(null);          // { role } to edit, { role: null } to add
  const [toggling, setToggling] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [run, busy] = useAction();

  const canCreate = can(P.ROLE_CREATE);
  const canUpdate = can(P.ROLE_UPDATE);
  const canDelete = can(P.ROLE_DELETE);

  const load = async () => {
    setError(null);
    try {
      const [r, p] = await Promise.all([roleService.listRoles(), roleService.listPermissions()]);
      setRoles(r);
      setPermissions(p);
      setSelectedId((current) => current ?? r[0]?.id ?? null);
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (error) {
    return (
      <div className="page">
        <PageHeader title="Roles & permissions" />
        <div className="panel"><ErrorState error={error} onRetry={load} /></div>
      </div>
    );
  }

  const selected = roles?.find((r) => r.id === selectedId) || null;

  const confirmToggle = async () => {
    const next = Number(toggling.status) === 1 ? 0 : 1;
    const ok = await run(() => roleService.setRoleStatus(toggling.id, next), {
      success: next === 1 ? "Role activated" : "Role deactivated",
    });
    setToggling(null);
    if (ok) load();
  };

  const confirmDelete = async () => {
    const ok = await run(() => roleService.deleteRole(deleting.id), { success: `${deleting.name} deleted` });
    setDeleting(null);
    if (ok) {
      setSelectedId(null);
      load();
    }
  };

  // Built-in roles cannot be deleted or deactivated, so those entries drop out.
  const menu = (r) => {
    const active = Number(r.status) === 1;
    return [
      canUpdate && { key: "edit", label: "Edit role", icon: Pencil, onClick: () => setForm({ role: r }) },
      canUpdate && !r.isSystem && {
        key: "status",
        label: active ? "Deactivate" : "Activate",
        icon: active ? PowerOff : Power,
        onClick: () => setToggling(r),
        separator: true,
      },
      canDelete && !r.isSystem && {
        key: "delete", label: "Delete role", icon: Trash2, tone: "danger", onClick: () => setDeleting(r),
      },
    ];
  };

  return (
    <div className="page">
      <PageHeader
        title="Roles & permissions"
        description="Access is decided by permissions, then narrowed by the brand and locations on each user."
        actions={canCreate && <Button variant="primary" icon={Plus} onClick={() => setForm({ role: null })}>Add role</Button>}
      />

      {!canUpdate && <ReadOnlyNotice what="roles" />}

      <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
        {/* The roles */}
        <Panel title="Roles" bodyClassName="p-0">
          {!roles ? (
            <div className="grid gap-2 p-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-14" />)}
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {roles.map((r) => (
                <li key={r.id} className={cx("flex items-start gap-2 px-3 py-3", r.id === selectedId && "bg-subtle")}>
                  <button onClick={() => setSelectedId(r.id)} className="min-w-0 flex-1 cursor-pointer text-left">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-ink">{r.name}</span>
                      {r.isSystem && <Badge tone="gray">Built in</Badge>}
                      {Number(r.status) !== 1 && <StatusBadge status={r.status} />}
                    </span>
                    <span className="meta block">{r.code}</span>
                    <span className="meta block">
                      {r.userCount ?? 0} user{(r.userCount ?? 0) === 1 ? "" : "s"} · {r.permissions.length} permission
                      {r.permissions.length === 1 ? "" : "s"}
                    </span>
                  </button>
                  <DropdownMenu items={menu(r)} label={`Actions for ${r.name}`} />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* What the chosen role may do */}
        <Panel
          title={selected ? `${selected.name} can` : "Permissions"}
          description={selected?.description || undefined}
          actions={
            canUpdate && selected && (
              <Button size="sm" icon={Pencil} onClick={() => setForm({ role: selected })}>Edit permissions</Button>
            )
          }
        >
          {!roles || !selected ? (
            <Skeleton className="h-64" />
          ) : selected.code === "super_admin" ? (
            <p className="flex items-center gap-2 text-sm text-body">
              <ShieldCheck size={16} className="text-success" />
              Every permission, including any added later. This cannot be changed.
            </p>
          ) : (
            <div className="grid gap-5">
              {groupByModule(permissions).map(([module, items]) => (
                <div key={module}>
                  <p className="section-title mb-2">{module}</p>
                  <ul className="grid gap-1.5 sm:grid-cols-2">
                    {items.map((p) => {
                      const held = selected.permissions.includes(p.key);
                      return (
                        <li key={p.key} className={cx("flex items-start gap-2 text-sm", held ? "text-ink" : "text-faint")}>
                          {held ? (
                            <Check size={15} className="mt-0.5 shrink-0 text-success" />
                          ) : (
                            <Minus size={15} className="mt-0.5 shrink-0 text-line-strong" />
                          )}
                          <span>
                            {p.label}
                            <span className="meta block">{p.key}</span>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </Panel>
      </div>

      <RoleFormDialog
        open={Boolean(form)}
        role={form?.role}
        permissions={permissions}
        onClose={() => setForm(null)}
        onSaved={(saved) => {
          load();
          // Changing your own role should update your menus straight away
          if (saved?.code === user?.role?.id) refresh?.();
        }}
      />

      <ConfirmDialog
        open={Boolean(toggling)}
        title={Number(toggling?.status) === 1 ? `Deactivate ${toggling?.name}?` : `Activate ${toggling?.name}?`}
        description={
          Number(toggling?.status) === 1
            ? "It can no longer be given to a user. People who already have it keep it."
            : "It can be given to users again."
        }
        confirmLabel={Number(toggling?.status) === 1 ? "Deactivate" : "Activate"}
        tone={Number(toggling?.status) === 1 ? "danger" : "success"}
        loading={busy}
        onConfirm={confirmToggle}
        onClose={() => setToggling(null)}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete ${deleting?.name}?`}
        description="This removes the role permanently. Users on it must be moved to another role first."
        confirmLabel="Delete role"
        tone="danger"
        loading={busy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      >
        {(deleting?.userCount ?? 0) > 0 && (
          <p className="mt-3 rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger">
            {deleting.userCount} user{deleting.userCount === 1 ? " is" : "s are"} on this role, so it cannot be deleted.
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}