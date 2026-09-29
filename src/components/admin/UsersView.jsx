"use client";

import { useEffect, useState } from "react";
import { KeyRound, Pencil, Plus, Power, PowerOff, Trash2, Users as UsersIcon } from "lucide-react";
import { P } from "@/config/permissions";
import { useAuth } from "@/context/AuthContext";
import { useAction } from "@/hooks/useAction";
import { formatDate, formatPhone } from "@/lib/format";
import { brandService, roleService, userService } from "@/services/admin";
import {
  Avatar, Button, ConfirmDialog, DataTable, DropdownMenu, EmptyState, ErrorState,
  Field, Input, Modal, PageHeader, Pagination, Skeleton, StatusBadge,
} from "@/components/ui";
import ListToolbar from "./ListToolbar";
import ReadOnlyNotice from "./ReadOnlyNotice";
import UserFormDialog from "./UserFormDialog";
import { useAdminList } from "./useAdminList";

const SORT_OPTIONS = [
  { value: "first_name:asc", label: "Name A–Z" },
  { value: "first_name:desc", label: "Name Z–A" },
  { value: "created_date:desc", label: "Newest first" },
];

export default function UsersView() {
  const { can } = useAuth();
  const list = useAdminList(userService.listUsers, { sort: "first_name:asc", roleId: "" });
  const [roles, setRoles] = useState([]);
  const [brands, setBrands] = useState([]);
  const [form, setForm] = useState(null);       // { user } to edit, { user: null } to add
  const [toggling, setToggling] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [password, setPassword] = useState(null);
  const [run, busy] = useAction();

  const canCreate = can(P.USER_CREATE);
  const canUpdate = can(P.USER_UPDATE);
  const canDelete = can(P.USER_DELETE);

  // Roles and brands fill the filter dropdowns and the form.
  useEffect(() => {
    roleService.listRoles().then(setRoles).catch(() => setRoles([]));
    brandService.listBrands({ pageSize: 100, sort: "name:asc" })
      .then((r) => setBrands(r.items))
      .catch(() => setBrands([]));
  }, []);

  const confirmToggle = async () => {
    const next = Number(toggling.status) === 1 ? 0 : 1;
    const ok = await run(() => userService.setUserStatus(toggling.id, next), {
      success: next === 1 ? "User activated" : "User deactivated",
      successDescription: next === 0 ? "They can no longer sign in. Their leads stay with them." : undefined,
    });
    setToggling(null);
    if (ok) list.reload();
  };

  const confirmDelete = async () => {
    const ok = await run(() => userService.deleteUser(deleting.id), { success: `${deleting.name} deleted` });
    setDeleting(null);
    if (ok) list.reload();
  };

  const menu = (u) => {
    const active = Number(u.status) === 1;
    return [
      canUpdate && { key: "edit", label: "Edit user", icon: Pencil, onClick: () => setForm({ user: u }) },
      canUpdate && { key: "password", label: "Set password", icon: KeyRound, onClick: () => setPassword(u) },
      canUpdate && {
        key: "status",
        label: active ? "Deactivate" : "Activate",
        icon: active ? PowerOff : Power,
        onClick: () => setToggling(u),
        separator: true,
      },
      canDelete && { key: "delete", label: "Delete user", icon: Trash2, tone: "danger", onClick: () => setDeleting(u) },
    ];
  };

  // One entry per column. Add, remove or reorder entries to change the table.
  const columns = [
    {
      key: "first_name",
      label: "Name",
      sortable: true,
      render: (u) => (
        <div className="flex items-center gap-3">
          <Avatar name={u.name} />
          <div className="min-w-0">
            <p className="font-medium text-ink">{u.name}</p>
            <p className="meta truncate">{u.email}</p>
          </div>
        </div>
      ),
    },
    { key: "mobile", label: "Mobile", render: (u) => <span className="whitespace-nowrap text-body">{formatPhone(u.mobile)}</span> },
    { key: "role", label: "Role", render: (u) => <span className="text-body">{u.roleName || "No role"}</span> },
    { key: "brand", label: "Brand", render: (u) => <span className="text-body">{u.brandName || "—"}</span> },
    {
      key: "locations",
      label: "Locations",
      render: (u) => (
        <span className="text-body">{u.locations?.length ? u.locations.map((l) => l.name).join(", ") : "None"}</span>
      ),
    },
    { key: "status", label: "Status", sortable: true, render: (u) => <StatusBadge status={u.status} /> },
    { key: "created_date", label: "Created", sortable: true, render: (u) => <span className="whitespace-nowrap text-body">{formatDate(u.createdAt)}</span> },
    {
      key: "actions",
      label: "Actions",
      sticky: true,
      align: "right",
      render: (u) => (
        <div className="flex justify-end">
          <DropdownMenu items={menu(u)} label={`Actions for ${u.name}`} />
        </div>
      ),
    },
  ];

  // What one row looks like on a phone.
  const card = (u) => (
    <div className="flex items-start justify-between gap-3">
      <div className="flex min-w-0 gap-3">
        <Avatar name={u.name} />
        <div className="min-w-0">
          <p className="font-medium text-ink">{u.name}</p>
          <p className="meta truncate">{u.email}</p>
          <p className="meta">{[u.roleName, u.locations?.map((l) => l.name).join(", ")].filter(Boolean).join(" · ")}</p>
          <div className="mt-1.5"><StatusBadge status={u.status} /></div>
        </div>
      </div>
      <DropdownMenu items={menu(u)} label={`Actions for ${u.name}`} />
    </div>
  );

  return (
    <div className="page">
      <PageHeader
        title="Users"
        description={list.data ? `${list.data.total} user${list.data.total === 1 ? "" : "s"}` : "\u00a0"}
        actions={canCreate && <Button variant="primary" icon={Plus} onClick={() => setForm({ user: null })}>Add user</Button>}
      />

      {!canUpdate && <ReadOnlyNotice what="users" />}

      <section className="panel">
        <ListToolbar
          search={list.search}
          onSearch={list.setSearch}
          filters={[
            {
              key: "roleId",
              placeholder: "All roles",
              value: String(list.query.roleId || ""),
              options: roles.map((r) => ({ value: String(r.id), label: r.name })),
            },
            {
              key: "status",
              placeholder: "All statuses",
              value: list.query.status,
              options: [
                { value: "1", label: "Active" },
                { value: "0", label: "Inactive" },
              ],
            },
          ]}
          sortOptions={SORT_OPTIONS}
          sort={list.query.sort}
          onChange={list.update}
          onClear={list.clear}
          showClear={list.hasFilters}
        />

        {list.error ? (
          <ErrorState error={list.error} onRetry={list.reload} />
        ) : !list.data ? (
          <div className="grid gap-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : list.data.items.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title={list.hasFilters ? "No users match these filters" : "No users yet"}
            description={list.hasFilters ? "Try a different search or role." : "Add the people who will use the CRM."}
            action={
              list.hasFilters ? (
                <Button size="sm" onClick={list.clear}>Clear filters</Button>
              ) : (
                canCreate && <Button size="sm" variant="primary" onClick={() => setForm({ user: null })}>Add user</Button>
              )
            }
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={list.data.items}
              sort={list.query.sort}
              onSort={(sort) => list.update({ sort })}
              renderCard={card}
              busy={list.loading}
              minWidth={1040}
            />
            <div className="border-t border-line">
              <Pagination
                page={list.data.page}
                totalPages={list.data.totalPages}
                total={list.data.total}
                pageSize={list.data.pageSize}
                onChange={list.setPage}
              />
            </div>
          </>
        )}
      </section>

      <UserFormDialog
        open={Boolean(form)}
        user={form?.user}
        roles={roles.filter((r) => Number(r.status) === 1)}
        brands={brands.filter((b) => Number(b.status) === 1)}
        onClose={() => setForm(null)}
        onSaved={list.reload}
      />

      <PasswordDialog user={password} onClose={() => setPassword(null)} />

      <ConfirmDialog
        open={Boolean(toggling)}
        title={Number(toggling?.status) === 1 ? `Deactivate ${toggling?.name}?` : `Activate ${toggling?.name}?`}
        description={
          Number(toggling?.status) === 1
            ? "They can no longer sign in. Leads already assigned to them stay as they are."
            : "They can sign in again and be assigned new leads."
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
        description="This removes the account permanently. Deactivate instead if you want to keep the record of who handled which lead."
        confirmLabel="Delete user"
        tone="danger"
        loading={busy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

/** Admin setting a new password. The current one is not needed. */
function PasswordDialog({ user, onClose }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [run, busy] = useAction();

  useEffect(() => {
    if (user) {
      setValue("");
      setError("");
    }
  }, [user]);

  const submit = async (e) => {
    e.preventDefault();
    if (value.length < 8) return setError("Password must be at least 8 characters");
    const ok = await run(() => userService.setUserPassword(user.id, value), {
      success: "Password updated",
      successDescription: "Share it with them over a secure channel.",
    });
    if (ok) onClose();
  };

  return (
    <Modal
      open={Boolean(user)}
      onClose={onClose}
      size="sm"
      title="Set password"
      description={user ? `For ${user.name}` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button variant="primary" type="submit" form="password-form" loading={busy}>Set password</Button>
        </>
      }
    >
      <form id="password-form" onSubmit={submit} noValidate>
        <Field label="New password" required error={error} hint="At least 8 characters.">
          {(p) => (
            <Input
              {...p}
              type="text"
              autoComplete="new-password"
              value={value}
              onChange={(e) => { setValue(e.target.value); setError(""); }}
            />
          )}
        </Field>
      </form>
    </Modal>
  );
}