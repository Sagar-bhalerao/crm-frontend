import RequirePermission from "@/components/layout/RequirePermission";
import BrandsView from "@/components/admin/BrandsView";

export const metadata = { title: "Brands" };

export default function Page() {
  return (
    <RequirePermission permission="brand.view">
      <BrandsView />
    </RequirePermission>
  );
}
