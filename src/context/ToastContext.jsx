"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cx } from "@/lib/utils";

const ToastContext = createContext(null);

const ICONS = { success: CheckCircle2, error: XCircle, info: Info };
const COLORS = { success: "text-emerald-300", error: "text-red-300", info: "text-sky-300" };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const show = useCallback(
    (tone, title, description) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t.slice(-1), { id, tone, title, description }]);
      setTimeout(() => dismiss(id), tone === "error" ? 6000 : 4000);
    },
    [dismiss]
  );

  const api = useMemo(
    () => ({
      success: (title, description) => show("success", title, description),
      error: (title, description) => show("error", title, description),
      info: (title, description) => show("info", title, description),
    }),
    [show]
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {/* z-40 keeps toasts under modals (z-50) so they never cover a dialog button.
          On phones they sit above the lead action bar. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-3 bottom-20 z-40 flex flex-col gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:w-96 [&>*]:pointer-events-auto"
      >
        {toasts.map((t) => {
          const Icon = ICONS[t.tone];
          return (
            <div
              key={t.id}
              role={t.tone === "error" ? "alert" : "status"}
              className="flex items-start gap-3 rounded-lg bg-ink text-white px-4 py-3 shadow-lg animate-[sheet-in_160ms_ease-out]"
            >
              <Icon size={18} className={cx("mt-0.5 shrink-0", COLORS[t.tone])} />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{t.title}</p>
                {t.description && <p className="text-[13px] text-white/75 mt-0.5">{t.description}</p>}
              </div>
              <button onClick={() => dismiss(t.id)} className="text-white/60 hover:text-white" aria-label="Dismiss">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}
