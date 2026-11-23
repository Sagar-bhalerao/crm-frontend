import { cx } from "@/lib/utils";

/**
 * The Circle CRM mark: a ring of four segments, one per open stage (new, in
 * progress, quotation, proforma invoice), getting deeper as a lead moves on,
 * and a green dot where the ring closes: the confirmed booking.
 */
const SEGMENTS = [
  { d: "M40.25 21.13A16.5 16.5 0 0 1 32.74 37.99", color: "#9cc3f5" },
  { d: "M31.23 38.83A16.5 16.5 0 0 1 12.96 36.26", color: "#5f9be8" },
  { d: "M11.74 35.04A16.5 16.5 0 0 1 9.17 16.77", color: "#2f74d6" },
  { d: "M10.01 15.26A16.5 16.5 0 0 1 26.87 7.75", color: "#1d4fb0" },
];
export const STAGE_COLORS = [...SEGMENTS.map((s) => s.color), "#2fbf8f"];

/** animated: draws the ring stage by stage once, for the login screen. */
export function LogoMark({ size = 32, animated = false, className, title }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      className={cx(animated && "logo-animated", className)}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {SEGMENTS.map((s, i) => (
        <path
          key={s.d}
          d={s.d}
          fill="none"
          stroke={s.color}
          strokeWidth="7"
          pathLength="1"
          className="logo-seg"
          style={{ "--i": i }}
        />
      ))}
      {/* Rounded ends only where the ring opens; the joins between stages stay square */}
      <circle cx="40.25" cy="21.13" r="3.5" fill={SEGMENTS[0].color} className="logo-seg-cap" style={{ "--d": "0.2s" }} />
      <circle cx="26.87" cy="7.75" r="3.5" fill={SEGMENTS[3].color} className="logo-seg-cap" style={{ "--d": "1.45s" }} />
      <circle cx="35.67" cy="12.33" r="5" fill={STAGE_COLORS[4]} className="logo-dot" />
    </svg>
  );
}

/** Mark plus name. tone="dark" for light text on the ink background. */
export default function Logo({ size = 32, tone = "light", className }) {
  return (
    <span className={cx("inline-flex items-center gap-2.5", className)}>
      <LogoMark size={size} />
      <span
        className={cx(
          "font-semibold tracking-tight",
          size >= 36 ? "text-lg" : "text-[15px]",
          tone === "dark" ? "text-white" : "text-ink"
        )}
      >
        Circle <span className={cx("font-normal", tone === "dark" ? "text-white/60" : "text-muted")}>CRM</span>
      </span>
    </span>
  );
}