import { forwardRef } from "react";
import { cx } from "@/lib/utils";

/**
 * <Select options={[{ value, label }]} placeholder="All outlets" />
 */
const Select = forwardRef(function Select({ options = [], placeholder, error, className, ...props }, ref) {
  return (
    <select ref={ref} className={cx("input select", error && "input-error", className)} {...props}>
      {placeholder !== undefined && <option value="">{placeholder}</option>}
      {options.map((o) => (
        <option key={o.value} value={o.value} disabled={o.disabled}>
          {o.label}
        </option>
      ))}
    </select>
  );
});

export default Select;
