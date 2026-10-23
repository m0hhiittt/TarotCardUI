import { useState } from "react";
import { reviewApi } from "../api";
import { useLoad } from "../hooks";
import { useApp } from "../ctx";
import { Heading, Reveal } from "./Motion";

export default function Reviews() {
  const { user, isAdmin, openAuth, toast, version, refresh } = useApp();
  const { data, loading, error, reload } = useLoad(() => reviewApi.publicList(), [version]);
  const [text, setText] = useState(""); const [busy, setBusy] = useState(false); const [msg, setMsg] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return openAuth("login", "Log in to share your review.");
    if (text.trim().length < 5) return setMsg("Please write at least 5 characters.");
    setBusy(true); setMsg("");
    try {
      const r = await reviewApi.create(text.trim());
      setText(""); refresh();
      toast(r.isApproved ? "Thank you! Your review is live." : "Thank you! Your review will appear once it is approved.");
    } catch (er: any) { setMsg(er.message); } finally { setBusy(false); }
  };

  return (
    <section className="section" id="reviews">
      <p className="kicker">Kind words</p>
      <Heading text="What people say after their reading" />
      {loading && !data && <div className="notes">{[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 150 }} />)}</div>}
      {error && <div className="state err">{error} <button className="btn line sm" style={{ marginLeft: 12 }} onClick={reload}>Retry</button></div>}
      {data && data.length === 0 && <div className="state">No reviews yet. Be the first to share yours below.</div>}
      {data && data.length > 0 && (
        <div className="notes">
          {data.map((r, i) => (
            <Reveal key={r.id} delay={(i % 3) * .08}>
              <figure className="note"><span className="qm">“</span><blockquote>{r.message}</blockquote><figcaption>— {r.userName}</figcaption></figure>
            </Reveal>
          ))}
        </div>
      )}
      <Reveal>
        <form className="write" onSubmit={submit}>
          <label className="mlabel" htmlFor="rv">Share your experience</label>
          <textarea id="rv" rows={4} maxLength={1000} placeholder={user ? "Write your message…" : "Log in to write a review…"} value={text} onChange={(e) => setText(e.target.value)} onFocus={() => !user && openAuth("login", "Log in to share your review.")} />
          {msg && <div className="msg err">{msg}</div>}
          <div className="row" style={{ alignItems: "center" }}>
            <button className="btn solid" disabled={busy}>{busy ? "Sending…" : "Post review"}</button>
            <span className="hint">{isAdmin ? "Admin reviews go live immediately." : "Reviews appear after a quick approval."}</span>
          </div>
        </form>
      </Reveal>
    </section>
  );
}
