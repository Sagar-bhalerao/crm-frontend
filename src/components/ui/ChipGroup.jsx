import { cx } from "@/lib/utils";

/** Multi-select as toggle chips. value: string[] */
export default function ChipGroup({ options, value = [], onChange, label }) {
  const toggle = (opt) => onChange(value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt]);
  return (
    <div role="group" aria-label={label} className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const on = value.includes(opt);
        return (
          <button key={opt} type="button" aria-pressed={on} onClick={() => toggle(opt)} className={cx("chip", on && "chip-on")}>
            {opt}
          </button>
        );
      })}
    </div>
  );
}
