import { Suspense } from "react";
import RequirePermission from "@/components/layout/RequirePermission";
import LeadsListView from "@/components/leads/LeadsListView";
import LeadsView from "@/components/leads/LeadsView";
// import LeadsListsView from "@/components/leads/LeadsListView";

export const metadata = { title: "Leads" };

export default function Page() {
  return (
    <RequirePermission permission="lead.view">
      <Suspense>
        <LeadsListView />
      </Suspense>
    </RequirePermission>
  );
}
