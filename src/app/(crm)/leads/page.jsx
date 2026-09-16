import { Suspense } from "react";
import RequirePermission from "@/components/layout/RequirePermission";
import LeadsView from "@/components/leads/LeadsView";

export const metadata = { title: "Leads" };

export default function Page() {
  return (
    <RequirePermission permission="lead.view">
      <Suspense>
        <LeadsView />
      </Suspense>
    </RequirePermission>
  );
}
