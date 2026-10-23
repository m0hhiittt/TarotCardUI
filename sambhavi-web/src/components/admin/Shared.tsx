import type { ReactNode } from "react";

export function Pager({ page, totalPages, total, onPage }: { page: number; totalPages: number; total: number; onPage: (p: number) => void }) {
  return (
    <div className="pager">
      <span>{total} total</span>
      <button className="btn line sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
      <span>Page {page} of {Math.max(totalPages, 1)}</span>
      <button className="btn line sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>Next</button>
    </div>
  );
}
export function Skeletons({ n = 4 }: { n?: number }) { return <>{Array.from({ length: n }).map((_, i) => <div className="skeleton" key={i} />)}</>; }
export function TableWrap({ children, empty, loading, error }: { children: ReactNode; empty?: string; loading?: boolean; error?: string }) {
  if (error) return <div className="state err" style={{ marginTop: 0 }}>{error}</div>;
  if (loading) return <Skeletons />;
  if (empty) return <div className="state" style={{ marginTop: 0 }}>{empty}</div>;
  return <div className="table-wrap">{children}</div>;
}
/** debounce a search box value */
import { useEffect, useState } from "react";
export function useDebounced<T>(v: T, ms = 350) {
  const [d, setD] = useState(v);
  useEffect(() => { const t = setTimeout(() => setD(v), ms); return () => clearTimeout(t); }, [v, ms]);
  return d;
}
