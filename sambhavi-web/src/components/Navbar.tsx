import { useEffect, useState } from "react";
import { useApp } from "../ctx";

export default function Navbar({ view }: { view: string }) {
  const { user, isAdmin, openAuth, openBooking, go, logout } = useApp();
  const [small, setSmall] = useState(false);
  useEffect(() => { const f = () => setSmall(scrollY > 60); f(); addEventListener("scroll", f, { passive: true }); return () => removeEventListener("scroll", f); }, []);

  const jump = (id: string) => {
    if (view !== "home") { go("home"); setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 120); }
    else document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <header className={`nav ${small ? "small" : ""}`}>
      <div className="brand" onClick={() => go("home")} data-cursor="Home" role="link" tabIndex={0}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 3a9 9 0 1 0 5 15A8 8 0 0 1 16 3z" /><path d="M18 5v3M16.5 6.5h3" /></svg>
        <span>Sambhavi Shiva</span>
      </div>
      <nav>
        <button onClick={() => jump("readings")}>Readings</button>
        <button onClick={() => jump("process")}>Process</button>
        <button onClick={() => jump("reviews")}>Reviews</button>
      </nav>
      <div className="nav-cta">
        {user ? (<>
          {isAdmin && <button className={`pill admin`} onClick={() => go("admin")}>Admin panel</button>}
          <button className="pill" onClick={() => go("account")} title="My account" style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span className="avatar" style={{ width: 24, height: 24, fontSize: 11 }}>{user.firstName[0]}{user.lastName[0]}</span>{user.firstName}
          </button>
          <button className="pill" onClick={logout}>Log out</button>
        </>) : (
          <button className="pill" onClick={() => openAuth("login")}>Log in</button>
        )}
        {!isAdmin && <button className="btn solid sm" onClick={() => openBooking()}>Book a reading</button>}
      </div>
    </header>
  );
}
