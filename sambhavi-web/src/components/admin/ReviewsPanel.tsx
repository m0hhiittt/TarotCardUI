import { useState } from "react";
import { adminApi } from "../../api";
import { useApp } from "../../ctx";
import { useLoad } from "../../hooks";
import { fmtDate } from "../../util";
import { Confirm } from "../Modal";
import { Pager, TableWrap } from "./Shared";
import type { Review } from "../../types";

/** Reviews go live as soon as they are posted. The admin can delete any review but cannot edit one. */
export default function ReviewsPanel() {
  const { toast, refresh, version } = useApp();
  const [page, setPage] = useState(1);
  const { data, loading, error } = useLoad(() => adminApi.reviews({ page, pageSize: 10 }), [page, version]);
  const [del, setDel] = useState<Review | null>(null);

  const remove = async () => {
    if (!del) return; const r = del; setDel(null);
    try { await adminApi.deleteReview(r.id); toast("Review deleted."); refresh(); } catch (e: any) { toast(e.message, "err"); }
  };

  return (<>
    <p className="sub" style={{ marginTop: 0 }}>Reviews are published straight away. You can delete any review (for example spam), but you cannot edit what a customer wrote.</p>
    <TableWrap loading={loading && !data} error={error} empty={data && data.items.length === 0 ? "No reviews yet." : undefined}>
      <table>
        <thead><tr><th>Customer</th><th>Message</th><th>Date</th><th /></tr></thead>
        <tbody>{data?.items.map((r) => (
          <tr key={r.id}>
            <td data-label="Customer"><b>{r.userName}</b></td>
            <td className="msgcell" data-label="Message"><span>{r.message}</span></td>
            <td data-label="Date">{fmtDate(r.createdAt)}</td>
            <td className="act" style={{ textAlign: "right" }}><div className="acts" style={{ justifyContent: "flex-end", display: "flex", gap: 8 }}>
              <button className="btn danger sm" onClick={() => setDel(r)}>Delete</button></div></td>
          </tr>))}
        </tbody>
      </table>
    </TableWrap>
    {data && data.totalCount > 0 && <Pager page={data.page} totalPages={data.totalPages} total={data.totalCount} onPage={setPage} />}
    {del && <Confirm title="Delete this review?" text="It will be removed for good." action="Delete review" onYes={remove} onNo={() => setDel(null)} />}
  </>);
}
