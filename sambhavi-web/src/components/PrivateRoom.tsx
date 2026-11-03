import { useCallback } from "react";
import { chatApi } from "../api";
import { useApp } from "../ctx";
import ChatRoom from "./ChatRoom";

/** A client's private room with the reader. */
export default function PrivateRoom() {
  const { refreshUnread } = useApp();
  const load = useCallback((afterId?: number) => chatApi.mine(afterId), []);
  const send = useCallback((b: string) => chatApi.send(b), []);
  const clear = useCallback(() => chatApi.clear(), []);

  return (
    <div className="page">
      <h1>🔒 Private room</h1>
      <p className="sub">A quiet space to talk with Shambhavi, one to one.</p>
      <div className="privacy-note">
        <b>How privacy works here</b>
        <ul>
          <li>Only you and the reader can see this room. It is never shown on the public site or to other clients.</li>
          <li>You can wipe the whole conversation at any time with “Clear room”.</li>
          <li>Turn on <b>Privacy blur</b> to hide the messages until you hover over or tap them, handy on a shared screen.</li>
        </ul>
      </div>
      <div className="panel" style={{ padding: 18 }}>
        <ChatRoom load={load} send={send} clear={clear} onActivity={refreshUnread}
          placeholder="Write your message… the reader will answer here."
          emptyText="Nothing here yet. Write your first message below, and you will see the reply in this room."
          clearLabel="Clear room" clearText="Every message in this room, yours and the reader's, will be deleted for both of you. This cannot be undone." />
      </div>
    </div>
  );
}
