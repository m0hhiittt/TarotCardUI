import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useScroll, useSpring } from "framer-motion";
import { authApi, setUnauthorizedHandler } from "./api";
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

type View = "home" | "account" | "admin";

export default function App() {
  const [user, setUserState] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<View>("home");
  const [auth, setAuth] = useState<{ mode: "login" | "register"; reason?: string; then?: number | "book" } | null>(null);
  const [booking, setBooking] = useState<{ pkg?: number } | null>(null);
  const [toastMsg, setToastMsg] = useState<{ t: string; kind: "ok" | "err" } | null>(null);
  const [version, setVersion] = useState(0);
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
    if ((view === "account" || view === "admin") && !user) setView("home");
    if (view === "admin" && user && user.role !== "Admin") setView("home");
  }, [view, user, ready]);

  const openBooking = useCallback((pkg?: number) => {
    if (!user) { setAuth({ mode: "login", reason: "Log in to book your reading", then: pkg ?? "book" }); return; }
    setBooking({ pkg });
  }, [user]);

  const showView: View = !user && view !== "home" ? "home" : view;

  return (
    <AppCtx.Provider value={{
      user, isAdmin, setUser: setUserState, logout, toast, go, version, refresh,
      openAuth: (mode = "login", reason) => setAuth({ mode, reason }), openBooking,
    }}>
      <Background />
      <motion.div className="progress" style={{ scaleX: bar }} />
      <Navbar view={showView} />
      <main>
        {showView === "account" && user ? <Account />
          : showView === "admin" && isAdmin ? <Admin />
          : (<><Hero /><Marquee /><Packages /><Story /><Reviews /><CTA /></>)}
      </main>
      <Footer />
      <AnimatePresence>
        {auth && <AuthModal key="a" mode={auth.mode} reason={auth.reason} onClose={() => setAuth(null)}
          onDone={() => { if (auth.then !== undefined) setBooking({ pkg: auth.then === "book" ? undefined : auth.then }); }} />}
      </AnimatePresence>
      <AnimatePresence>{booking && <BookingModal key="b" pkgId={booking.pkg} onClose={() => setBooking(null)} />}</AnimatePresence>
      <AnimatePresence>
        {toastMsg && <motion.div className={`toast ${toastMsg.kind === "err" ? "err" : ""}`} key={toastMsg.t} role="status" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>{toastMsg.t}</motion.div>}
      </AnimatePresence>
      <Cursor />
    </AppCtx.Provider>
  );
}
