"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { MoreHorizontal } from "lucide-react";
import { useClickOutside } from "@/hooks/useClickOutside";
import { cx } from "@/lib/utils";

/**
 * Row actions menu. Uses the same popover styling as the header menus.
 *
 *   items: [{ key, label, icon, href, onClick, tone, separator, disabled }]
 * Falsy entries are ignored, so callers can inline permission checks.
 */
export default function DropdownMenu({ items, label = "Actions", align = "right", trigger }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);

  const visible = items.filter(Boolean);
  if (visible.length === 0) return null;

  const choose = (item) => {
    setOpen(false);
    item.onClick?.();
  };

  return (
    <div className="relative" ref={ref}>
      {trigger ? (
        <span onClick={() => setOpen((o) => !o)}>{trigger}</span>
      ) : (
        <button
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-haspopup="menu"
          aria-label={label}
          className="btn btn-ghost btn-sm w-8 px-0"
        >
          <MoreHorizontal size={16} />
        </button>
      )}

      {open && (
        <div role="menu" className={cx("popover w-56 py-1", align === "right" ? "right-0" : "left-0")}>
          {visible.map((item) => {
            const Icon = item.icon;
            const content = (
              <>
                {Icon && <Icon size={15} className={item.tone === "danger" ? "text-danger" : "text-muted"} />}
                {item.label}
              </>
            );
            const className = cx("menu-item", item.tone === "danger" && "text-danger hover:bg-danger-soft");

            return (
              <div key={item.key}>
                {item.separator && <div className="my-1 border-t border-line" />}
                {item.href ? (
                  <Link role="menuitem" href={item.href} className={className} onClick={() => setOpen(false)}>
                    {content}
                  </Link>
                ) : (
                  <button role="menuitem" className={className} disabled={item.disabled} onClick={() => choose(item)}>
                    {content}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
