import RequirePermission from "@/components/layout/RequirePermission";
import PlaceholderModule from "@/components/common/PlaceholderModule";

export const metadata = { title: "Proforma invoices" };

export default function Page() {
  return (
    <RequirePermission permission="invoice.view">
      <PlaceholderModule
        title="Proforma invoices"
        description="Invoices shared with customers and advance payments."
        link={{ href: "/leads?status=proforma_invoice", label: "See leads at Proforma invoice stage" }}
        plannedFeatures={["GST-compliant PDF invoices", "Payment link and advance tracking", "Payment reconciliation", "Tax invoice after the event"]}
      />
    </RequirePermission>
  );
}
