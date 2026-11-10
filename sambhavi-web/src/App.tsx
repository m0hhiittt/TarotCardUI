import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { adminApi, authApi, chatApi, setUnauthorizedHandler } from "./api";
import { AppCtx } from "./ctx";
import type { User } from "./types";
import Background from "./components/Background";
import Cursor from "./components/Cursor";
import Navbar from "./components/Navbar";
import Hero from "./components/Hero";
import Marquee from "./components/Marquee";
import Packages from "./components/Packages";
import Story from "./components/Story";
import Reviews from "./components/Reviews";
import CTA from "./components/CTA";
import Footer from "./components/Footer";
import AuthModal from "./components/AuthModal";
import BookingModal from "./components/BookingModal";
import Account from "./components/Account";
import Admin from "./components/admin/Admin";
import PrivateRoom from "./components/PrivateRoom";
import PrivateTeaser from "./components/PrivateTeaser";
import { NotifyPopups, useNotifications } from "./notifications";
import type { AppNotification } from "./types";

type View = "home" | "account" | "admin" | "room";

export default function App() {
  const [user, setUserState] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>("home");
  const [auth, setAuth] = useState<{ mode: "login" | "register"; reason?: string; then?: number | "book" | "room" } | null>(null);
  const [booking, setBooking] = useState<{ pkg?: number } | null>(null);
  const [toastMsg, setToastMsg] = useState<{ t: string; kind: "ok" | "err" } | null>(null);
  const [version, setVersion] = useState(0);
  const [unread, setUnread] = useState(0);
  type AdminTab = "overview" | "bookings" | "reviews" | "chats" | "users" | "packages";
  const [adminStart, setAdminStart] = useState<{ tab: AdminTab; key: number; client?: string }>({ tab: "overview", key: 0 });
  const viewing = useRef("");
  const setViewing = useCallback((v: string) => { viewing.current = v; }, []);
  const { scrollYProgress } = useScroll();
  const bar = useSpring(scrollYProgress, { stiffness: 120, damping: 24 });
  const isAdmin = user?.role === "Admin";

  const toastTimer = useRef<ReturnType<typeof setTimeout>>();
  const toast = useCallback((t: string, kind: "ok" | "err" = "ok") => {
    setToastMsg({ t, kind }); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToastMsg(null), 3600);
  }, []);
  const refresh = useCallback(() => setVersion((v) => v + 1), []);
  const go = useCallback((v: View) => { setView(v); window.scrollTo({ top: 0 }); }, []);
  const logout = useCallback(() => { authApi.logout(); setUserState(null); setView("home"); toast("You are logged out."); }, [toast]);

  // Restore the session from the saved token. An admin goes straight to the panel.
  useEffect(() => {
    setUnauthorizedHandler(() => { setUserState(null); setView("home"); toast("Your session ended. Please log in again.", "err"); });
    authApi.current().then((u) => { setUserState(u); if (u?.role === "Admin") setView("admin"); }).finally(() => setReady(true));
  }, [toast]);

  // Guard: views that need a login fall back to home when logged out; the admin view needs the Admin role.
  useEffect(() => {
    if (!ready) return;
    if ((view === "account" || view === "admin" || view === "room") && !user) setView("home");
    if (view === "room" && user?.role === "Admin") setView("admin");
    if (view === "admin" && user && user.role !== "Admin") setView("home");
  }, [view, user, ready]);

  // unread private messages: asked on login and then every 20 seconds (paused while the tab is hidden)
  const refreshUnread = useCallback(() => {
    if (!user) { setUnread(0); return; }
    (user.role === "Admin" ? adminApi.chatUnread() : chatApi.unread()).then((r) => setUnread(r.count)).catch(() => { /* ignore */ });
  }, [user]);
  useEffect(() => {
    refreshUnread();
    if (!user) return;
    const t = setInterval(() => { if (!document.hidden) refreshUnread(); }, 20000);
    return () => clearInterval(t);
  }, [user, refreshUnread]);

  const notify = useNotifications(user, viewing);

  const openChats = useCallback((client?: string) => {
    if (!user) { setAuth({ mode: "login", reason: "Log in to open your private room", then: "room" }); return; }
    if (user.role === "Admin") { setAdminStart((a) => ({ tab: "chats", key: a.key + 1, client })); go("admin"); } else go("room");
  }, [user, go]);

  /** a click on a pop-up or on a bell item: mark it read and take the person to the right place */
  const openNotification = useCallback((n: AppNotification) => {
    notify.markRead(n.id);
    const adminTab = (tab: AdminTab) => { setAdminStart((a) => ({ tab, key: a.key + 1 })); go("admin"); };
    if (user?.role === "Admin") {
      if (n.target === "chats") openChats(n.refId ?? undefined);
      else if (n.target === "users" || n.target === "bookings" || n.target === "reviews") adminTab(n.target);
    } else {
      if (n.target === "room") go("room");
      else if (n.target === "bookings-mine") go("account");
    }
  }, [notify, user, go, openChats]);

  const openBooking = useCallback((pkg?: number) => {
    if (!user) { setAuth({ mode: "login", reason: "Log in to book your reading", then: pkg ?? "book" }); return; }
    setBooking({ pkg });
  }, [user]);

  const [showTop, setShowTop] = useState(false);
  useEffect(() => { const f = () => setShowTop(scrollY > 900); f(); addEventListener("scroll", f, { passive: true }); return () => removeEventListener("scroll", f); }, []);

  const showView: View = !user && view !== "home" ? "home" : view;

  return (
    <AppCtx.Provider value={{
      user, isAdmin, setUser: setUserState, logout, toast, go, version, refresh, unread, refreshUnread,
      notify, openNotification, setViewing,
      openAuth: (mode = "login", reason, then) => setAuth({ mode, reason, then }), openBooking, openChats: () => openChats(),
    }}>
      <Background />
      <motion.div className="progress" style={{ scaleX: bar }} />
      <Navbar view={showView} />
      <main>
        {showView === "room" && user && !isAdmin ? <PrivateRoom />
          : showView === "account" && user ? <Account />
          : showView === "admin" && isAdmin ? <Admin key={adminStart.key} start={adminStart.tab} startClient={adminStart.client} />
          : (<><Hero /><Marquee /><Packages /><Story /><PrivateTeaser /><Reviews /><CTA /></>)}
      </main>
      <Footer />
      <AnimatePresence>
        {auth && <AuthModal key="a" mode={auth.mode} reason={auth.reason} onClose={() => setAuth(null)}
          onDone={() => { if (auth.then === "room") go("room"); else if (auth.then !== undefined) setBooking({ pkg: auth.then === "book" ? undefined : auth.then }); }} />}
      </AnimatePresence>
      {user && <NotifyPopups n={notify} onOpen={openNotification} />}
      <AnimatePresence>{booking && <BookingModal key="b" pkgId={booking.pkg} onClose={() => setBooking(null)} />}</AnimatePresence>
      <AnimatePresence>
        {toastMsg && <motion.div className={`toast ${toastMsg.kind === "err" ? "err" : ""}`} key={toastMsg.t} role="status" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>{toastMsg.t}</motion.div>}
      </AnimatePresence>
      {showTop && <button className="totop" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Back to top" data-cursor="Top">↑</button>}
      <Cursor />
    </AppCtx.Provider>
  );
}
