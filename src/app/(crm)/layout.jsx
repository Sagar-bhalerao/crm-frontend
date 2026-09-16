import AuthGuard from "@/components/layout/AuthGuard";
import AppShell from "@/components/layout/AppShell";

/** Every signed-in CRM screen shares this shell. */
export default function CrmLayout({ children }) {
  return (
    <AuthGuard>
      <AppShell>{children}</AppShell>
    </AuthGuard>
  );
}
