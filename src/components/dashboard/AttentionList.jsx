import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cx } from "@/lib/utils";
import { Panel } from "@/components/ui";

export default function AttentionList({ items }) {
  const total = items.reduce((n, i) => n + i.count, 0);
  return (
    <Panel title="Needs attention" description={total ? undefined : "Nothing waiting on you right now"} bodyClassName="p-0">
      <ul className="divide-y divide-line">
        {items.map((item) => (
          <li key={item.key}>
            <Link href={item.href} className={cx("flex items-center gap-3 px-4 py-3 hover:bg-subtle", !item.count && "pointer-events-none")}>
              <span
                className={cx(
                  "grid h-7 min-w-7 place-items-center rounded px-1.5 text-sm font-semibold",
                  item.count ? cx(`tone-${item.tone}`, "bg-[var(--tone-soft)] text-[var(--tone)]") : "bg-subtle text-faint"
                )}
              >
                {item.count}
              </span>
              <span className={cx("flex-1 text-sm", item.count ? "text-ink" : "text-muted")}>{item.label}</span>
              {item.count > 0 && <ChevronRight size={16} className="text-faint" />}
            </Link>
          </li>
        ))}
      </ul>
    </Panel>
  );
}
