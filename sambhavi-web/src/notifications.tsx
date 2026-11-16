import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { notificationApi } from "./api";
import type { AppNotification, User } from "./types";

/* =====================================================================
   NOTIFICATIONS
   - the API saves a notification when something happens (new user, booking, chat message, ...)
   - this file asks the API for new ones every few seconds, shows a pop-up + plays a sound
   - <Bell /> (in the navbar) lists them; <NotifyPopups /> draws the pop-ups
   ===================================================================== */

// ---------- sound ----------
// The chime is made with the browser's own audio (no sound file needed).
// Browsers only allow sound after the person has tapped or clicked the page once; unlockSound() takes care of that.
const SOUND_KEY = "ss_sound";
let audio: AudioContext | null = null;
const audioCtx = () => {
  if (audio) return audio;
  const AC = window.AudioContext || (window as any).webkitAudioContext;
  if (!AC) return null;
  try { audio = new AC(); } catch { return null; }
  return audio;
};
export function unlockSound() { const c = audioCtx(); if (c && c.state === "suspended") c.resume().catch(() => { /* ignore */ }); }
export function playChime() {
  const c = audioCtx(); if (!c) return;
  try {
    if (c.state === "suspended") c.resume().catch(() => { /* ignore */ });
    const t = c.currentTime;
    ([[880, 0], [1318.5, 0.14]] as const).forEach(([f, d]) => {
      const o = c.createOscillator(), g = c.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + d);
      g.gain.exponentialRampToValueAtTime(0.25, t + d + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d + 0.55);
      o.connect(g); g.connect(c.destination); o.start(t + d); o.stop(t + d + 0.6);
    });
  } catch { /* sound is a bonus; never break the page */ }
}
const readSound = () => { try { return localStorage.getItem(SOUND_KEY) !== "off"; } catch { return true; } };

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

// ---------- polling ----------
const POLL_MS = 5000;

export interface NotifyState {
  items: AppNotification[]; unread: number;
  popups: AppNotification[]; closePopup: (id: number) => void;
  soundOn: boolean; setSoundOn: (v: boolean) => void;
  pushSupported: boolean; pushEnabled: boolean; enablePush: () => Promise<void>;
  reload: () => void; markRead: (id: number) => void; markAllRead: () => void;
}

