import { useState } from "react";
import { adminApi } from "../../api";
import { useApp } from "../../ctx";
import { useLoad } from "../../hooks";
import { fmtDate } from "../../util";
import { Confirm } from "../Modal";
import { Pager, TableWrap } from "./Shared";
import type { Review } from "../../types";

export default function ReviewsPanel() {
  const { toast, refresh, version } = useApp();
  const [f, setF] = useState<"" | "false" | "true">("false"); const [page, setPage] = useState(1);
  const { data, loading, error } = useLoad(() => adminApi.reviews({ isApproved: f === "" ? undefined : f === "true", page, pageSize: 10 }), [f, page, version]);
  const [del, setDel] = useState<Review | null>(null);

  const approve = async (r: Review) => { try { await adminApi.approveReview(r.id); toast("Review approved and now public."); refresh(); } catch (e: any) { toast(e.message, "err"); } };
  const remove = async () => {
    if (!del) return; const r = del; setDel(null);
    try { await adminApi.deleteReview(r.id); toast("Review deleted."); refresh(); } catch (e: any) { toast(e.message, "err"); }
  };

  return (<>
    <div className="toolbar">
      <select value={f} onChange={(e) => { setF(e.target.value as typeof f); setPage(1); }} aria-label="Filter reviews">
        <option value="false">Waiting for approval</option><option value="true">Published</option><option value="">All reviews</option>
      </select>
    </div>
    <TableWrap loading={loading && !data} error={error} empty={data && data.items.length === 0 ? (f === "false" ? "Nothing is waiting for approval. 🎉" : "No reviews here.") : undefined}>
      <table>
        <thead><tr><th>Customer</th><th>Message</th><th>Date</th><th>Status</th><th /></tr></thead>
        <tbody>{data?.items.map((r) => (
          <tr key={r.id}>
            <td><b>{r.userName}</b></td>
            <td className="msgcell">{r.message}</td>
            <td>{fmtDate(r.createdAt)}</td>
            <td><span className={`tag ${r.isApproved ? "live" : "wait"}`}>{r.isApproved ? "Published" : "Waiting"}</span></td>
            <td style={{ textAlign: "right" }}><div className="acts" style={{ justifyContent: "flex-end", display: "flex", gap: 8 }}>
              {!r.isApproved && <button className="btn solid sm" onClick={() => approve(r)}>Approve</button>}
              <button className="btn danger sm" onClick={() => setDel(r)}>Delete</button></div></td>
          </tr>))}
        </tbody>
      </table>
    </TableWrap>
    {data && data.totalCount > 0 && <Pager page={data.page} totalPages={data.totalPages} total={data.totalCount} onPage={setPage} />}
    {del && <Confirm title="Delete this review?" text="It will be removed for good." action="Delete review" onYes={remove} onNo={() => setDel(null)} />}
  </>);
}
