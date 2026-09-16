"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { EVENTS, on } from "@/lib/events";

/**
 * Load data from a service and keep it fresh.
 *
 *   const { data, loading, error, reload } = useQuery(() => leadService.getLead(id), [id]);
 *
 * - Keeps previous data while reloading (no flicker when filters change)
 * - Ignores out-of-date responses
 * - Silently refreshes when a service reports a change (see services/index.js)
 */
export function useQuery(fetcher, deps = [], { refreshOn = [EVENTS.LEADS_CHANGED], enabled = true } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: enabled });
  const fetcherRef = useRef(fetcher);
  const requestId = useRef(0);
  fetcherRef.current = fetcher;

  const load = useCallback(async ({ silent = false } = {}) => {
    const id = ++requestId.current;
    if (!silent) setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetcherRef.current();
      if (id === requestId.current) setState({ data, error: null, loading: false });
    } catch (error) {
      if (id === requestId.current) setState((s) => ({ data: silent ? s.data : null, error, loading: false }));
    }
  }, []);

  useEffect(() => {
    if (enabled) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  const eventsKey = refreshOn.join("|");
  useEffect(() => {
    if (!enabled) return undefined;
    const offs = eventsKey.split("|").filter(Boolean).map((e) => on(e, () => load({ silent: true })));
    return () => offs.forEach((off) => off());
  }, [eventsKey, enabled, load]);

  return { ...state, reload: load };
}
