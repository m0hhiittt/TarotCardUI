import { useCallback, useEffect, useState } from "react";
import { adminApi } from "../../api";
import { useApp } from "../../ctx";
import { fmtDateTime } from "../../util";
import ChatRoom from "../ChatRoom";
import type { Conversation } from "../../types";

/** The reader's side: list of clients' private rooms (newest / unanswered first) and the open conversation. */
export default function ChatPanel() {
  const { refreshUnread } = useApp();
  const [rooms, setRooms] = useState<Conversation[] | null>(null);
  const [error, setError] = useState(""); const [sel, setSel] = useState<Conversation | null>(null);

  const reloadRooms = useCallback(() => {
    adminApi.chatRooms().then((r) => { setRooms(r); setError(""); setSel((s) => (s ? r.find((x) => x.userId === s.userId) ?? s : s)); }).catch((e) => setError(e.message));
  }, []);
  useEffect(() => {
    reloadRooms();
    const t = setInterval(() => { if (!document.hidden) reloadRooms(); }, 8000);
    return () => clearInterval(t);
  }, [reloadRooms]);

  const activity = useCallback(() => { reloadRooms(); refreshUnread(); }, [reloadRooms, refreshUnread]);
  const load = useCallback((afterId?: number) => adminApi.chatThread(sel!.userId, afterId), [sel?.userId]); // eslint-disable-line react-hooks/exhaustive-deps
  const send = useCallback((b: string) => adminApi.chatReply(sel!.userId, b), [sel?.userId]); // eslint-disable-line react-hooks/exhaustive-deps
  const clear = useCallback(() => adminApi.chatDelete(sel!.userId).then(() => { setSel(null); }), [sel?.userId]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="chat-admin">
      <div className="rooms">
        <p className="mlabel" style={{ margin: "0 0 10px" }}>Private rooms</p>
        {error && <div className="msg err">{error}</div>}
        {!rooms && !error && <><div className="skeleton" /><div className="skeleton" /></>}
        {rooms?.length === 0 && <p className="empty">No private rooms yet. When a client writes to you, the room appears here.</p>}
        {rooms?.map((r) => (
          <button key={r.userId} className={`room ${sel?.userId === r.userId ? "on" : ""}`} onClick={() => setSel(r)}>
            <span className="room-top"><b>{r.userName}</b>{r.unread > 0 && <span className="cnt">{r.unread}</span>}</span>
            <span className="room-last">{r.lastFromReader ? "You: " : ""}{r.lastMessage}</span>
            <small>{fmtDateTime(r.lastAt)}</small>
          </button>
        ))}
      </div>
      <div className="panel" style={{ padding: 18, minWidth: 0 }}>
        {!sel ? <p className="empty" style={{ textAlign: "center", padding: "60px 10px" }}>Choose a room on the left to read and answer.</p> : (<>
          <h3 style={{ marginBottom: 10 }}>🔒 {sel.userName}</h3>
          <ChatRoom key={sel.userId} asReader load={load} send={send} clear={clear} onActivity={activity}
            placeholder={`Reply to ${sel.userName.split(" ")[0]}…`} emptyText="No messages."
            clearLabel="Delete room" clearText="This deletes the whole conversation for you and the client. It cannot be undone." />
        </>)}
      </div>
    </div>
  );
}
