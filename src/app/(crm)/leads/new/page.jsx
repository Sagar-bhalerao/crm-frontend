import RequirePermission from "@/components/layout/RequirePermission";
import NewLeadView from "@/components/leads/NewLeadView";

export const metadata = { title: "New lead" };

export default function Page() {
  return (
    <RequirePermission permission="lead.create">
      <NewLeadView />
    </RequirePermission>
  );
}
