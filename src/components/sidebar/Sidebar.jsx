"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { NAV_SECTIONS } from "@/config/navigation";
import { APP_NAME } from "@/config/app";
import { useAuth } from "@/context/AuthContext";
import { useQuery } from "@/hooks/useQuery";
import { orgService } from "@/services";
import { cx } from "@/lib/utils";

export default function Sidebar({ onClose }) {
  const pathname = usePathname();
  const { user, can } = useAuth();
  const { data: outlets } = useQuery(() => orgService.listOutlets(), [user?.id], { refreshOn: [] });

  const sections = NAV_SECTIONS.map((s) => ({ ...s, items: s.items.filter((i) => can(i.permission)) })).filter(
    (s) => s.items.length > 0
  );

  const scope = outlets
    ? user.outletIds.includes("*")
      ? `All outlets (${outlets.length})`
      : outlets.map((o) => o.name).join(", ")
    : "";

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center justify-between gap-2 border-b border-line px-4">
        <Link href="/dashboard" className="flex items-center gap-2.5">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-ink text-[13px] font-semibold text-white">N</span>
          <span className="text-[15px] font-semibold text-ink">{APP_NAME}</span>
        </Link>
        {onClose && (
          <button onClick={onClose} className="btn btn-ghost btn-sm w-8 px-0" aria-label="Close navigation">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Brand context: one brand in Phase 1, a switcher later */}
      <div className="border-b border-line px-4 py-3">
        <p className="text-[13px] font-medium text-ink">Dave &amp; Buster&apos;s India</p>
        <p className="meta truncate" title={scope}>
          {scope || "\u00a0"}
        </p>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3" aria-label="Main">
        {sections.map((section) => (
          <div key={section.label} className="mb-4">
            <p className="px-3 pb-1.5 text-xs font-medium text-faint">{section.label}</p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cx(
                        "relative flex h-9 items-center gap-2.5 rounded-md px-3 text-sm transition-colors",
                        active ? "bg-accent-soft font-medium text-ink" : "text-body hover:bg-subtle"
                      )}
                    >
                      {active && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r bg-accent" aria-hidden />}
                      <Icon size={17} className={active ? "text-accent" : "text-muted"} aria-hidden />
                      <span className="flex-1 truncate">{item.label}</span>
                      {item.phase === 2 && <span className="text-[11px] text-faint">Phase 2</span>}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="border-t border-line px-4 py-3">
        <p className="meta">Prototype with sample data</p>
      </div>
    </div>
  );
}
