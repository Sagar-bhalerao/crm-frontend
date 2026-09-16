import RequirePermission from "@/components/layout/RequirePermission";
import FollowUpsView from "@/components/leads/FollowUpsView";

export const metadata = { title: "Follow-ups" };

export default function Page() {
  return (
    <RequirePermission permission="lead.view">
      <FollowUpsView />
    </RequirePermission>
  );
}
