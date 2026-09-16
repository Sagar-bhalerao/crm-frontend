import RequirePermission from "@/components/layout/RequirePermission";
import DashboardView from "@/components/dashboard/DashboardView";

export const metadata = { title: "Dashboard" };

export default function Page() {
  return (
    <RequirePermission permission="lead.view">
      <DashboardView />
    </RequirePermission>
  );
}