/** viewing: what the person is looking at right now ("room", "admin:chats"); a pop-up for a chat they are already reading is skipped. */
export function useNotifications(user: User | null, viewing: React.MutableRefObject<string>): NotifyState {
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [popups, setPopups] = useState<AppNotification[]>([]);
  const [soundOn, setSoundState] = useState(readSound);
  const [pushEnabled, setPushEnabled] = useState(false);
  const pushSupported = typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
  const lastId = useRef(0); const first = useRef(true);
  const soundRef = useRef(soundOn); soundRef.current = soundOn;
  const uid = user?.id;

  const enablePush = useCallback(async () => {
    if (!uid || !pushSupported) throw new Error("This browser does not support web push notifications.");
    const permission = Notification.permission === "granted" ? "granted" : await Notification.requestPermission();
    if (permission !== "granted") throw new Error("Please allow notifications in your browser settings.");
    const registration = await navigator.serviceWorker.register("/sw.js");
    const keyResponse = await notificationApi.pushPublicKey();
    const keyBytes = urlBase64ToUint8Array(keyResponse.publicKey);
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes });
    const json = subscription.toJSON();
    if (!json.endpoint || !json.keys?.p256dh || !json.keys?.auth) throw new Error("Could not create a browser push subscription.");
    await notificationApi.pushSubscribe({ endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth });
    setPushEnabled(true);
  }, [uid, pushSupported]);

  useEffect(() => {
    if (!uid || !pushSupported || Notification.permission !== "granted") { setPushEnabled(false); return; }
    let cancelled = false;
    (async () => {
      try {
        const registration = await navigator.serviceWorker.register("/sw.js");
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
          const json = subscription.toJSON();
          if (json.endpoint && json.keys?.p256dh && json.keys?.auth) await notificationApi.pushSubscribe({ endpoint: json.endpoint, p256dh: json.keys.p256dh, auth: json.keys.auth });
          if (!cancelled) setPushEnabled(true);
        } else if (!cancelled) setPushEnabled(false);
      } catch { if (!cancelled) setPushEnabled(false); }
    })();
    return () => { cancelled = true; };
  }, [uid, pushSupported]);

  const setSoundOn = useCallback((v: boolean) => { setSoundState(v); try { localStorage.setItem(SOUND_KEY, v ? "on" : "off"); } catch { /* ignore */ } if (v) { unlockSound(); playChime(); } }, []);
  const closePopup = useCallback((id: number) => setPopups((p) => p.filter((x) => x.id !== id)), []);

  const poll = useCallback(async () => {
    if (!uid) return;
    try {
      const r = await notificationApi.list(first.current ? undefined : lastId.current);
      setUnread(r.unreadCount);
      if (first.current) {
        first.current = false;
        setItems(r.items); lastId.current = r.items.reduce((m, i) => Math.max(m, i.id), 0);
        // while the person was away: one friendly summary instead of a pop-up per item
        if (r.unreadCount > 0) {
          setPopups([{ id: -1, type: "summary", title: r.unreadCount === 1 ? "You have 1 new notification" : `You have ${r.unreadCount} new notifications`, body: r.items.find((i) => !i.isRead)?.title, target: "bell", createdAt: new Date().toISOString(), isRead: false }]);
          if (soundRef.current) playChime();
        }
        return;
      }
      if (r.items.length === 0) return;
      lastId.current = r.items.reduce((m, i) => Math.max(m, i.id), lastId.current);
      setItems((prev) => [...r.items, ...prev].slice(0, 60));
      // no pop-up for a chat the person is reading right now
      const fresh = r.items.filter((n) => !(n.type === "chat_message" && ((n.target === "room" && viewing.current === "room") || (n.target === "chats" && viewing.current === "admin:chats"))));
      if (fresh.length) {
        setPopups((p) => [...p.filter((x) => x.id !== -1), ...fresh.slice().reverse()].slice(-4));
        if (soundRef.current) playChime();
      }
    } catch { /* offline or session ended: try again next time */ }
  }, [uid, viewing]);

  // start / stop with the login
  useEffect(() => {
    first.current = true; lastId.current = 0; setItems([]); setUnread(0); setPopups([]);
    if (!uid) return;
    poll();
    const t = setInterval(() => { if (!document.hidden) poll(); }, POLL_MS);
    const vis = () => { if (!document.hidden) poll(); };
    document.addEventListener("visibilitychange", vis);
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", vis); };
  }, [uid, poll]);

  // browsers allow sound only after one tap or key press on the page
  useEffect(() => {
    const f = () => unlockSound();
    addEventListener("pointerdown", f, { once: true }); addEventListener("keydown", f, { once: true });
    return () => { removeEventListener("pointerdown", f); removeEventListener("keydown", f); };
  }, []);

  // full list (used when the bell opens, so read/unread is up to date)
  const reload = useCallback(() => {
    if (!uid) return;
    notificationApi.list().then((r) => { setItems(r.items); setUnread(r.unreadCount); lastId.current = Math.max(lastId.current, r.items.reduce((m, i) => Math.max(m, i.id), 0)); }).catch(() => { /* ignore */ });
  }, [uid]);

  const markRead = useCallback((id: number) => {
    if (id < 0) return;
    setItems((l) => l.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    notificationApi.read(id).catch(() => { /* ignore */ });
  }, []);
  const markAllRead = useCallback(() => {
    setItems((l) => l.map((n) => ({ ...n, isRead: true }))); setUnread(0);
    notificationApi.readAll().catch(() => { /* ignore */ });
  }, []);

  return { items, unread, popups, closePopup, soundOn, setSoundOn, pushSupported, pushEnabled, enablePush, reload, markRead, markAllRead };
}

// ---------- look ----------
const ICON: Record<string, string> = { user_registered: "👤", booking_created: "📅", booking_changed: "📅", chat_message: "💬", review_posted: "⭐", summary: "🔔" };

export function ago(iso: string) {
  const s = Math.max(0, Math.floor((Date.now() - new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(iso) ? iso : iso + "Z").getTime()) / 1000));
  if (s < 45) return "just now"; if (s < 3600) return `${Math.max(1, Math.round(s / 60))} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`; return `${Math.round(s / 86400)} d ago`;
}

