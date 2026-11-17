import RequirePermission from "@/components/layout/RequirePermission";
import PlaceholderModule from "@/components/common/PlaceholderModule";
import InvoicesView from "@/components/invoices/InvoicesView";
import { Suspense } from "react";
export const metadata = { title: "Proforma invoices" };

export default function Page() {
  return (
    <RequirePermission permission="invoice.view">
      <Suspense>
        <InvoicesView />
      </Suspense>
    </RequirePermission>
  );
}
