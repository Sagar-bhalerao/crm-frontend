import RequirePermission from "@/components/layout/RequirePermission";
import BrandDetailView from "@/components/admin/BrandDetailView";

export const metadata = { title: "Brand" };

export default async function Page({ params }) {
  const { id } = await params;
  return (
    <RequirePermission permission="brand.view">
      <BrandDetailView id={id} />
    </RequirePermission>
  );
}
