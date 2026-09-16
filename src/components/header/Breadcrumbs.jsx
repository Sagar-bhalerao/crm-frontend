"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { BREADCRUMB_LABELS } from "@/config/navigation";

/**
 * Built from the URL. Lead IDs are human-readable so they show as-is;
 * numeric database ids would mean nothing, so they show as "Details".
 */
export default function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex min-w-0 items-center gap-1 text-sm">
        {segments.map((seg, i) => {
          const href = "/" + segments.slice(0, i + 1).join("/");
          const label = BREADCRUMB_LABELS[seg] || (/^\d+$/.test(seg) ? "Details" : decodeURIComponent(seg));
          const last = i === segments.length - 1;
          return (
            <li key={href} className={`flex min-w-0 items-center gap-1 ${last ? "" : "hidden sm:flex"}`}>
              {i > 0 && <ChevronRight size={14} className="shrink-0 text-faint hidden sm:block" aria-hidden />}
              {last ? (
                <span aria-current="page" className="truncate font-medium text-ink">
                  {label}
                </span>
              ) : (
                <Link href={href} className="truncate text-muted hover:text-ink">
                  {label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
