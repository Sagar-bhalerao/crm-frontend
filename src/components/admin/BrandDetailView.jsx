"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, MapPin, Pencil, Plus } from "lucide-react";
import { P } from "@/config/permissions";
import { useAuth } from "@/context/AuthContext";
import { useAction } from "@/hooks/useAction";
import { formatDateTime } from "@/lib/format";
import { brandService } from "@/services/admin";
import {
  Button, ConfirmDialog, DataTable, DropdownMenu, EmptyState, ErrorState,
  Panel, Skeleton, StatusBadge,
} from "@/components/ui";
import BrandFormDialog from "./BrandFormDialog";
import { brandActions } from "./BrandsView";
import LocationFormDialog from "./LocationFormDialog";
import ReadOnlyNotice from "./ReadOnlyNotice";

/** One brand: its details and the locations that belong to it. */
export default function BrandDetailView({ id }) {
  const { can } = useAuth();
  const router = useRouter();
  const [brand, setBrand] = useState(null);
  const [locations, setLocations] = useState(null);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(false);
  const [addingLocation, setAddingLocation] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [run, busy] = useAction();

  const canUpdate = can(P.BRAND_UPDATE);
  const canDelete = can(P.BRAND_DELETE);
  const canAddLocation = can(P.LOCATION_CREATE);

  const load = async () => {
    setError(null);
    try {
      const [b, l] = await Promise.all([
        brandService.getBrand(id),
        can(P.LOCATION_VIEW) ? brandService.listBrandLocations(id, { pageSize: 100, sort: "name:asc" }) : Promise.resolve({ items: [] }),
      ]);
      setBrand(b);
      setLocations(l.items);
    } catch (err) {
      setError(err);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (error) {
    return (
      <div className="page">
        <div className="panel">
          <ErrorState error={error} onRetry={load} />
          <p className="pb-8 text-center">
            <Link href="/brands" className="link text-sm">Back to brands</Link>
          </p>
        </div>
      </div>
    );
  }

  if (!brand) {
    return (
      <div className="page">
        <Skeleton className="mb-2 h-7 w-56" />
        <Skeleton className="mb-5 h-4 w-72" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const confirmToggle = async () => {
    const next = brand.status === "active" ? "inactive" : "active";
    const updated = await run(() => brandService.setBrandStatus(brand.id, next), {
      success: next === "active" ? "Brand activated" : "Brand deactivated",
    });
    setToggling(false);
    if (updated) load();
  };

  const confirmDelete = async () => {
    const ok = await run(() => brandService.deleteBrand(brand.id), { success: `${brand.name} deleted` });
    setDeleting(false);
    if (ok) router.push("/brands");
  };

  const activeLocations = (locations || []).filter((l) => l.status === "active").length;

  return (
    <div className="page">
      <Link href="/brands" className="mb-3 inline-flex items-center gap-1 text-[13px] text-muted hover:text-ink">
        <ArrowLeft size={14} /> Brands
      </Link>

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <h1 className="page-title">{brand.name}</h1>
            <StatusBadge status={brand.status} />
          </div>
          <p className="meta mt-1">
            Code {brand.code} · {brand.locationCount ?? 0} location{(brand.locationCount ?? 0) === 1 ? "" : "s"}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          {canUpdate && <Button icon={Pencil} onClick={() => setEditing(true)}>Edit brand</Button>}
          <DropdownMenu
            items={brandActions(brand, {
              canUpdate,
              canDelete,
              onEdit: () => setEditing(true),
              onToggle: () => setToggling(true),
              onDelete: () => setDeleting(true),
            }).filter((i) => i && i.key !== "view")}
            label="Brand actions"
          />
        </div>
      </div>

      {!canUpdate && <ReadOnlyNotice what="this brand" />}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel
          title="Locations"
          description={locations ? `${activeLocations} active of ${locations.length}` : undefined}
          bodyClassName="p-0"
          actions={
            canAddLocation &&
            brand.status === "active" && (
              <Button size="sm" icon={Plus} onClick={() => setAddingLocation(true)}>Add location</Button>
            )
          }
        >
          {!locations ? (
            <div className="grid gap-3 p-4">
              {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-10" />)}
            </div>
          ) : locations.length === 0 ? (
            <EmptyState
              icon={MapPin}
              title="No locations for this brand"
              description={
                brand.status === "active"
                  ? "Add the outlets that belong to it."
                  : "Activate the brand before adding locations."
              }
              action={
                canAddLocation && brand.status === "active" && (
                  <Button size="sm" variant="primary" onClick={() => setAddingLocation(true)}>Add location</Button>
                )
              }
            />
          ) : (
            <DataTable
              minWidth={620}
              rows={locations}
              columns={[
                {
                  key: "name",
                  label: "Location",
                  render: (l) => (
                    <div>
                      <p className="font-medium text-ink">{l.name}</p>
                      <p className="meta">{l.code}</p>
                    </div>
                  ),
                },
                { key: "city", label: "City / State", render: (l) => <span className="text-body">{[l.city, l.state].filter(Boolean).join(", ") || "—"}</span> },
                { key: "contactNumber", label: "Contact", render: (l) => <span className="whitespace-nowrap text-body">{l.contactNumber || "—"}</span> },
                { key: "status", label: "Status", render: (l) => <StatusBadge status={l.status} /> },
              ]}
              renderCard={(l) => (
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-medium text-ink">{l.name}</p>
                    <p className="meta">{[l.code, l.city].filter(Boolean).join(" · ")}</p>
                  </div>
                  <StatusBadge status={l.status} />
                </div>
              )}
            />
          )}
          {locations && locations.length > 0 && (
            <div className="border-t border-line px-4 py-3">
              <Link href={`/locations?brandId=${brand.id}`} className="link text-[13px]">
                Manage these locations
              </Link>
            </div>
          )}
        </Panel>

        <div className="grid content-start gap-4">
          <Panel title="Brand details">
            <dl className="dl">
              <div><dt>Name</dt><dd>{brand.name}</dd></div>
              <div><dt>Code</dt><dd>{brand.code}</dd></div>
              <div><dt>Status</dt><dd><StatusBadge status={brand.status} /></dd></div>
              <div><dt>Description</dt><dd>{brand.description || "Not set"}</dd></div>
              <div>
                <dt>Logo</dt>
                <dd>
                  {brand.logoUrl ? (
                    <a href={brand.logoUrl} target="_blank" rel="noreferrer" className="link break-all">{brand.logoUrl}</a>
                  ) : (
                    "Not set"
                  )}
                </dd>
              </div>
            </dl>
          </Panel>

          <Panel title="History">
            <dl className="dl">
              <div><dt>Created</dt><dd>{formatDateTime(brand.createdAt)}</dd></div>
              <div><dt>Last updated</dt><dd>{formatDateTime(brand.updatedAt)}</dd></div>
            </dl>
            <p className="meta mt-3 flex gap-2">
              <Building2 size={14} className="mt-0.5 shrink-0 text-muted" />
              Leads still read brands from the sample data. They move onto this record when the lead module connects to the API.
            </p>
          </Panel>
        </div>
      </div>

      <BrandFormDialog open={editing} brand={brand} onClose={() => setEditing(false)} onSaved={load} />

      <LocationFormDialog
        open={addingLocation}
        brands={[brand]}
        defaultBrandId={brand.id}
        onClose={() => setAddingLocation(false)}
        onSaved={load}
      />

      <ConfirmDialog
        open={toggling}
        title={brand.status === "active" ? `Deactivate ${brand.name}?` : `Activate ${brand.name}?`}
        description={
          brand.status === "active"
            ? "It stops being offered for new configuration. Its locations, leads and history stay exactly as they are."
            : "It becomes available again for new locations and leads."
        }
        confirmLabel={brand.status === "active" ? "Deactivate" : "Activate"}
        tone={brand.status === "active" ? "danger" : "success"}
        loading={busy}
        onConfirm={confirmToggle}
        onClose={() => setToggling(false)}
      />

      <ConfirmDialog
        open={deleting}
        title={`Delete ${brand.name}?`}
        description="This removes the brand permanently. If you only want to stop using it, deactivate it instead so its history is kept."
        confirmLabel="Delete brand"
        tone="danger"
        loading={busy}
        onConfirm={confirmDelete}
        onClose={() => setDeleting(false)}
      >
        {(brand.locationCount ?? 0) > 0 && (
          <p className="mt-3 rounded-md bg-danger-soft px-3 py-2 text-[13px] text-danger">
            {brand.locationCount} location{brand.locationCount === 1 ? " is" : "s are"} still linked to this brand, so it cannot be deleted. Move or delete them first, or deactivate the brand.
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}
