"use client";

import { useState, useEffect, useCallback } from "react";

export function useApi<T>(url: string | null) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!url) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/** Build date range params for period presets */
export function periodToDateRange(preset: string, customFrom?: string, customTo?: string) {
  const today = new Date();
  const fmt = (d: Date) => d.toISOString().split("T")[0];

  switch (preset) {
    case "today":
      return { from: fmt(today), to: fmt(today) };
    case "yesterday": {
      const y = new Date(today);
      y.setDate(y.getDate() - 1);
      return { from: fmt(y), to: fmt(y) };
    }
    case "last_7_days": {
      const from = new Date(today);
      from.setDate(from.getDate() - 7);
      return { from: fmt(from), to: fmt(today) };
    }
    case "last_30_days": {
      const from = new Date(today);
      from.setDate(from.getDate() - 30);
      return { from: fmt(from), to: fmt(today) };
    }
    case "custom":
      return { from: customFrom || fmt(today), to: customTo || fmt(today) };
    default:
      return { from: fmt(today), to: fmt(today) };
  }
}
