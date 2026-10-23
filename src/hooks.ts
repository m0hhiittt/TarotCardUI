import { useCallback, useEffect, useState } from "react";

export function useFinePointer() {
  const [v, setV] = useState(false);
  useEffect(() => {
    const m = window.matchMedia("(pointer: fine) and (prefers-reduced-motion: no-preference)");
    setV(m.matches);
    const f = () => setV(m.matches); m.addEventListener("change", f); return () => m.removeEventListener("change", f);
  }, []);
  return v;
}

/** Loads data from the API: { data, loading, error, reload } */
export function useLoad<T>(fn: () => Promise<T>, deps: unknown[]) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const reload = useCallback(() => {
    setLoading(true); setError("");
    fn().then(setData).catch((e) => setError(e?.message ?? "Failed to load")).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  useEffect(() => { reload(); }, [reload]);
  return { data, loading, error, reload, setData };
}
