"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_ADVANCE_PERCENT, DEFAULT_PAGE_SIZE, DEFAULT_TAX_RATE, QUOTATION_VALID_DAYS } from "@/config/app";
import { setRuntimeSettings } from "@/lib/runtimeSettings";
import { settingsService } from "@/services/admin";

/** Used until the API answers, and if it cannot be reached. */
const FALLBACK = {
  taxRate: DEFAULT_TAX_RATE,
  advancePercent: DEFAULT_ADVANCE_PERCENT,
  quotationValidDays: QUOTATION_VALID_DAYS,
  pageSize: DEFAULT_PAGE_SIZE,
  currency: "INR",
  leadResponseHours: 2,
};

const SettingsContext = createContext({ settings: FALLBACK, loaded: false, reload: () => {} });

/**
 * Global settings, loaded once per session. Screens read them through
 * useSettings() so a change in Configuration applies everywhere.
 */
export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(FALLBACK);
  const [loaded, setLoaded] = useState(false);

  const reload = useCallback(async () => {
    try {
      const data = await settingsService.getSettings();
      const next = { ...FALLBACK, ...data.values };
      setSettings(next);
      setRuntimeSettings(next);
    } catch {
      // The API may be down. The lead module keeps working on the fallbacks.
      setSettings(FALLBACK);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const value = useMemo(() => ({ settings, loaded, reload, setSettings }), [settings, loaded, reload]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
