import { useState } from "react";
import { reviewApi } from "../api";
import { useApp } from "../ctx";
import { useLoad } from "../hooks";
import { fmtDate } from "../util";
import { Confirm } from "./Modal";
import type { Review } from "../types";

/** The signed-in person's own reviews: they can edit or delete them (nobody else can edit; an admin can only delete). */
export default function MyReviews({ hideWhenEmpty = false }: { hideWhenEmpty?: boolean }) {
  const { toast, version, refresh } = useApp();
  const { data, loading, error } = useLoad(() => reviewApi.mine(), [version]);
  const [editing, setEditing] = useState<number | null>(null); const [text, setText] = useState("");
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState("");
  const [del, setDel] = useState<Review | null>(null);

  const start = (r: Review) => { setEditing(r.id); setText(r.message); setMsg(""); };
  const save = async (r: Review) => {
    if (text.trim().length < 5) return setMsg("Please write at least 5 characters.");
    setBusy(true); setMsg("");
    try { await reviewApi.update(r.id, text.trim()); setEditing(null); toast("Review updated."); refresh(); }
    catch (e: any) { setMsg(e.message); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!del) return; const r = del; setDel(null);
    try { await reviewApi.remove(r.id); toast("Review deleted."); refresh(); } catch (e: any) { toast(e.message, "err"); }
  };

  if (hideWhenEmpty && (!data || data.length === 0)) return null;
  return (<>
    <div className="list" data-testid="my-reviews">
      {loading && !data && <div className="skeleton" />}
      {error && <div className="msg err">{error}</div>}
      {data?.length === 0 && <p className="empty">You have not written a review yet. You can add one from the Reviews section on the home page.</p>}
      {data?.map((r) => (
        <div className="item" key={r.id}>
          {editing === r.id ? (
            <div style={{ flex: 1, minWidth: 0 }}>
              <textarea rows={3} maxLength={1000} value={text} onChange={(e) => setText(e.target.value)} aria-label="Edit your review" />
              {msg && <div className="msg err">{msg}</div>}
              <div className="row" style={{ marginTop: 8 }}>
                <button className="btn solid sm" disabled={busy} onClick={() => save(r)}>{busy ? "Saving…" : "Save"}</button>
                <button className="btn line sm" onClick={() => setEditing(null)}>Cancel</button>
              </div>
            </div>
          ) : (<>
            <div><span className="tag live">Published</span><div style={{ marginTop: 6 }}>{r.message}</div><small>{fmtDate(r.createdAt)}</small></div>
            <div className="acts" style={{ display: "flex", gap: 8 }}>
              <button className="btn line sm" onClick={() => start(r)}>Edit</button>
              <button className="btn danger sm" onClick={() => setDel(r)}>Delete</button>
            </div>
          </>)}
        </div>
      ))}
    </div>
    {del && <Confirm title="Delete this review?" text="It will be removed from the website for good." action="Delete review" onYes={remove} onNo={() => setDel(null)} />}
  </>);
}
