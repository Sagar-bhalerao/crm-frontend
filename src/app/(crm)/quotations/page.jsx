import RequirePermission from "@/components/layout/RequirePermission";
import PlaceholderModule from "@/components/common/PlaceholderModule";

export const metadata = { title: "Quotations" };

export default function Page() {
  return (
    <RequirePermission permission="quotation.view">
      <PlaceholderModule
        title="Quotations"
        description="All quotations across your leads."
        link={{ href: "/leads?status=quotation", label: "See leads at Quotation stage" }}
        plannedFeatures={["Search and filter quotations", "PDF quotation on brand letterhead", "Approval for discounts above a limit", "Rate cards per outlet"]}
      />
    </RequirePermission>
  );
}
