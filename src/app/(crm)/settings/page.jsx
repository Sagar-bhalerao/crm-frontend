import RequirePermission from "@/components/layout/RequirePermission";
import SettingsView from "@/components/admin/SettingsView";

export const metadata = { title: "Configuration" };

export default function Page() {
  return (
    <RequirePermission permission="settings.view">
      <SettingsView />
    </RequirePermission>
  );
}
