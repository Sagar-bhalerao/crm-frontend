"use client";

import { cx } from "@/lib/utils";

/** tabs: [{ key, label, count? }] */
export default function Tabs({ tabs, value, onChange, className }) {
  return (
    <div role="tablist" className={cx("flex gap-1 overflow-x-auto border-b border-line -mb-px", className)}>
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(t.key)}
            className={cx(
              "relative flex h-10 shrink-0 items-center gap-1.5 px-3 text-sm font-medium transition-colors cursor-pointer",
              active ? "text-ink" : "text-muted hover:text-ink"
            )}
          >
            {t.label}
            {t.count != null && (
              <span className={cx("rounded px-1.5 text-xs", active ? "bg-ink text-white" : "bg-subtle text-muted")}>{t.count}</span>
            )}
            {active && <span className="absolute inset-x-2 bottom-0 h-0.5 rounded bg-ink" />}
          </button>
        );
      })}
    </div>
  );
}
