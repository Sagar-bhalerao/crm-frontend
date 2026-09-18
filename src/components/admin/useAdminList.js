"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSettings } from "@/context/SettingsContext";
import { useDebounce } from "@/hooks/useDebounce";

/**
 * List state for the configuration screens: search (debounced), filters,
 * sorting, pagination and reloading after a change.
 *
 *   const list = useAdminList(brandService.listBrands, { sort: "name:asc" });
 */
export function useAdminList(fetcher, initial = {}) {
  const { settings } = useSettings();
  const [query, setQuery] = useState({ page: 1, pageSize: settings.pageSize, search: "", status: "", sort: "name:asc", ...initial });

  // Rows per page comes from Configuration.
  useEffect(() => {
    setQuery((q) => (q.pageSize === settings.pageSize ? q : { ...q, pageSize: settings.pageSize, page: 1 }));
  }, [settings.pageSize]);
  const [search, setSearch] = useState(query.search);
  const debounced = useDebounce(search, 300);
  const [state, setState] = useState({ data: null, error: null, loading: true });
  const requestId = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  useEffect(() => {
    setQuery((q) => (q.search === debounced ? q : { ...q, search: debounced, page: 1 }));
  }, [debounced]);

  const key = JSON.stringify(query);
  const load = useCallback(async () => {
    const id = ++requestId.current;
    setState((s) => ({ ...s, loading: true, error: null }));
    try {
      const data = await fetcherRef.current(JSON.parse(key));
      if (id === requestId.current) setState({ data, error: null, loading: false });
    } catch (error) {
      if (id === requestId.current) setState({ data: null, error, loading: false });
    }
  }, [key]);

  useEffect(() => { load(); }, [load]);

  const update = (patch) => setQuery((q) => ({ ...q, page: 1, ...patch }));
  const setPage = (page) => setQuery((q) => ({ ...q, page }));
  const clear = () => {
    setSearch("");
    setQuery((q) => ({ ...q, page: 1, search: "", status: "", ...Object.fromEntries(Object.keys(initial).filter((k) => k !== "sort").map((k) => [k, ""])) }));
  };

  const hasFilters = Boolean(query.search) || query.status !== "" || Boolean(query.brandId);

  return { ...state, query, search, setSearch, update, setPage, clear, hasFilters, reload: load };
}
