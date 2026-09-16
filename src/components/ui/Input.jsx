import { forwardRef } from "react";
import { cx } from "@/lib/utils";

const Input = forwardRef(function Input({ error, className, ...props }, ref) {
  return <input ref={ref} className={cx("input", error && "input-error", className)} {...props} />;
});

export default Input;
