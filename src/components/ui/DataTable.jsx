"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { cx } from "@/lib/utils";

/**
 * Reusable list renderer: a sortable table on wide screens, cards on phones.
 *
 *   columns: [{ key, label, sortable, align, width, render(row) }]
 *   sort:    "name:asc"  (the parent owns it and re-queries on change)
 *   renderCard(row): mobile layout for one row
 */
export default function DataTable({ columns, rows, rowKey = (r) => r.id, sort, onSort, renderCard, minWidth = 900, busy }) {
  const [sortField, sortDir] = String(sort || "").split(":");

  const toggle = (key) => onSort?.(`${key}:${sortField === key && sortDir === "asc" ? "desc" : "asc"}`);

  return (
    <div className={cx(busy && "opacity-60 transition-opacity")} aria-busy={busy || undefined}>
      <div className="hidden overflow-x-auto lg:block">
        <table className="table" style={{ minWidth }}>
          <thead>
            <tr>
              {columns.map((c) => (
                <th
                  key={c.key}
                  style={c.width ? { width: c.width } : undefined}
                  className={cx(c.align === "right" && "text-right", c.sticky && "col-sticky-end")}
                  aria-sort={sortField === c.key ? (sortDir === "asc" ? "ascending" : "descending") : undefined}
                >
                  {c.sortable && onSort ? (
                    <button onClick={() => toggle(c.key)} className="inline-flex cursor-pointer items-center gap-1 hover:text-ink">
                      {c.label}
                      {sortField === c.key ? (
                        sortDir === "asc" ? <ArrowUp size={13} /> : <ArrowDown size={13} />
                      ) : (
                        <ChevronsUpDown size={13} className="text-faint" />
                      )}
                    </button>
                  ) : (
                    c.label
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)}>
                {columns.map((c) => (
                  <td key={c.key} className={cx(c.align === "right" && "text-right", c.sticky && "col-sticky-end", c.className)}>
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {renderCard && (
        <ul className="divide-y divide-line lg:hidden">
          {rows.map((row) => (
            <li key={rowKey(row)} className="px-4 py-3">
              {renderCard(row)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
