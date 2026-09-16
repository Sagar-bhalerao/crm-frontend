import RequirePermission from "@/components/layout/RequirePermission";
import UsersView from "@/components/admin/UsersView";

export const metadata = { title: "Users" };

export default function Page() {
  return (
    <RequirePermission permission="user.manage">
      <UsersView />
    </RequirePermission>
  );
}
