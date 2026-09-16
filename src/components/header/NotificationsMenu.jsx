"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { notificationService } from "@/services";
import { useQuery } from "@/hooks/useQuery";
import { useClickOutside } from "@/hooks/useClickOutside";
import { EVENTS } from "@/lib/events";
import { formatRelative } from "@/lib/format";
import { cx } from "@/lib/utils";

export default function NotificationsMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const router = useRouter();
  useClickOutside(ref, () => setOpen(false), open);

  const { data = [] } = useQuery(() => notificationService.listNotifications(), [], {
    refreshOn: [EVENTS.NOTIFICATIONS_CHANGED],
  });
  const items = data || [];
  const unread = items.filter((n) => !n.read).length;

  const openLead = (leadId) => {
    setOpen(false);
    router.push(`/leads/${leadId}`);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="btn btn-ghost relative w-9 px-0"
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
      >
        <Bell size={18} />
        {unread > 0 && (
          <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-semibold text-white">
            {unread}
          </span>
        )}
      </button>

      {open && (
        <div className="popover right-0 w-[min(360px,calc(100vw-24px))] -mr-12 sm:mr-0">
          <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
            <p className="text-sm font-medium text-ink">Notifications</p>
            {unread > 0 && (
              <button onClick={() => notificationService.markAllRead()} className="link text-[13px]">
                Mark all as read
              </button>
            )}
          </div>
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted">You&apos;re all caught up.</p>
          ) : (
            <ul className="max-h-96 overflow-y-auto py-1">
              {items.map((n) => (
                <li key={n.id}>
                  <button onClick={() => openLead(n.leadId)} className="menu-item items-start gap-3 py-2.5">
                    <span className={cx("mt-1.5 h-2 w-2 shrink-0 rounded-full", n.read ? "bg-transparent" : "bg-accent")} aria-hidden />
                    <span className="min-w-0">
                      <span className={cx("block text-sm", n.read ? "text-body" : "font-medium text-ink")}>{n.message}</span>
                      <span className="meta">{formatRelative(n.at)}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
