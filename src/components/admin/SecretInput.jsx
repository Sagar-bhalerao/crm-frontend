"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui";
import { cx } from "@/lib/utils";

/**
 * Password-style input for credentials. Starts masked, can be revealed while
 * typing, and never gets the browser's saved login filled into it.
 * A saved value is never loaded back into this field; `saved` only changes
 * the placeholder so it is clear that leaving it blank keeps the old value.
 */
export default function SecretInput({ saved = false, placeholder, className, ...props }) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <Input
        {...props}
        type={visible ? "text" : "password"}
        autoComplete="new-password"
        autoCapitalize="off"
        spellCheck={false}
        placeholder={saved ? "Leave blank to keep the saved value" : placeholder}
        className={cx("pr-10", className)}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "Hide value" : "Show value"}
        aria-pressed={visible}
        className="absolute right-1.5 top-1/2 -translate-y-1/2 cursor-pointer rounded p-1.5 text-muted hover:text-ink"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
