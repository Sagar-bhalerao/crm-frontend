import Link from "next/link";
import { Panel } from "@/components/ui";

/** Horizontal bars: [{ key, label, value }] */
export default function BreakdownBars({ title, rows, hrefFor }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  const total = rows.reduce((n, r) => n + r.value, 0);

  return (
    <Panel title={title}>
      <ul className="grid gap-3">
        {rows.map((r) => {
          const Row = hrefFor ? Link : "div";
          return (
            <li key={r.key}>
              <Row {...(hrefFor ? { href: hrefFor(r) } : {})} className="block group">
                <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
                  <span className="text-body group-hover:text-ink">{r.label}</span>
                  <span className="text-ink">
                    {r.value}
                    <span className="meta ml-1.5">{total ? Math.round((r.value / total) * 100) : 0}%</span>
                  </span>
                </div>
                <div className="h-2 rounded-full bg-subtle">
                  <div className="h-2 rounded-full bg-ink/80" style={{ width: `${(r.value / max) * 100}%` }} />
                </div>
              </Row>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
