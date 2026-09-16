export default function Checkbox({ label, className = "", ...props }) {
  return (
    <label className={`inline-flex items-center gap-2 text-sm text-body cursor-pointer select-none ${className}`}>
      <input type="checkbox" className="h-4 w-4 rounded border-line-strong accent-[var(--color-ink)]" {...props} />
      {label}
    </label>
  );
}
