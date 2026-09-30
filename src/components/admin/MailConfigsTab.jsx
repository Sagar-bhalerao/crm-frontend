"use client";

import { useState } from "react";
import { Eye, Mail, Pencil, Power, PowerOff, Trash2 } from "lucide-react";
import { P } from "@/config/permissions";
import { useAuth } from "@/context/AuthContext";
import { useAction } from "@/hooks/useAction";
import { formatDateTime } from "@/lib/format";
import { mailConfigService } from "@/services/admin";
import {
  Button, ConfirmDialog, DataTable, DropdownMenu, EmptyState, ErrorState,
  Pagination, Skeleton, StatusBadge,
} from "@/components/ui";
import ConfigDetailsDialog from "./ConfigDetailsDialog";
import ListToolbar from "./ListToolbar";
import MailConfigFormDialog from "./MailConfigFormDialog";
import { useAdminList } from "./useAdminList";
import {
  CONFIG_SORT_OPTIONS, STATUS_OPTIONS, configName, masterInactive, savedSecretText, smtpSecurityLabel,
} from "./configOptions";

/**
 * Mail tab of the Configuration page.
 * The page header owns the Add button: `creating` opens the add dialog,
 * `onCreate` asks the page to open it, `onCreateClose` tells the page it closed.
 */
