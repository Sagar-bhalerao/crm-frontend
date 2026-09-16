import { initials } from "@/lib/format";
import { cx } from "@/lib/utils";

const SIZES = { xs: "h-6 w-6 text-[10px]", sm: "h-8 w-8 text-xs", md: "h-9 w-9 text-sm" };

export default function Avatar({ name, size = "sm", className }) {
  return (
    <span
      className={cx("inline-flex shrink-0 items-center justify-center rounded-full bg-[#e3e8f0] font-semibold text-ink", SIZES[size], className)}
      aria-hidden
    >
      {initials(name || "?")}
    </span>
  );
}
