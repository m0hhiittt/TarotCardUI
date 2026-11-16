import { useCallback, useEffect, useMemo, useState } from "react";
import { chatApi } from "../api";
import { useApp } from "../ctx";
import { TAROT, type TarotCard } from "../tarot";
import ChatRoom from "./ChatRoom";

 type CardChoice = Pick<TarotCard, "name" | "num" | "text">;

/** Private reader chat. The ₹50 button is deliberately a local test-mode gate only. */
export default function PrivateRoom({ initialCard, onClearCard }: { initialCard: CardChoice | null; onClearCard: () => void }) {
  const { refreshUnread, setViewing, toast } = useApp();
  const [card, setCard] = useState<CardChoice | null>(initialCard);
  const [question, setQuestion] = useState("");
  const [testPaid, setTestPaid] = useState(false);
  const [starting, setStarting] = useState(false);
  const [started, setStarted] = useState(false);
  const [checkingHistory, setCheckingHistory] = useState(!initialCard);

  useEffect(() => { setViewing("room"); return () => setViewing(""); }, [setViewing]);
  useEffect(() => { if (initialCard) setCard(initialCard); }, [initialCard]);
  // A returning user can continue an existing chat without being asked to pay again.
  useEffect(() => {
    if (initialCard) { setCheckingHistory(false); return; }
    let active = true;
    chatApi.mine().then((messages) => { if (active && messages.length) setStarted(true); })
      .catch(() => { /* ChatRoom will show any actual loading error after the session starts. */ })
      .finally(() => { if (active) setCheckingHistory(false); });
    return () => { active = false; };
  }, [initialCard]);

  const load = useCallback((afterId?: number) => chatApi.mine(afterId), []);
  const send = useCallback((b: string) => chatApi.send(b), []);
  const clear = useCallback(() => chatApi.clear(), []);

  const choices = useMemo(() => TAROT.map(({ name, num, text }) => ({ name, num, text })), []);

  const beginSession = async () => {
    if (!card) return toast("Please select a tarot card first.", "err");
    if (!question.trim()) return toast("Please describe the question you want to ask.", "err");
    setStarting(true);
    try {
      const message = `✦ TAROT CARD SHARED ✦\nCard: ${card.name} (${card.num})\nMeaning: ${card.text}\n\nMy question:\n${question.trim()}`;
      await chatApi.send(message);
      setStarted(true);
      onClearCard();
      refreshUnread();
      toast("Your card and question have been shared with the reader.");
    } catch (e) {
      toast(e instanceof Error ? e.message : "Could not start the chat session.", "err");
    } finally { setStarting(false); }
  };

  return (
    <div className="page">
      <h1>✦ Private tarot chat</h1>
      <p className="sub">Share one card and your question, then speak directly with the tarot reader.</p>
      {checkingHistory && <div className="panel" style={{ padding: 20 }}>Loading your private chat…</div>}
      {!started && !checkingHistory && (
        <div className="panel" style={{ padding: 22, maxWidth: 760, margin: "22px auto" }}>
          <p className="kicker">{card ? "Your selected card" : "Choose your card"}</p>
          {card ? (
            <div style={{ border: "1px solid var(--line, #80664f)", borderRadius: 14, padding: 18, marginBottom: 18 }}>
              <b style={{ fontSize: 20 }}>{card.name} <span style={{ opacity: .65 }}>· {card.num}</span></b>
              <p className="sub" style={{ margin: "8px 0 12px" }}>{card.text}</p>
              <button className="btn line sm" onClick={() => setCard(null)}>Choose a different card</button>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(145px,1fr))", gap: 10, margin: "16px 0 22px" }}>
              {choices.map((c) => <button key={c.name} className="pk" style={{ padding: 14, textAlign: "left", cursor: "pointer" }} onClick={() => setCard(c)}>
                <b>{c.name}</b><small style={{ display: "block", opacity: .65, marginTop: 5 }}>{c.num}</small><span style={{ display: "block", fontSize: 12, marginTop: 8 }}>{c.text}</span>
              </button>)}
            </div>
          )}
          {!testPaid ? (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 14, flexWrap: "wrap", marginTop: 18 }}>
              <div><b style={{ fontSize: 22 }}>₹50</b><div className="hint-line">One private chat session</div></div>
              <button className="btn solid" disabled={!card} onClick={() => setTestPaid(true)}>Pay ₹50 (test mode)</button>
            </div>
          ) : (<>
            <label className="mlabel" htmlFor="tarot-question">Payment test accepted. What would you like to ask the reader?</label>
            <textarea id="tarot-question" rows={4} maxLength={1500} value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Describe your question here…" style={{ width: "100%", marginTop: 8, resize: "vertical" }} />
            <button className="btn solid" style={{ marginTop: 16 }} disabled={!card || !question.trim() || starting} onClick={beginSession}>{starting ? "Starting chat…" : "Send card and question to chat"}</button>
          </>)}
          <p className="hint-line" style={{ marginTop: 12 }}>Testing only: this button does not charge money or verify a real payment. Payment gateway integration is not enabled.</p>
        </div>
      )}
      {started && <div className="panel" style={{ padding: 18 }}>
        <ChatRoom load={load} send={send} clear={clear} onActivity={refreshUnread}
          placeholder="Write a message to the tarot reader…" emptyText="Your chat is ready. Send your message below."
          clearLabel="Clear chat" clearText="This deletes the whole conversation for both you and the reader. This cannot be undone." />
      </div>}
      {!started && !checkingHistory && <div className="panel" style={{ padding: 18, marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>Your conversation</h3>
        <p className="sub">Your private chat will appear here after you share your card and question.</p>
      </div>}
    </div>
  );
}