function Popup({ n, onOpen, onClose }: { n: AppNotification; onOpen: (n: AppNotification) => void; onClose: (id: number) => void }) {
  // disappears by itself after 8 seconds
  useEffect(() => { const t = setTimeout(() => onClose(n.id), 8000); return () => clearTimeout(t); }, [n.id, onClose]);
  return (
    <motion.div className="npop" role="status" layout initial={{ opacity: 0, x: 40, scale: .96 }} animate={{ opacity: 1, x: 0, scale: 1 }} exit={{ opacity: 0, x: 40 }} transition={{ type: "spring", stiffness: 380, damping: 30 }}>
      <button type="button" className="npop-main" onClick={() => { onOpen(n); onClose(n.id); }}>
        <span className="nicon" aria-hidden>{ICON[n.type] ?? "🔔"}</span>
        <span className="ntext"><b>{n.title}</b>{n.body && <span className="nbody">{n.type === "chat_message" ? `“${n.body}”` : n.body}</span>}</span>
      </button>
      <button type="button" className="npop-x" onClick={() => onClose(n.id)} aria-label="Dismiss">×</button>
    </motion.div>
  );
}

/** The pop-ups (top right on a computer, top of the screen on a phone). */
export function NotifyPopups({ n, onOpen }: { n: NotifyState; onOpen: (x: AppNotification) => void }) {
  return (
    <div className="npop-stack" aria-live="polite">
      <AnimatePresence initial={false}>{n.popups.map((p) => <Popup key={p.id} n={p} onOpen={onOpen} onClose={n.closePopup} />)}</AnimatePresence>
    </div>
  );
}

/** The bell in the navbar: unread count + the list. */
export function Bell({ n, onOpen }: { n: NotifyState; onOpen: (x: AppNotification) => void }) {
  const [open, setOpen] = useState(false);
  const [pushError, setPushError] = useState("");
  const box = useRef<HTMLDivElement>(null); const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const out = (e: Event) => { const t = e.target as Node; if (!box.current?.contains(t) && !panel.current?.contains(t)) setOpen(false); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", out); addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", out); removeEventListener("keydown", esc); };
  }, [open]);

  const toggle = () => { if (!open) n.reload(); setOpen((v) => !v); };
  return (
    <div className="bell" ref={box}>
      <button type="button" className={`pill bell-btn ${open ? "open" : ""}`} onClick={toggle} aria-label={n.unread ? `Notifications, ${n.unread} unread` : "Notifications"} aria-haspopup="true" aria-expanded={open}>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 8a6 6 0 1 1 12 0c0 7 3 8 3 8H3s3-1 3-8" /><path d="M10.3 20a1.9 1.9 0 0 0 3.4 0" /></svg>
        {n.unread > 0 && <span className="cnt bell-cnt">{n.unread > 99 ? "99+" : n.unread}</span>}
      </button>
      {open && createPortal(
        <div className="bellpanel" role="dialog" aria-label="Notifications" ref={panel}>
          <div className="bp-head">
            <b>Notifications</b>
            <span>
              <button type="button" onClick={() => n.setSoundOn(!n.soundOn)} aria-pressed={n.soundOn} title="Turn the notification sound on or off">{n.soundOn ? "🔔 Sound on" : "🔕 Sound off"}</button>
              {n.unread > 0 && <button type="button" onClick={n.markAllRead}>Mark all read</button>}
            </span>
          </div>
          {n.pushSupported && <div className="bp-push">
            <span>{n.pushEnabled ? "Browser notifications are enabled" : "Get alerts even when this site is closed"}</span>
            {!n.pushEnabled && <button type="button" onClick={async () => { setPushError(""); try { await n.enablePush(); } catch (e) { setPushError(e instanceof Error ? e.message : "Could not enable notifications."); } }}>Enable browser alerts</button>}
            {pushError && <small role="alert">{pushError}</small>}
          </div>}
          <div className="bp-list">
            {n.items.length === 0 && <p className="bp-empty">Nothing yet. New messages and account updates will show up here.</p>}
            {n.items.map((x) => (
              <button type="button" key={x.id} className={`bp-item ${x.isRead ? "" : "unread"}`} onClick={() => { setOpen(false); onOpen(x); }}>
                <span className="nicon" aria-hidden>{ICON[x.type] ?? "🔔"}</span>
                <span className="ntext"><b>{x.title}</b>{x.body && <span className="nbody">{x.type === "chat_message" ? `“${x.body}”` : x.body}</span>}<small>{ago(x.createdAt)}</small></span>
                {!x.isRead && <i className="udot" aria-label="unread" />}
              </button>
            ))}
          </div>
        </div>, document.body)}
    </div>
  );
}
