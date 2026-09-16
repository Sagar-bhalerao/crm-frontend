"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { DATE_PRESETS, LEAD_TYPES, SORT_OPTIONS } from "@/config/leadOptions";
import { LEAD_STATUSES } from "@/config/leadStatuses";
import { Button, Field, Input, Modal, Select } from "@/components/ui";

const FILTER_KEYS = ["status", "outletId", "type", "assignedToId", "date"];

/**
 * Search, filters and sort for the leads list.
 * Desktop: inline bar. Mobile: search + a filter sheet.
 */
export default function LeadFilters({ query, search, onSearch, onChange, onClear, outlets = [], team = [], showTeam }) {
  const [sheetOpen, setSheetOpen] = useState(false);
  const activeCount = FILTER_KEYS.filter((k) => query[k]).length;
  const hasAny = activeCount > 0 || search;

  const statusOptions = LEAD_STATUSES.map((s) => ({ value: s.key, label: s.label }));
  const outletOptions = outlets.map((o) => ({ value: o.id, label: o.name }));
  const typeOptions = LEAD_TYPES.map((t) => ({ value: t.key, label: t.label }));
  const teamOptions = [{ value: "unassigned", label: "Unassigned" }, ...team.map((u) => ({ value: u.id, label: u.name }))];
  const dateOptions = DATE_PRESETS.filter((d) => d.key).map((d) => ({ value: d.key, label: d.label }));
  const sortOptions = SORT_OPTIONS.map((s) => ({ value: s.key, label: s.label }));

  const selects = (layout) => (
    <>
      <FilterSelect layout={layout} label="Status" placeholder="All statuses" options={statusOptions} value={query.status} onChange={(v) => onChange({ status: v })} />
      {outlets.length > 1 && (
        <FilterSelect layout={layout} label="Outlet" placeholder="All outlets" options={outletOptions} value={query.outletId} onChange={(v) => onChange({ outletId: v })} />
      )}
      <FilterSelect layout={layout} label="Lead type" placeholder="All lead types" options={typeOptions} value={query.type} onChange={(v) => onChange({ type: v })} />
      {showTeam && (
        <FilterSelect layout={layout} label="Sales POC" placeholder="Everyone" options={teamOptions} value={query.assignedToId} onChange={(v) => onChange({ assignedToId: v })} />
      )}
      <FilterSelect layout={layout} label="Created" placeholder="Any time" options={dateOptions} value={query.date} onChange={(v) => onChange({ date: v, from: "", to: "" })} />
      {query.date === "custom" && (
        <div className={layout === "sheet" ? "grid grid-cols-2 gap-3" : "flex items-center gap-2"}>
          <Field label={layout === "sheet" ? "From" : undefined}>
            {(p) => <Input {...p} type="date" aria-label="From date" value={query.from} onChange={(e) => onChange({ from: e.target.value })} className="lg:w-[150px]" />}
          </Field>
          <Field label={layout === "sheet" ? "To" : undefined}>
            {(p) => <Input {...p} type="date" aria-label="To date" value={query.to} onChange={(e) => onChange({ to: e.target.value })} className="lg:w-[150px]" />}
          </Field>
        </div>
      )}
    </>
  );

  return (
    <div className="border-b border-line p-3 sm:p-4">
      <div className="flex gap-2">
        <div className="relative flex-1 self-start lg:max-w-xs">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <Input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search name, mobile, email or lead ID"
            aria-label="Search leads"
            className="pl-9"
          />
        </div>

        {/* Desktop filters */}
        <div className="hidden flex-1 flex-wrap items-center gap-2 lg:flex">
          {selects("bar")}
          <Select aria-label="Sort" options={sortOptions} value={query.sort} onChange={(e) => onChange({ sort: e.target.value })} className="w-auto" />
          {hasAny && (
            <Button variant="ghost" size="sm" icon={X} onClick={onClear}>
              Clear filters
            </Button>
          )}
        </div>

        {/* Mobile filter button */}
        <Button className="lg:hidden" icon={SlidersHorizontal} onClick={() => setSheetOpen(true)}>
          Filters{activeCount > 0 ? ` (${activeCount})` : ""}
        </Button>
      </div>

      <Modal
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filter leads"
        footer={
          <>
            <Button variant="secondary" onClick={() => { onClear(); setSheetOpen(false); }}>
              Clear filters
            </Button>
            <Button variant="primary" onClick={() => setSheetOpen(false)}>
              Show results
            </Button>
          </>
        }
      >
        <div className="grid gap-4">
          {selects("sheet")}
          <FilterSelect layout="sheet" label="Sort by" options={sortOptions} value={query.sort} onChange={(v) => onChange({ sort: v })} />
        </div>
      </Modal>
    </div>
  );
}

function FilterSelect({ layout, label, placeholder, options, value, onChange }) {
  const select = (props = {}) => (
    <Select
      aria-label={layout === "bar" ? label : undefined}
      placeholder={placeholder}
      options={options}
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      className={layout === "bar" ? "w-auto min-w-[130px]" : ""}
      {...props}
    />
  );
  if (layout === "bar") return select();
  return <Field label={label}>{(p) => select(p)}</Field>;
}
