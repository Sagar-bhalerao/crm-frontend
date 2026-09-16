import { Lock } from "lucide-react";

/** Shown to roles that can look at global settings but not change them. */
export default function ReadOnlyNotice({ what = "these settings" }) {
  return (
    <p className="mb-4 flex items-start gap-2 rounded-md bg-subtle px-3 py-2.5 text-[13px] text-body">
      <Lock size={15} className="mt-0.5 shrink-0 text-muted" />
      You can view {what} but not change them. Only a Super Admin can.
    </p>
  );
}
