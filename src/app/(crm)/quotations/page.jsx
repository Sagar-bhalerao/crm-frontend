import RequirePermission from "@/components/layout/RequirePermission";
import PlaceholderModule from "@/components/common/PlaceholderModule";
import QuotationsView from "@/components/quotations/QuotationsView";

export const metadata = { title: "Quotations" };

export default function Page() {
  return (
    <RequirePermission permission="quotation.view">
       <QuotationsView />
    </RequirePermission>
  );
}
