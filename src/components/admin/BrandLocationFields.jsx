"use client";

import { useEffect, useState } from "react";
import { brandService } from "@/services/admin";
import { Field, Select } from "@/components/ui";

const isActive = (item) => Number(item?.status) === 1;

/**
 * Active items from a master list, plus the one already saved on this record
 * even if it has since been deactivated, so editing never silently drops it.
 */
function toOptions(items, savedId) {
  return items
    .filter((item) => isActive(item) || String(item.id) === String(savedId))
    .map((item) => ({ value: String(item.id), label: isActive(item) ? item.name : `${item.name} (inactive)` }));
}

/**
 * Brand and Location dropdowns fed by the Brands and Locations masters.
 * Choosing a brand loads only that brand's locations and clears the location,
 * so a configuration can never pair a brand with another brand's outlet.
 *
 *   brands:   items from brandService.listBrands (loaded once by the page)
 *   saved:    { brandId, locationId } of the record being edited, if any
 *   onChange: receives { brandId, locationId } patches
 */
export default function BrandLocationFields({ brands, brandId, locationId, saved, onChange, errors = {}, disabled }) {
  const [locations, setLocations] = useState(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    if (!brandId) {
      setLocations([]);
      return undefined;
    }
    let alive = true;
    setLocations(null);
    setLoadError(false);
    brandService
      .listBrandLocations(brandId, { pageSize: 100, sort: "name:asc" })
      .then((res) => alive && setLocations(res.items))
      .catch(() => {
        if (!alive) return;
        setLocations([]);
        setLoadError(true);
      });
    return () => {
      alive = false;
    };
  }, [brandId]);

  const brandOptions = toOptions(brands || [], saved?.brandId);
  const locationOptions = toOptions(locations || [], saved?.locationId);
  const noLocations = Boolean(brandId) && locations !== null && !loadError && locationOptions.length === 0;

  let locationPlaceholder = "Choose a location";
  if (!brandId) locationPlaceholder = "Choose a brand first";
  else if (locations === null) locationPlaceholder = "Loading locations…";

  return (
    <>
      <Field label="Brand" required error={errors.brandId}>
        {(p) => (
          <Select
            {...p}
            value={brandId}
            disabled={disabled || !brands}
            placeholder={brands ? "Choose a brand" : "Loading brands…"}
            options={brandOptions}
            onChange={(e) => onChange({ brandId: e.target.value, locationId: "" })}
          />
        )}
      </Field>

      <Field
        label="Location"
        required
        error={errors.locationId || (loadError ? "Could not load this brand's locations. Try choosing the brand again." : undefined)}
        hint={noLocations ? "This brand has no active locations. Add one under Locations first." : undefined}
      >
        {(p) => (
          <Select
            {...p}
            value={locationId}
            disabled={disabled || !brandId || locations === null}
            placeholder={locationPlaceholder}
            options={locationOptions}
            onChange={(e) => onChange({ locationId: e.target.value })}
          />
        )}
      </Field>
    </>
  );
}
