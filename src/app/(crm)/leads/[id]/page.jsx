import { Suspense } from "react";
import RequirePermission from "@/components/layout/RequirePermission";
import LeadDetailView from "@/components/leads/LeadDetailView";

export async function generateMetadata({ params }) {
  const { id } = await params;
  return { title: id };
}

export default async function Page({ params }) {
  const { id } = await params;
  return (
    <RequirePermission permission="lead.view">
      <Suspense>
        <LeadDetailView id={decodeURIComponent(id)} />
      </Suspense>
    </RequirePermission>
  );
}
