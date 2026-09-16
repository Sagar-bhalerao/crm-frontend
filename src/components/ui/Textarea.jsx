import { forwardRef } from "react";
import { cx } from "@/lib/utils";

const Textarea = forwardRef(function Textarea({ error, className, rows = 3, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={cx("input textarea", error && "input-error", className)} {...props} />;
});

export default Textarea;
