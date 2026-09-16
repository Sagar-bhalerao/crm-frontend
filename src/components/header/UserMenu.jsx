"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, LogOut, RotateCcw } from "lucide-react";
import { DATA_SOURCE } from "@/config/app";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { useClickOutside } from "@/hooks/useClickOutside";
import { leadService } from "@/services";
import { Avatar } from "@/components/ui";

export default function UserMenu() {
  const { user, logout } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useClickOutside(ref, () => setOpen(false), open);

  const handleLogout = async () => {
    await logout();
    router.replace("/login");
  };

  const handleReset = async () => {
    setOpen(false);
    await leadService.resetDemoData();
    toast.success("Sample data restored");
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex h-9 items-center gap-2 rounded-md pl-1 pr-1.5 hover:bg-subtle sm:pr-2"
      >
        <Avatar name={user.name} />
        <span className="hidden text-left leading-tight md:block">
          <span className="block text-[13px] font-medium text-ink">{user.name}</span>
          <span className="block text-xs text-muted">{user.role.label}</span>
        </span>
        <ChevronDown size={15} className="hidden text-muted md:block" />
      </button>

      {open && (
        <div role="menu" className="popover right-0 w-64 py-1">
          <div className="border-b border-line px-3 pb-2.5 pt-2">
            <p className="text-sm font-medium text-ink">{user.name}</p>
            <p className="meta truncate">{user.email}</p>
            <p className="meta mt-1">{user.title}</p>
          </div>
          {DATA_SOURCE === "mock" && (
            <button role="menuitem" className="menu-item" onClick={handleReset}>
              <RotateCcw size={15} className="text-muted" />
              Restore sample data
            </button>
          )}
          <button role="menuitem" className="menu-item" onClick={handleLogout}>
            <LogOut size={15} className="text-muted" />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}
