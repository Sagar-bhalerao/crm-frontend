import Link from "next/link";
import { formatCompactCurrency, formatNumber } from "@/lib/format";
import { cx } from "@/lib/utils";

const TONE = {
  new: "blue", assigned: "violet", in_progress: "amber", quotation: "violet",
  proforma_invoice: "teal", finalized: "green", not_interested: "gray", cancelled: "red",
};

// The stages where a lead has a price attached, so the value means something
const VALUED = ["quotation", "proforma_invoice", "finalized"];

/**
 * Lead counts per status as one connected strip, with the deal value under
 * the stages that have one, and a proportion bar underneath.
 * byStatus: [{ key, label, count, value }] in workflow order, from the API.
 */
export default function PipelineStrip({ total, byStatus }) {
  const cells = [{ key: "", label: "Total leads", count: total }, ...byStatus];

  return (
    <section className="panel overflow-hidden" aria-label="Leads by status">
      <div className="grid grid-cols-2 gap-px bg-line sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-9">
        {cells.map((c) => (
          <Link
            key={c.key || "total"}
            href={c.key ? `/leads?status=${c.key}` : "/leads"}
            className={cx("group bg-surface px-4 py-3.5 transition-colors hover:bg-subtle", c.key && `tone-${TONE[c.key] || "gray"}`)}
          >
            <span className="flex items-center gap-1.5 text-[13px] text-muted group-hover:text-ink">
              {c.key && <span className="badge-dot" aria-hidden />}
              <span className="truncate">{c.label}</span>
            </span>
            <span className="mt-1 block text-2xl font-semibold tracking-tight text-ink">{formatNumber(c.count)}</span>
            {VALUED.includes(c.key) && (
              <span className="block text-[13px] font-medium text-[var(--tone)]">{formatCompactCurrency(c.value)}</span>
            )}
          </Link>
        ))}
        {/* 9 cells leave one empty slot on 2- and 5-column grids; keep it white */}
        <span className="bg-surface sm:hidden lg:block xl:hidden" />
      </div>

      {total > 0 && (
        <div className="flex h-1.5 w-full" aria-hidden>
          {byStatus.map((s) =>
            s.count ? (
              <span
                key={s.key}
                className={cx(`tone-${TONE[s.key] || "gray"}`, "bg-[var(--tone)]")}
                style={{ width: `${(s.count / total) * 100}%` }}
              />
            ) : null
          )}
        </div>
      )}
    </section>
  );
}