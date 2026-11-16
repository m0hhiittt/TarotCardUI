import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import type { ChatMessage } from "../types";
import { Confirm } from "./Modal";

interface Props {
  /** fetch messages (all, or only newer than afterId) */
  load: (afterId?: number) => Promise<ChatMessage[]>;
  send: (body: string) => Promise<ChatMessage>;
  /** wipe the room */
  clear: () => Promise<void>;
  /** true when the person looking at the screen is the reader (changes which side is "mine") */
  asReader?: boolean;
  placeholder: string;
  emptyText: string;
  clearLabel: string;
  clearText: string;
  onActivity?: () => void;
}

const POLL_MS = 5000;
const time = (iso: string) => new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
const dayLabel = (iso: string) => {
  const d = new Date(iso), t = new Date(), y = new Date(); y.setDate(t.getDate() - 1);
  return d.toDateString() === t.toDateString() ? "Today" : d.toDateString() === y.toDateString() ? "Yesterday" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
};

/** The conversation itself: bubbles, send box, live refresh (polls every few seconds), privacy blur and "clear room". */
export default function ChatRoom({ load, send, clear, asReader = false, placeholder, emptyText, clearLabel, clearText, onActivity }: Props) {
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true); const [error, setError] = useState("");
  const [text, setText] = useState(""); const [busy, setBusy] = useState(false);
  const [askClear, setAskClear] = useState(false);
  const [blur, setBlur] = useState(() => { try { return localStorage.getItem("ss_privacy_blur") === "1"; } catch { return false; } });
  const box = useRef<HTMLDivElement>(null); const stick = useRef(true); const lastId = useRef<number | undefined>(undefined);

  const merge = useCallback((incoming: ChatMessage[]) => {
    if (!incoming.length) return;
    setMsgs((cur) => { const seen = new Set(cur.map((m) => m.id)); const add = incoming.filter((m) => !seen.has(m.id)); return add.length ? [...cur, ...add] : cur; });
  }, []);
  useEffect(() => { lastId.current = msgs.length ? msgs[msgs.length - 1].id : undefined; }, [msgs]);

  // first load
  useEffect(() => {
    let live = true; setLoading(true); setError(""); setMsgs([]);
    load().then((m) => { if (live) { setMsgs(m); onActivity?.(); } }).catch((e) => live && setError(e.message)).finally(() => live && setLoading(false));
    return () => { live = false; };
  }, [load, onActivity]);

  // live refresh: only asks for newer messages, and rests while the tab is hidden
  useEffect(() => {
    const t = setInterval(() => {
      if (document.hidden) return;
      load(lastId.current).then((m) => { if (m.length) { merge(m); onActivity?.(); } }).catch(() => { /* try again next tick */ });
    }, POLL_MS);
    return () => clearInterval(t);
  }, [load, merge, onActivity]);

  // keep the newest message in view (unless the person scrolled up to read)
  useLayoutEffect(() => { const b = box.current; if (b && stick.current) b.scrollTop = b.scrollHeight; }, [msgs, loading]);

  const submit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const body = text.trim(); if (!body || busy) return;
    setBusy(true); setError("");
    try { const m = await send(body); stick.current = true; merge([m]); setText(""); } catch (er: any) { setError(er.message); } finally { setBusy(false); }
  };
  const doClear = async () => {
    setAskClear(false);
    try { await clear(); setMsgs([]); onActivity?.(); } catch (er: any) { setError(er.message); }
  };
  const toggleBlur = () => { const v = !blur; setBlur(v); try { localStorage.setItem("ss_privacy_blur", v ? "1" : "0"); } catch { /* ignore */ } };

  let prevDay = "";
  return (
    <div className="chat">
      <div className="chat-bar">
        <button className={`chip ${blur ? "on" : ""}`} onClick={toggleBlur} aria-pressed={blur} title="Blurs the messages until you hover or tap them, so people next to you cannot read them">
          {blur ? "👁 Privacy blur: on" : "👁 Privacy blur: off"}
        </button>
        <button className="chip danger" onClick={() => setAskClear(true)} disabled={!msgs.length}>🗑 {clearLabel}</button>
      </div>

      <div className={`chat-box ${blur ? "blurred" : ""}`} ref={box} onScroll={(e) => { const b = e.currentTarget; stick.current = b.scrollHeight - b.scrollTop - b.clientHeight < 80; }} aria-live="polite">
        {loading && <><div className="skeleton" /><div className="skeleton" /></>}
        {!loading && !msgs.length && <p className="empty" style={{ textAlign: "center", padding: "40px 10px" }}>{emptyText}</p>}
        {msgs.map((m) => {
          const d = dayLabel(m.createdAt); const showDay = d !== prevDay; prevDay = d;
          const mine = asReader ? m.fromReader : !m.fromReader;
          return (
            <div key={m.id}>
              {showDay && <div className="daysep"><span>{d}</span></div>}
              <div className={`bubble ${mine ? "mine" : "theirs"}`} tabIndex={0}><p>{m.body}</p><time>{time(m.createdAt)}</time></div>
            </div>
          );
        })}
      </div>

      {error && <div className="msg err" role="alert" style={{ margin: "10px 0 0" }}>{error}</div>}
      <form className="chat-send" onSubmit={submit}>
        <textarea rows={2} maxLength={2000} value={text} placeholder={placeholder} aria-label="Your message"
          onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); } }} />
        <button className="btn solid" disabled={busy || !text.trim()}>{busy ? "Sending…" : "Send"}</button>
      </form>
      <p className="hint-line">Enter to send · Shift+Enter for a new line{text.length > 1700 ? ` · ${2000 - text.length} characters left` : ""}</p>

      {askClear && <Confirm title={clearLabel + "?"} text={clearText} action="Yes, delete it all" onYes={doClear} onNo={() => setAskClear(false)} />}
    </div>
  );
}
