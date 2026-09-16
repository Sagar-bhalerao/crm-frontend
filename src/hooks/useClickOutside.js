"use client";

import { useEffect } from "react";

/** Calls `handler` on outside click or Escape. */
export function useClickOutside(ref, handler, active = true) {
  useEffect(() => {
    if (!active) return undefined;
    const onPointer = (e) => {
      if (ref.current && !ref.current.contains(e.target)) handler();
    };
    const onKey = (e) => e.key === "Escape" && handler();
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [ref, handler, active]);
}
