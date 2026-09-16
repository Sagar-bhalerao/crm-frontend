"use client";

import { useState } from "react";
import { Menu, Send } from "lucide-react";
import { P } from "@/config/permissions";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui";
import SimulateEnquiryDialog from "@/components/leads/SimulateEnquiryDialog";
import Breadcrumbs from "./Breadcrumbs";
import NotificationsMenu from "./NotificationsMenu";
import UserMenu from "./UserMenu";

export default function Header({ onMenuClick }) {
  const { can } = useAuth();
  const [simulateOpen, setSimulateOpen] = useState(false);

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-2 border-b border-line bg-surface/95 px-3 backdrop-blur sm:px-5">
      <button onClick={onMenuClick} className="btn btn-ghost w-9 px-0 lg:hidden" aria-label="Open navigation">
        <Menu size={20} />
      </button>

      <div className="min-w-0 flex-1">
        <Breadcrumbs />
      </div>

      {can(P.DEMO_SIMULATE) && (
        <>
          <Button size="sm" icon={Send} onClick={() => setSimulateOpen(true)} className="hidden sm:inline-flex">
            Simulate website enquiry
          </Button>
          <Button size="sm" icon={Send} iconOnly onClick={() => setSimulateOpen(true)} className="sm:hidden">
            Simulate website enquiry
          </Button>
          <SimulateEnquiryDialog open={simulateOpen} onClose={() => setSimulateOpen(false)} />
        </>
      )}
      <NotificationsMenu />
      <UserMenu />
    </header>
  );
}
