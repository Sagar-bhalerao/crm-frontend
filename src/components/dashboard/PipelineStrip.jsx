import Link from "next/link";
import { LEAD_STATUSES } from "@/config/leadStatuses";
import { formatNumber } from "@/lib/format";
import { cx } from "@/lib/utils";

/**
 * Lead counts per status as one connected strip, with a proportion bar.
 * Each cell opens the lead list filtered by that status.
 */
export default function PipelineStrip({ total, byStatus }) {
  const cells = [
    { key: "", label: "Total leads", value: total, tone: null },
    ...LEAD_STATUSES.map((s) => ({ key: s.key, label: s.label, value: byStatus[s.key] || 0, tone: s.tone })),
  ];

  return (
    <section className="panel overflow-hidden" aria-label="Leads by status">
      <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-4 xl:grid-cols-7">
        {cells.map((c) => (
          <Link
            key={c.key || "total"}
            href={c.key ? `/leads?status=${c.key}` : "/leads"}
            className={cx("group bg-surface px-4 py-3.5 transition-colors hover:bg-subtle", c.tone && `tone-${c.tone}`)}
          >
            <span className="flex items-center gap-1.5 text-[13px] text-muted group-hover:text-ink">
              {c.tone && <span className="badge-dot" aria-hidden />}
              {c.label}
            </span>
            <span className="mt-1 block text-2xl font-semibold tracking-tight text-ink">{formatNumber(c.value)}</span>
          </Link>
        ))}
        {/* Filler so the last row stays white on uneven grids */}
        <span className="bg-surface xl:hidden" />
      </div>

      {total > 0 && (
        <div className="flex h-1.5 w-full" aria-hidden>
          {LEAD_STATUSES.map((s) =>
            byStatus[s.key] ? (
              <span key={s.key} className={cx(`tone-${s.tone}`, "bg-[var(--tone)]")} style={{ width: `${(byStatus[s.key] / total) * 100}%` }} />
            ) : null
          )}
        </div>
      )}
    </section>
  );
}
