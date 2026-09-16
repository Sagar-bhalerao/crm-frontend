"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Eye, MapPin, Pencil, Plus, Power, PowerOff, Trash2 } from "lucide-react";
import { P } from "@/config/permissions";
import { useAuth } from "@/context/AuthContext";
import { useAction } from "@/hooks/useAction";
import { formatDate } from "@/lib/format";
import { brandService } from "@/services/admin";
import {
  Button, ConfirmDialog, DataTable, DropdownMenu, EmptyState, ErrorState,
  PageHeader, Pagination, Skeleton, StatusBadge,
} from "@/components/ui";
import BrandFormDialog from "./BrandFormDialog";
import ListToolbar from "./ListToolbar";
import ReadOnlyNotice from "./ReadOnlyNotice";
import { useAdminList } from "./useAdminList";

const SORT_OPTIONS = [
  { value: "name:asc", label: "Name A–Z" },
  { value: "name:desc", label: "Name Z–A" },
  { value: "created_at:desc", label: "Newest first" },
  { value: "created_at:asc", label: "Oldest first" },
];

/** Menu entries for one brand, shared by the table and the mobile cards. */
export function brandActions(brand, { canUpdate, canDelete, onEdit, onToggle, onDelete }) {
  return [
    { key: "view", label: "View details", icon: Eye, href: `/brands/${brand.id}` },
    { key: "locations", label: "Manage locations", icon: MapPin, href: `/locations?brandId=${brand.id}` },
    canUpdate && { key: "edit", label: "Edit brand", icon: Pencil, onClick: onEdit },
    canUpdate && {
      key: "status",
      label: brand.status === "active" ? "Deactivate" : "Activate",
      icon: brand.status === "active" ? PowerOff : Power,
      onClick: onToggle,
      separator: true,
    },
    canDelete && { key: "delete", label: "Delete brand", icon: Trash2, tone: "danger", onClick: onDelete },
  ];
}

