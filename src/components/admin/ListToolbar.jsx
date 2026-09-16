"use client";

import { Search, X } from "lucide-react";
import { Button, Input, Select } from "@/components/ui";

/**
 * Search + filter bar shared by the configuration lists.
 * filters: [{ key, placeholder, value, options }]
 */
export default function ListToolbar({ search, onSearch, filters = [], sortOptions, sort, onChange, onClear, showClear }) {
  return (
    <div className="border-b border-line p-3 sm:p-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative sm:w-64">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <Input
            type="search"
            value={search}
            onChange={(e) => onSearch(e.target.value)}
            placeholder="Search name or code"
            aria-label="Search"
            className="pl-9"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {filters.map((f) => (
            <Select
              key={f.key}
              aria-label={f.placeholder}
              placeholder={f.placeholder}
              options={f.options}
              value={f.value}
              onChange={(e) => onChange({ [f.key]: e.target.value })}
              className="w-auto"
            />
          ))}
          {sortOptions && (
            <Select
              aria-label="Sort"
              options={sortOptions}
              value={sort}
              onChange={(e) => onChange({ sort: e.target.value })}
              className="w-auto"
            />
          )}
          {showClear && (
            <Button variant="ghost" size="sm" icon={X} onClick={onClear}>
              Clear
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
