"use client";

import { ShieldOff } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { EmptyState } from "@/components/ui";

/** Wrap a page (or part of one) that needs a permission. */
export default function RequirePermission({ permission, children, fallback }) {
  const { can } = useAuth();
  if (can(permission)) return children;
  if (fallback !== undefined) return fallback;
  return (
    <div className="page">
      <div className="panel">
        <EmptyState
          icon={ShieldOff}
          title="You don't have access to this page"
          description="Ask a CRM admin to update your role if you need it."
        />
      </div>
    </div>
  );
}