export default function BrandsView() {
  const { can } = useAuth();
  const list = useAdminList(brandService.listBrands);
  const [form, setForm] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [run, busy] = useAction();

  const canCreate = can(P.BRAND_CREATE);
  const canUpdate = can(P.BRAND_UPDATE);
  const canDelete = can(P.BRAND_DELETE);

  const confirmToggle = async () => {
    const next = toggling.status === "active" ? "inactive" : "active";
    const ok = await run(() => brandService.setBrandStatus(toggling.id, next), {
      success: next === "active" ? "Brand activated" : "Brand deactivated",
      successDescription: next === "inactive" ? "Existing locations and leads are unchanged." : undefined,
    });
    setToggling(null);
    if (ok) list.reload();
  };

  const confirmDelete = async () => {
    const ok = await run(() => brandService.deleteBrand(deleting.id), { success: `${deleting.name} deleted` });
    setDeleting(null);
    if (ok) list.reload();
  };

  const menu = (b) =>
    brandActions(b, {
      canUpdate,
      canDelete,
      onEdit: () => setForm({ brand: b }),
      onToggle: () => setToggling(b),
      onDelete: () => setDeleting(b),
    });

  const columns = [
    {
      key: "name",
      label: "Brand",
      sortable: true,
      render: (b) => (
        <div>
          <Link href={`/brands/${b.id}`} className="font-medium text-ink hover:underline">
            {b.name}
          </Link>
          {b.description && <p className="meta line-clamp-1 max-w-md">{b.description}</p>}
        </div>
      ),
    },
    { key: "code", label: "Code", sortable: true, render: (b) => <span className="font-medium text-body">{b.code}</span> },
    {
      key: "locationCount",
      label: "Locations",
      render: (b) => (
        <Link href={`/locations?brandId=${b.id}`} className="link">
          {b.locationCount ?? 0}
        </Link>
      ),
    },
    { key: "status", label: "Status", sortable: true, render: (b) => <StatusBadge status={b.status} /> },
    { key: "created_at", label: "Created", sortable: true, render: (b) => <span className="whitespace-nowrap text-body">{formatDate(b.createdAt)}</span> },
    { key: "updated_at", label: "Updated", sortable: true, render: (b) => <span className="whitespace-nowrap text-body">{formatDate(b.updatedAt)}</span> },
    {
      key: "actions",
      label: "Actions",
      sticky: true,
      align: "right",
      render: (b) => (
        <div className="flex justify-end">
          <DropdownMenu items={menu(b)} label={`Actions for ${b.name}`} />
        </div>
      ),
    },
  ];

  const card = (b) => (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <Link href={`/brands/${b.id}`} className="font-medium text-ink">{b.name}</Link>
        <p className="meta">
          {b.code} · {b.locationCount ?? 0} location{(b.locationCount ?? 0) === 1 ? "" : "s"} · {formatDate(b.createdAt)}
        </p>
        <div className="mt-1.5"><StatusBadge status={b.status} /></div>
      </div>
      <DropdownMenu items={menu(b)} label={`Actions for ${b.name}`} />
    </div>
  );

  return (
    <div className="page">
      <PageHeader
        title="Brands"
        description={list.data ? `${list.data.total} brand${list.data.total === 1 ? "" : "s"} configured` : "\u00a0"}
        actions={canCreate && <Button variant="primary" icon={Plus} onClick={() => setForm({ brand: null })}>Add brand</Button>}
      />

      {!canUpdate && <ReadOnlyNotice what="brands" />}

      <section className="panel">
        <ListToolbar
          search={list.search}
          onSearch={list.setSearch}
          filters={[
            {
              key: "status",
              placeholder: "All statuses",
              value: list.query.status,
              options: [
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
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
            icon={Building2}
            title={list.hasFilters ? "No brands match these filters" : "No brands yet"}
            description={list.hasFilters ? "Try a different search." : "Add your first brand to start configuring the CRM."}
            action={
              list.hasFilters ? (
                <Button size="sm" onClick={list.clear}>Clear filters</Button>
              ) : (
                canCreate && <Button size="sm" variant="primary" onClick={() => setForm({ brand: null })}>Add brand</Button>
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
              minWidth={860}
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

      <BrandFormDialog open={Boolean(form)} brand={form?.brand} onClose={() => setForm(null)} onSaved={list.reload} />

      <ConfirmDialog
        open={Boolean(toggling)}
        title={toggling?.status === "active" ? `Deactivate ${toggling?.name}?` : `Activate ${toggling?.name}?`}
        description={
          toggling?.status === "active"
            ? "It stops being offered for new configuration. Its locations, leads and history stay exactly as they are, and you can activate it again at any time."
            : "It becomes available again for new locations and leads."
        }
        confirmLabel={toggling?.status === "active" ? "Deactivate" : "Activate"}
        tone={toggling?.status === "active" ? "danger" : "success"}
        loading={busy}
        onConfirm={confirmToggle}
        onClose={() => setToggling(null)}
      >
        {toggling?.status === "active" && (toggling?.locationCount ?? 0) > 0 && (
          <p className="mt-3 flex items-center gap-2 rounded-md bg-subtle px-3 py-2 text-[13px] text-body">
            <MapPin size={14} className="text-muted" />
            {toggling.locationCount} location{toggling.locationCount === 1 ? "" : "s"} will stay linked to this brand.
          </p>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete ${deleting?.name}?`}
        description="This removes the brand permanently. If you only want to stop using it, deactivate it instead so its history is kept."
        confirmLabel="Delete brand"
        tone="danger"
        loading={busy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      >
        {(deleting?.locationCount ?? 0) > 0 && (
          <p className="mt-3 rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger">
            {deleting.locationCount} location{deleting.locationCount === 1 ? " is" : "s are"} still linked to this brand, so it cannot be deleted. Move or delete them first, or deactivate the brand.
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}
