"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { MapPin, Pencil, Plus, Power, PowerOff, Trash2 } from "lucide-react";
import { P } from "@/config/permissions";
import { useAuth } from "@/context/AuthContext";
import { useAction } from "@/hooks/useAction";
import { formatDate, formatPhone } from "@/lib/format";
import { brandService, locationService } from "@/services/admin";
import {
  Button, ConfirmDialog, DataTable, DropdownMenu, EmptyState, ErrorState,
  PageHeader, Pagination, Skeleton, StatusBadge,
} from "@/components/ui";
import ListToolbar from "./ListToolbar";
import ReadOnlyNotice from "./ReadOnlyNotice";
import LocationFormDialog from "./LocationFormDialog";
import { useAdminList } from "./useAdminList";

const SORT_OPTIONS = [
  { value: "name:asc", label: "Name A–Z" },
  { value: "name:desc", label: "Name Z–A" },
  { value: "city:asc", label: "City A–Z" },
  { value: "created_at:desc", label: "Newest first" },
];

function LocationsContent() {
  const { can } = useAuth();
  const params = useSearchParams();
  const list = useAdminList(locationService.listLocations, { brandId: params.get("brandId") || "" });
  const [brands, setBrands] = useState([]);
  const [brandsError, setBrandsError] = useState(null);
  const [form, setForm] = useState(null);
  const [toggling, setToggling] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [run, busy] = useAction();

  const canCreate = can(P.LOCATION_CREATE);
  const canUpdate = can(P.LOCATION_UPDATE);
  const canDelete = can(P.LOCATION_DELETE);

  useEffect(() => {
    brandService
      .listBrands({ pageSize: 100, sort: "name:asc" })
      .then((res) => setBrands(res.items))
      .catch(setBrandsError);
  }, []);

  const activeBrands = brands.filter((b) => b.status === "active");

  const confirmToggle = async () => {
    const next = toggling.status === "active" ? "inactive" : "active";
    const ok = await run(() => locationService.setLocationStatus(toggling.id, next), {
      success: next === "active" ? "Location activated" : "Location deactivated",
    });
    setToggling(null);
    if (ok) list.reload();
  };

  const confirmDelete = async () => {
    const ok = await run(() => locationService.deleteLocation(deleting.id), { success: `${deleting.name} deleted` });
    setDeleting(null);
    if (ok) list.reload();
  };

  const menu = (l) =>
    [
      canUpdate && { key: "edit", label: "Edit location", icon: Pencil, onClick: () => setForm({ location: l }) },
      { key: "brand", label: "View brand", icon: MapPin, href: `/brands/${l.brandId}` },
      canUpdate && {
        key: "status",
        label: l.status === "active" ? "Deactivate" : "Activate",
        icon: l.status === "active" ? PowerOff : Power,
        onClick: () => setToggling(l),
        separator: true,
      },
      canDelete && { key: "delete", label: "Delete location", icon: Trash2, tone: "danger", onClick: () => setDeleting(l) },
    ].filter(Boolean);

  const columns = [
    {
      key: "name",
      label: "Location",
      sortable: true,
      render: (l) => (
        <div>
          <p className="font-medium text-ink">{l.name}</p>
          <p className="meta">{l.code}</p>
        </div>
      ),
    },
    { key: "brand", label: "Brand", render: (l) => <span className="text-body">{l.brandName || "—"}</span> },
    {
      key: "city",
      label: "City / State",
      sortable: true,
      render: (l) => (
        <span className="text-body">
          {l.city || "—"}
          {l.state ? <span className="meta block">{l.state}</span> : null}
        </span>
      ),
    },
    {
      key: "address",
      label: "Address",
      render: (l) => <span className="meta line-clamp-2 block max-w-[240px]">{l.address || "—"}</span>,
    },
    {
      key: "contactNumber",
      label: "Contact",
      render: (l) => (
        <span className="whitespace-nowrap text-body">
          {l.contactNumber || "—"}
          {l.email ? <span className="meta block">{l.email}</span> : null}
        </span>
      ),
    },
    { key: "status", label: "Status", sortable: true, render: (l) => <StatusBadge status={l.status} /> },
    { key: "created_at", label: "Created", sortable: true, render: (l) => <span className="whitespace-nowrap text-body">{formatDate(l.createdAt)}</span> },
    {
      key: "actions",
      label: "Actions",
      sticky: true,
      align: "right",
      render: (l) => (
        <div className="flex justify-end">
          <DropdownMenu items={menu(l)} label={`Actions for ${l.name}`} />
        </div>
      ),
    },
  ];

  const card = (l) => (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="font-medium text-ink">{l.name}</p>
        <p className="meta">{[l.code, l.brandName].filter(Boolean).join(" · ") || "No code"}</p>
        <p className="meta">{[l.city, l.state].filter(Boolean).join(", ") || "No city set"}</p>
        <div className="mt-1.5"><StatusBadge status={l.status} /></div>
      </div>
      <DropdownMenu items={menu(l)} label={`Actions for ${l.name}`} />
    </div>
  );

  return (
    <div className="page">
      <PageHeader
        title="Locations"
        description={list.data ? `${list.data.total} location${list.data.total === 1 ? "" : "s"} across your brands` : "\u00a0"}
        actions={
          canCreate && (
            <Button
              variant="primary"
              icon={Plus}
              disabled={activeBrands.length === 0}
              title={activeBrands.length === 0 ? "Add an active brand first" : undefined}
              onClick={() => setForm({ location: null })}
            >
              Add location
            </Button>
          )
        }
      />

      {!canUpdate && <ReadOnlyNotice what="locations" />}

      <section className="panel">
        <ListToolbar
          search={list.search}
          onSearch={list.setSearch}
          filters={[
            {
              key: "brandId",
              placeholder: "All brands",
              value: String(list.query.brandId || ""),
              options: brands.map((b) => ({ value: String(b.id), label: b.name })),
            },
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

        {list.error || brandsError ? (
          <ErrorState error={list.error || brandsError} onRetry={list.reload} />
        ) : !list.data ? (
          <div className="grid gap-3 p-4">
            {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
          </div>
        ) : list.data.items.length === 0 ? (
          <EmptyState
            icon={MapPin}
            title={list.hasFilters ? "No locations match these filters" : "No locations yet"}
            description={
              activeBrands.length === 0
                ? "Add an active brand first, then add its locations."
                : list.hasFilters
                ? "Try a different search or brand."
                : "Add the outlets that belong to your brands."
            }
            action={
              list.hasFilters ? (
                <Button size="sm" onClick={list.clear}>Clear filters</Button>
              ) : (
                canCreate && activeBrands.length > 0 && (
                  <Button size="sm" variant="primary" onClick={() => setForm({ location: null })}>Add location</Button>
                )
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
              minWidth={1080}
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

      <LocationFormDialog
        open={Boolean(form)}
        location={form?.location}
        brands={form?.location ? brands : activeBrands}
        defaultBrandId={list.query.brandId}
        onClose={() => setForm(null)}
        onSaved={list.reload}
      />

      <ConfirmDialog
        open={Boolean(toggling)}
        title={toggling?.status === "active" ? `Deactivate ${toggling?.name}?` : `Activate ${toggling?.name}?`}
        description={
          toggling?.status === "active"
            ? "It stops being offered for new leads and configuration. Its existing leads and history stay as they are."
            : "It becomes available again for new leads."
        }
        confirmLabel={toggling?.status === "active" ? "Deactivate" : "Activate"}
        tone={toggling?.status === "active" ? "danger" : "success"}
        loading={busy}
        onConfirm={confirmToggle}
        onClose={() => setToggling(null)}
      />

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete ${deleting?.name}?`}
        description="This removes the location permanently. Deactivate it instead if you want to keep its history."
        confirmLabel="Delete location"
        tone="danger"
        loading={busy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(null)}
      />
    </div>
  );
}

export default function LocationsView() {
  return (
    <Suspense>
      <LocationsContent />
    </Suspense>
  );
}
