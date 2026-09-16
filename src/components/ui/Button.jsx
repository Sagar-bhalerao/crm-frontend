import Link from "next/link";
import { Loader2 } from "lucide-react";
import { cx } from "@/lib/utils";

/**
 * <Button variant="primary|secondary|ghost|danger|success" size="sm|md|lg" icon={Plus} loading href="/x">
 */
export default function Button({
  variant = "secondary",
  size = "md",
  icon: Icon,
  iconOnly = false,
  loading = false,
  href,
  className,
  children,
  type = "button",
  ...props
}) {
  const classes = cx(
    "btn",
    `btn-${variant}`,
    size === "sm" && "btn-sm",
    size === "lg" && "btn-lg",
    iconOnly && "btn-icon",
    iconOnly && size === "sm" && "w-8",
    className
  );
  const iconSize = size === "sm" ? 15 : 16;
  const content = (
    <>
      {loading ? <Loader2 size={iconSize} className="animate-spin" /> : Icon && <Icon size={iconSize} aria-hidden />}
      {iconOnly ? <span className="sr-only">{children}</span> : children}
    </>
  );

  if (href) {
    return (
      <Link href={href} className={classes} {...props}>
        {content}
      </Link>
    );
  }

  return (
    <button type={type} className={classes} {...props} disabled={loading || props.disabled}>
      {content}
    </button>
  );
}
