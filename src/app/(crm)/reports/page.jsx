import RequirePermission from "@/components/layout/RequirePermission";
import PlaceholderModule from "@/components/common/PlaceholderModule";

export const metadata = { title: "Reports" };

export default function Page() {
  return (
    <RequirePermission permission="report.view">
      <PlaceholderModule
        title="Reports"
        description="Sales performance across brands, outlets and Sales POCs."
        link={{ href: "/dashboard", label: "Open dashboard" }}
        plannedFeatures={["Conversion by outlet and Sales POC", "Response time to new leads", "Revenue from finalized bookings", "Export to Excel"]}
      />
    </RequirePermission>
  );
}
