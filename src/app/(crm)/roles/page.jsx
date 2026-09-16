import RequirePermission from "@/components/layout/RequirePermission";
import RolesView from "@/components/admin/RolesView";

export const metadata = { title: "Roles & permissions" };

export default function Page() {
  return (
    <RequirePermission permission="role.manage">
      <RolesView />
    </RequirePermission>
  );
}