export default function MailConfigsTab({ brands, creating, onCreate, onCreateClose }) {
  const { can } = useAuth();
  const canManage = can(P.SETTINGS_MANAGE);
  const list = useAdminList(mailConfigService.listMailConfigs, { brandId: "", sort: "brand:asc" });
  const [editing, setEditing] = useState(null);
  const [viewing, setViewing] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [run, busy] = useAction();

  const formOpen = Boolean(creating || editing);
  const closeForm = () => {
    setEditing(null);
    onCreateClose?.();
  };

  const confirmToggle = async () => {
    const next = toggling.status === 1 ? 0 : 1;
    const ok = await run(() => mailConfigService.setMailConfigStatus(toggling.id, next), {
      success: next === 1 ? "Mail configuration activated" : "Mail configuration deactivated",
      successDescription: configName(toggling),
    });
    setToggling(null);
    if (ok) list.reload();
  };

  const confirmDelete = async () => {
    const ok = await run(() => mailConfigService.deleteMailConfig(deleting.id), {
      success: "Mail configuration deleted",
      successDescription: configName(deleting),
    });
    setDeleting(null);
    if (ok) list.reload();
  };

  const menu = (c) => [
    { key: "view", label: "View", icon: Eye, onClick: () => setViewing(c) },
    canManage && { key: "edit", label: "Edit", icon: Pencil, onClick: () => setEditing(c) },
    canManage && {
      key: "status",
      label: c.status === 1 ? "Deactivate" : "Activate",
      icon: c.status === 1 ? PowerOff : Power,
      onClick: () => setToggling(c),
      separator: true,
    },
    canManage && { key: "delete", label: "Delete", icon: Trash2, tone: "danger", onClick: () => setDeleting(c) },
  ];

  const inactiveNote = (c) =>
    masterInactive(c) && <p className="meta">Not used: {c.brandStatus !== 1 ? "brand" : "location"} is inactive</p>;

  const columns = [
    {
      key: "brand",
      label: "Brand",
      sortable: true,
      render: (c) => <span className="font-medium text-ink">{c.brandName}</span>,
    },
    {
      key: "location",
      label: "Location",
      sortable: true,
      render: (c) => (
        <div>
          <span className="text-body">{c.locationName}</span>
          {inactiveNote(c)}
        </div>
      ),
    },
    { key: "smtpHost", label: "SMTP host", sortable: true, render: (c) => <span className="text-body">{c.smtpHost}</span> },
    { key: "smtpPort", label: "SMTP port", sortable: true, render: (c) => <span className="text-body">{c.smtpPort}</span> },
    {
      key: "fromEmail",
      label: "From email",
      sortable: true,
      render: (c) => <span className="block max-w-[240px] truncate text-body" title={c.fromEmail}>{c.fromEmail}</span>,
    },
    { key: "status", label: "Status", sortable: true, render: (c) => <StatusBadge status={c.status} /> },
    {
      key: "actions",
      label: "Actions",
      sticky: true,
      align: "right",
      render: (c) => (
        <div className="flex justify-end">
          <DropdownMenu items={menu(c)} label={`Actions for ${configName(c)}`} />
        </div>
      ),
    },
  ];

  const card = (c) => (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-medium text-ink">{configName(c)}</p>
        <p className="meta truncate">{c.smtpHost}:{c.smtpPort}, from {c.fromEmail}</p>
        {inactiveNote(c)}
        <div className="mt-1.5"><StatusBadge status={c.status} /></div>
      </div>
      <DropdownMenu items={menu(c)} label={`Actions for ${configName(c)}`} />
    </div>
  );

  const brandFilterOptions = (brands || []).map((b) => ({ value: String(b.id), label: b.name }));

  return (
    <>
      <section className="panel">
        <ListToolbar
          search={list.search}
          onSearch={list.setSearch}
          searchPlaceholder="Search host, email or location"
          filters={[
            { key: "brandId", placeholder: "All brands", value: list.query.brandId, options: brandFilterOptions },
            { key: "status", placeholder: "All statuses", value: list.query.status, options: STATUS_OPTIONS },
          ]}
          sortOptions={CONFIG_SORT_OPTIONS}
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
            icon={Mail}
            title={list.hasFilters ? "No mail configurations match these filters" : "No mail configurations yet"}
            description={
              list.hasFilters
                ? "Try a different brand, status or search."
                : "Add one for each brand and location that sends email."
            }
            action={
              list.hasFilters ? (
                <Button size="sm" onClick={list.clear}>Clear filters</Button>
              ) : (
                canManage && <Button size="sm" variant="primary" onClick={onCreate}>Add mail configuration</Button>
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
              minWidth={900}
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

      <MailConfigFormDialog
        open={formOpen}
        config={editing}
        brands={brands}
        onClose={closeForm}
        onSaved={list.reload}
      />

      <ConfigDetailsDialog
        open={Boolean(viewing)}
        title="Mail configuration"
        description={configName(viewing)}
        onClose={() => setViewing(null)}
        onEdit={canManage ? () => { setEditing(viewing); setViewing(null); } : undefined}
        items={
          viewing
            ? [
                { label: "Brand", value: viewing.brandName },
                { label: "Location", value: viewing.locationName },
                { label: "SMTP host", value: viewing.smtpHost },
                { label: "SMTP port", value: viewing.smtpPort },
                { label: "Encryption", value: smtpSecurityLabel(viewing.smtpSecurity) },
                { label: "SMTP username", value: viewing.smtpUsername },
                { label: "SMTP password", value: savedSecretText(viewing.smtpPasswordSet, viewing.smtpPasswordHint) },
                { label: "From", value: `${viewing.fromName} <${viewing.fromEmail}>` },
                {
                  label: "Reply to",
                  value: viewing.replyToEmail ? (viewing.replyToName ? `${viewing.replyToName} <${viewing.replyToEmail}>` : viewing.replyToEmail) : null,
                },
                { label: "Status", value: <StatusBadge status={viewing.status} /> },
                { label: "Last updated", value: formatDateTime(viewing.updatedAt) },
                { label: "Subject", value: viewing.subject, wide: true },
                { label: "Email text", value: viewing.body, wide: true, pre: true },
              ].filter(Boolean)
            : []
        }
      />

      <ConfirmDialog
        open={Boolean(toggling)}
        title={toggling?.status === 1 ? "Deactivate this mail configuration?" : "Activate this mail configuration?"}
        description={
          toggling?.status === 1
            ? `Email for ${configName(toggling)} stops being sent until it is activated again. Its settings are kept.`
            : `Email for ${configName(toggling)} will be sent with these settings.`
        }
        confirmLabel={toggling?.status === 1 ? "Deactivate" : "Activate"}
        tone={toggling?.status === 1 ? "danger" : "success"}
        loading={busy}
        onConfirm={confirmToggle}
        onClose={() => setToggling(null)}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title="Delete this mail configuration?"
        description={`This permanently removes the settings and saved SMTP password for ${configName(deleting)}. To stop sending for a while, deactivate it instead.`}
        confirmLabel="Delete"
        tone="danger"
        loading={busy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
