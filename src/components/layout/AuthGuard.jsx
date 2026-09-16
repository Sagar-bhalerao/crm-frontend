"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { Spinner } from "@/components/ui";

/**
 * Client-side guard for the prototype.
 * Production: also protect routes server-side (Next.js proxy/middleware
 * reading the httpOnly session cookie) — the API enforces permissions.
 */
export default function AuthGuard({ children }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "anonymous") router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [status, pathname, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-dvh items-center justify-center">
        <Spinner label="Opening CRM" />
      </div>
    );
  }
  return children;
}
