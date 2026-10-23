import { useState } from "react";
import Modal from "./Modal";
import { authApi } from "../api";
import { useApp } from "../ctx";

const PASS_RE = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

export default function AuthModal({ mode: start, reason, onClose, onDone }: { mode: "login" | "register"; reason?: string; onClose: () => void; onDone: () => void }) {
  const { setUser, toast, go } = useApp();
  const [mode, setMode] = useState(start);
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", phoneNumber: "", dob: "", password: "" });
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setErr("");
    if (mode === "register") {
      if (!f.firstName.trim() || !f.lastName.trim()) return setErr("Please enter your first and last name.");
      if (f.phoneNumber.replace(/\D/g, "").length < 8) return setErr("Please enter a valid phone number.");
      if (!PASS_RE.test(f.password)) return setErr("Password needs 8+ characters with at least one letter and one number.");
    }
    setBusy(true);
    try {
      const u = mode === "login"
        ? await authApi.login(f.email.trim(), f.password)
        : await authApi.register({ firstName: f.firstName.trim(), lastName: f.lastName.trim(), email: f.email.trim(), phoneNumber: f.phoneNumber.trim(), password: f.password, dob: f.dob || null });
      setUser(u);
      toast(mode === "login" ? `Welcome back, ${u.firstName}.` : `Welcome, ${u.firstName}. Your account is ready.`);
      // One login for everybody: an admin account lands in the admin panel, a user stays on the site.
      if (u.role === "Admin") { go("admin"); onClose(); } else { onClose(); onDone(); }
    } catch (er: any) { setErr(er.message); } finally { setBusy(false); }
  };

  return (
    <Modal onClose={onClose} label={mode === "login" ? "Log in" : "Create account"}>
      <div className="eyebrow">{reason ?? (mode === "login" ? "Welcome back" : "Join in a minute")}</div>
      <div className="mtitle">{mode === "login" ? "Log in" : "Create your account"}</div>
      <form onSubmit={submit} noValidate>
        {mode === "register" && (<>
          <div className="two"><input placeholder="First name" autoComplete="given-name" value={f.firstName} onChange={set("firstName")} /><input placeholder="Last name" autoComplete="family-name" value={f.lastName} onChange={set("lastName")} /></div>
          <input placeholder="Phone number" type="tel" autoComplete="tel" value={f.phoneNumber} onChange={set("phoneNumber")} />
        </>)}
        <input placeholder="Email" type="email" autoComplete="email" value={f.email} onChange={set("email")} required />
        {mode === "register" && (<><label className="mlabel" htmlFor="dob">Date of birth (optional)</label><input id="dob" type="date" max={new Date().toISOString().slice(0, 10)} value={f.dob} onChange={set("dob")} /></>)}
        <input placeholder="Password" type="password" autoComplete={mode === "login" ? "current-password" : "new-password"} value={f.password} onChange={set("password")} required />
        {mode === "register" && <p className="sub" style={{ margin: "-4px 0 12px", fontSize: 13 }}>At least 8 characters, with a letter and a number.</p>}
        {err && <div className="msg err" role="alert">{err}</div>}
        <button className="btn solid" style={{ width: "100%" }} disabled={busy}>{busy ? "Please wait…" : mode === "login" ? "Log in" : "Create account"}</button>
      </form>
      <div className="switch">
        {mode === "login" ? <>New here? <button onClick={() => { setMode("register"); setErr(""); }}>Create an account</button></>
          : <>Already registered? <button onClick={() => { setMode("login"); setErr(""); }}>Log in</button></>}
      </div>
    </Modal>
  );
}
