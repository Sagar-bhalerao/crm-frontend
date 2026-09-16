import RequirePermission from "@/components/layout/RequirePermission";
import LocationsView from "@/components/admin/LocationsView";

export const metadata = { title: "Locations" };

export default function Page() {
  return (
    <RequirePermission permission="location.view">
      <LocationsView />
    </RequirePermission>
  );
}
