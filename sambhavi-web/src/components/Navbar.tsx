import { useEffect, useRef, useState } from "react";
import { useApp } from "../ctx";
import { Bell } from "../notifications";

export default function Navbar({ view }: { view: string }) {
  const { user, isAdmin, openAuth, openChats, go, logout, unread, notify, openNotification } = useApp();
  const [small, setSmall] = useState(false);
  const [menu, setMenu] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);

  useEffect(() => { const f = () => setSmall(scrollY > 60); f(); addEventListener("scroll", f, { passive: true }); return () => removeEventListener("scroll", f); }, []);
  // close the phone dropdown on outside tap, Escape, or when the login state changes
  useEffect(() => {
    if (!menu) return;
    const out = (e: Event) => { if (!wrap.current?.contains(e.target as Node)) setMenu(false); };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    document.addEventListener("pointerdown", out); addEventListener("keydown", esc);
    return () => { document.removeEventListener("pointerdown", out); removeEventListener("keydown", esc); };
  }, [menu]);
  useEffect(() => setMenu(false), [user, view]);

  const jump = (id: string) => {
    if (view !== "home") { go("home"); setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 120); }
    else document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };
  const pick = (fn: () => void) => () => { setMenu(false); fn(); };

  return (
    <header className={`nav ${small ? "small" : ""}`}>
      <div className="brand" onClick={() => go("home")} data-cursor="Home" role="link" tabIndex={0}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 3a9 9 0 1 0 5 15A8 8 0 0 1 16 3z" /><path d="M18 5v3M16.5 6.5h3" /></svg>
        <span>Shambhavi</span>
      </div>
      <nav>
        <button onClick={() => jump("readings")}>Readings</button>
        <button onClick={() => jump("process")}>Process</button>
        <button onClick={() => jump("reviews")}>Reviews</button>
      </nav>

      {/* ---- desktop / tablet ---- */}
      <div className="nav-cta desk">
        {user ? (<>
          <Bell n={notify} onOpen={openNotification} />
          {isAdmin && <button className="pill admin" onClick={() => go("admin")}>Admin panel{unread > 0 && <span className="cnt nav-cnt">{unread}</span>}</button>}
          {!isAdmin && <button className="pill" onClick={() => go("room")} title="Private room with the reader">🔒 Private room{unread > 0 && <span className="cnt nav-cnt">{unread}</span>}</button>}
          <button className="pill" onClick={() => go("account")} title="My account" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="avatar" style={{ width: 24, height: 24, fontSize: 11 }}>{user.firstName[0]}{user.lastName[0]}</span>{user.firstName}
          </button>
          <button className="pill" onClick={logout}>Log out</button>
        </>) : (
          <button className="pill" onClick={() => openAuth("login")}>Log in</button>
        )}
        {!isAdmin && <button className="btn solid sm" onClick={openChats}>Start a chat</button>}
      </div>

      {/* ---- phone: name, then Log in; when logged in: Private chat + dropdown ---- */}
      <div className="nav-cta mob" ref={wrap}>
        {!user ? (
          <button className="pill" onClick={() => openAuth("login")}>Log in</button>
        ) : (<>
          <button className="pill chatpill" onClick={openChats}><span className="long">Private chat</span><span className="short">Chat</span>{unread > 0 && <span className="cnt nav-cnt">{unread}</span>}</button>
          <Bell n={notify} onOpen={openNotification} />
          <button className={`pill menu-btn ${menu ? "open" : ""}`} onClick={() => setMenu((v) => !v)} aria-haspopup="menu" aria-expanded={menu} aria-label="Open menu">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M6 9l6 6 6-6" /></svg>
          </button>
          {menu && (
            <div className="menu" role="menu">
              <div className="menu-head"><b>{user.fullName}</b><small>{user.email}</small></div>
              {isAdmin
                ? <button role="menuitem" onClick={pick(() => go("admin"))}>Admin panel</button>
                : <><button role="menuitem" onClick={pick(() => go("account"))}>My account</button>
                    <button role="menuitem" onClick={pick(openChats)}>Start a chat session</button></>}
              <div className="menu-sep" />
              <button role="menuitem" onClick={pick(() => jump("readings"))}>Readings</button>
              <button role="menuitem" onClick={pick(() => jump("process"))}>Process</button>
              <button role="menuitem" onClick={pick(() => jump("reviews"))}>Reviews</button>
              <div className="menu-sep" />
              <button role="menuitem" className="out" onClick={pick(logout)}>Log out</button>
            </div>
          )}
        </>)}
      </div>
    </header>
  );
}
