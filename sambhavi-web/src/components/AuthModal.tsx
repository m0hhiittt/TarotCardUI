import { useEffect, useRef, useState } from "react";
import Modal from "./Modal";
import { authApi } from "../api";
import { useApp } from "../ctx";
import type { OtpSent } from "../types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

/**
 * Login and sign-up both work in two steps and have NO password:
 *   1) type your email (sign-up also asks name + phone) -> we email a 6-digit code
 *   2) type the code -> logged in (or the account is created)
 */
export default function AuthModal({ mode: start, reason, onClose, onDone }: { mode: "login" | "register"; reason?: string; onClose: () => void; onDone: () => void }) {
  const { setUser, toast, go } = useApp();
  const [mode, setMode] = useState(start);
  const [step, setStep] = useState<"form" | "code">("form");
  const [f, setF] = useState({ firstName: "", lastName: "", email: "", phoneNumber: "", dob: "" });
  const [code, setCode] = useState("");
  const [err, setErr] = useState(""); const [info, setInfo] = useState(""); const [busy, setBusy] = useState(false);
  const [resendIn, setResendIn] = useState(0); const [expiresIn, setExpiresIn] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });
  const email = f.email.trim().toLowerCase();

  // one-second timer for "Resend in 0:30" and "Code expires in 9:41"
  useEffect(() => {
    if (step !== "code") return;
    const t = setInterval(() => { setResendIn((n) => Math.max(0, n - 1)); setExpiresIn((n) => Math.max(0, n - 1)); }, 1000);
    return () => clearInterval(t);
  }, [step]);
  useEffect(() => { if (step === "code") codeRef.current?.focus(); }, [step]);

  const sent = (r: OtpSent) => { setResendIn(r.resendInSeconds); setExpiresIn(r.expiresInSeconds); };

  /** Step 1: ask the server to email a code. */
  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault(); setErr(""); setInfo("");
    if (!EMAIL_RE.test(email)) return setErr("Please enter a valid email address.");
    if (mode === "register") {
      if (!f.firstName.trim() || !f.lastName.trim()) return setErr("Please enter your first and last name.");
      if (f.phoneNumber.replace(/\D/g, "").length < 8) return setErr("Please enter a valid phone number.");
    }
    setBusy(true);
    try {
      const r = mode === "login"
        ? await authApi.requestLoginOtp(email)
        : await authApi.requestRegisterOtp({ firstName: f.firstName.trim(), lastName: f.lastName.trim(), email, phoneNumber: f.phoneNumber.trim(), dob: f.dob || null });
      sent(r); setCode(""); setStep("code");
    } catch (er: any) { setErr(er.message); } finally { setBusy(false); }
  };

  /** Step 2: check the code. */
  const verify = async (value = code) => {
    setErr(""); setInfo("");
    if (!/^\d{6}$/.test(value)) return setErr("Enter the 6-digit code from your email.");
    setBusy(true);
    try {
      const u = await authApi.verifyOtp(email, value, mode);
      setUser(u);
      toast(mode === "login" ? `Welcome back, ${u.firstName}.` : `Welcome, ${u.firstName}. Your account is ready.`);
      // One login for everybody: an admin account lands in the admin panel, a user stays on the site.
      if (u.role === "Admin") { go("admin"); onClose(); } else { onClose(); onDone(); }
    } catch (er: any) { setErr(er.message); setCode(""); codeRef.current?.focus(); } finally { setBusy(false); }
  };

  const resend = async () => {
    if (resendIn > 0 || busy) return;
    setErr(""); setInfo(""); setBusy(true);
    try { sent(await authApi.resendOtp(email, mode)); setCode(""); setInfo("A new code is on its way. The old one no longer works."); codeRef.current?.focus(); }
    catch (er: any) { setErr(er.message); } finally { setBusy(false); }
  };

  const onCode = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, "").slice(0, 6);
    setCode(v);
    if (v.length === 6) verify(v);   // submits by itself on the 6th digit
  };

  const back = () => { setStep("form"); setErr(""); setInfo(""); setCode(""); };

  return (
    <Modal onClose={onClose} label={mode === "login" ? "Log in" : "Create account"}>
      {step === "form" ? (<>
        <div className="eyebrow">{reason ?? (mode === "login" ? "Welcome back" : "Join in a minute")}</div>
        <div className="mtitle">{mode === "login" ? "Log in" : "Create your account"}</div>
        <form onSubmit={sendCode} noValidate>
          {mode === "register" && (<>
            <div className="two"><input placeholder="First name" autoComplete="given-name" value={f.firstName} onChange={set("firstName")} /><input placeholder="Last name" autoComplete="family-name" value={f.lastName} onChange={set("lastName")} /></div>
            <input placeholder="Phone number" type="tel" autoComplete="tel" value={f.phoneNumber} onChange={set("phoneNumber")} />
          </>)}
          <input placeholder="Email" type="email" inputMode="email" autoComplete="email" value={f.email} onChange={set("email")} required />
          {mode === "register" && (<><label className="mlabel" htmlFor="dob">Date of birth (optional)</label><input id="dob" type="date" max={new Date().toISOString().slice(0, 10)} value={f.dob} onChange={set("dob")} /></>)}
          <p className="sub" style={{ margin: "0 0 12px", fontSize: 13 }}>No password needed. We will email you a 6-digit code to confirm it is you.</p>
          {err && <div className="msg err" role="alert">{err}</div>}
          <button className="btn solid" style={{ width: "100%" }} disabled={busy}>{busy ? "Sending code…" : "Send code"}</button>
        </form>
        <div className="switch">
          {mode === "login" ? <>New here? <button onClick={() => { setMode("register"); setErr(""); }}>Create an account</button></>
            : <>Already registered? <button onClick={() => { setMode("login"); setErr(""); }}>Log in</button></>}
        </div>
      </>) : (<>
        <div className="eyebrow">Check your email</div>
        <div className="mtitle">Enter the code</div>
        <p className="sub" style={{ margin: "0 0 14px", fontSize: 14 }}>We sent a 6-digit code to <b style={{ color: "var(--ink)", wordBreak: "break-all" }}>{email}</b>. It also may be in your spam folder.</p>
        <form onSubmit={(e) => { e.preventDefault(); verify(); }} noValidate>
          <input ref={codeRef} className="otp" placeholder="••••••" inputMode="numeric" pattern="[0-9]*" autoComplete="one-time-code" maxLength={6} value={code} onChange={onCode} aria-label="6-digit code" />
          {err && <div className="msg err" role="alert">{err}</div>}
          {info && !err && <div className="msg ok" role="status">{info}</div>}
          <button className="btn solid" style={{ width: "100%" }} disabled={busy || code.length !== 6}>{busy ? "Checking…" : mode === "login" ? "Verify and log in" : "Verify and create account"}</button>
        </form>
        <div className="otpmeta">
          <span>{expiresIn > 0 ? `Code expires in ${mmss(expiresIn)}` : "Code expired. Please resend."}</span>
          <button type="button" onClick={resend} disabled={resendIn > 0 || busy}>{resendIn > 0 ? `Resend in 0:${String(resendIn).padStart(2, "0")}` : "Resend code"}</button>
        </div>
        <div className="switch"><button onClick={back}>← Use a different email</button></div>
      </>)}
    </Modal>
  );
}
