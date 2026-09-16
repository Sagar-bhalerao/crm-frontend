import { useId } from "react";
import { cx } from "@/lib/utils";

/**
 * Label + control + hint/error. Passes id/aria props to the child control.
 * <Field label="Mobile" error={errors.mobile} required>{(p) => <Input {...p} />}</Field>
 */
export default function Field({ label, hint, error, required, className, children }) {
  const id = useId();
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined;
  const controlProps = { id, "aria-invalid": Boolean(error) || undefined, "aria-describedby": describedBy, error };

  return (
    <div className={cx("min-w-0", className)}>
      {label && (
        <label htmlFor={id} className="label">
          {label}
          {required && <span className="text-danger ml-0.5" aria-hidden>*</span>}
        </label>
      )}
      {typeof children === "function" ? children(controlProps) : children}
      {error ? (
        <p id={`${id}-error`} className="field-error">{error}</p>
      ) : hint ? (
        <p id={`${id}-hint`} className="field-hint">{hint}</p>
      ) : null}
    </div>
  );
}
