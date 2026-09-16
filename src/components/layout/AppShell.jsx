"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Sidebar from "@/components/sidebar/Sidebar";
import Header from "@/components/header/Header";

export default function AppShell({ children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();

  // Close the mobile drawer after navigating
  useEffect(() => setDrawerOpen(false), [pathname]);

  return (
    <div className="min-h-dvh lg:pl-[248px]">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[248px] border-r border-line bg-surface lg:block">
        <Sidebar />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="absolute inset-0 bg-ink/45" onClick={() => setDrawerOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-[280px] max-w-[85vw] bg-surface shadow-xl animate-[drawer-in_180ms_ease-out]">
            <Sidebar onClose={() => setDrawerOpen(false)} />
          </aside>
        </div>
      )}

      <Header onMenuClick={() => setDrawerOpen(true)} />
      <main id="main">{children}</main>
    </div>
  );
}
