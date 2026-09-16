"use client";

import { useCallback, useState } from "react";
import { useToast } from "@/context/ToastContext";

/**
 * Run a service call with a busy flag and toast feedback.
 *
 *   const [run, busy] = useAction();
 *   const lead = await run(() => leadService.addFollowUp(id, form), { success: "Follow-up saved" });
 *   if (lead) close();
 *
 * Resolves to the result, or null if it failed (the error is shown as a toast).
 */
export function useAction() {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (fn, { success, successDescription } = {}) => {
      setBusy(true);
      try {
        const result = await fn();
        if (success) {
          toast.success(
            typeof success === "function" ? success(result) : success,
            typeof successDescription === "function" ? successDescription(result) : successDescription
          );
        }
        return result ?? true;
      } catch (err) {
        toast.error(err?.message || "Something went wrong. Try again.");
        return null;
      } finally {
        setBusy(false);
      }
    },
    [toast]
  );

  return [run, busy];
}
