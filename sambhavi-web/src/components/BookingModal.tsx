import { useMemo, useState } from "react";
import Modal from "./Modal";
import { bookingApi, packageApi } from "../api";
import { useLoad } from "../hooks";
import { useApp } from "../ctx";
import { fmtDateTime, inr } from "../util";

const SLOTS = ["10:00", "11:30", "13:00", "14:30", "16:00", "17:30", "19:00", "20:30", "21:30"];
const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const label = (t: string) => { const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${pad(m)} ${h < 12 ? "AM" : "PM"}`; };

export default function BookingModal({ pkgId, onClose }: { pkgId?: number; onClose: () => void }) {
  const { toast, refresh, go } = useApp();
  const { data: pkgs, loading, error } = useLoad(() => packageApi.list(), []);
  const [step, setStep] = useState(pkgId ? 1 : 0);
  const [pid, setPid] = useState<number | undefined>(pkgId);
  const [day, setDay] = useState(""); const [time, setTime] = useState("");
  const [q, setQ] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);

  const days = useMemo(() => Array.from({ length: 12 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() + i); return d; }), []);
  const pkg = pkgs?.find((p) => p.id === pid);
  const when = day && time ? new Date(`${day}T${time}:00`) : null;
  const past = (t: string) => day === ymd(new Date()) && new Date(`${day}T${t}:00`).getTime() < Date.now() + 30 * 60_000;

  const book = async () => {
    if (!pkg || !when) return;
    setBusy(true); setErr("");
    try {
      await bookingApi.create(pkg.id, when.toISOString(), q.trim());
      refresh(); toast("Booked! You can follow it in your account."); onClose(); go("account");
    } catch (e: any) { setErr(e.message); } finally { setBusy(false); }
  };

  return (
    <Modal onClose={onClose} label="Book a reading">
      <div className="eyebrow">Step {Math.max(step, 0) + 1} of 3</div>
      <div className="mtitle">{["Choose your reading", "Pick a day and time", "Your question"][step]}</div>
      <div className="dots">{[0, 1, 2].map((i) => <i key={i} className={i <= step ? "on" : ""} />)}</div>

      {step === 0 && (<>
        {loading && <div className="skeleton" />}
        {error && <div className="msg err">{error}</div>}
        {pkgs?.map((p) => (
          <button key={p.id} className={`opt ${pid === p.id ? "on" : ""}`} onClick={() => setPid(p.id)} type="button">
            <span><b style={{ font: "500 18px var(--disp)", color: "var(--ink)" }}>{p.name}</b><small>{p.cardCount} {p.cardCount === 1 ? "card" : "cards"}{p.description ? ` · ${p.description}` : ""}</small></span>
            <b>{inr(p.price)}</b>
          </button>
        ))}
        <div className="mbtns"><button key="next0" className="btn solid grow" disabled={!pid} onClick={() => setStep(1)}>Continue</button></div>
      </>)}

      {step === 1 && (<>
        <span className="mlabel">Day</span>
        <div className="chips">{days.map((d) => (
          <button key={ymd(d)} type="button" className={day === ymd(d) ? "on" : ""} onClick={() => { setDay(ymd(d)); setTime(""); }}>
            {d.toLocaleDateString("en-IN", { weekday: "short" })}<small>{d.toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</small>
          </button>))}
        </div>
        <span className="mlabel">Time</span>
        <div className="chips t">{SLOTS.map((t) => <button key={t} type="button" disabled={!day || past(t)} className={time === t ? "on" : ""} onClick={() => setTime(t)}>{label(t)}</button>)}</div>
        <div className="mbtns">
          <button key="back1" className="btn line" onClick={() => setStep(0)}>Back</button>
          <button key="next1" className="btn solid grow" disabled={!when} onClick={() => setStep(2)}>Continue</button>
        </div>
      </>)}

      {step === 2 && pkg && when && (<>
        <div className="sum"><b>{inr(pkg.price)}</b>{pkg.name} · {pkg.cardCount} {pkg.cardCount === 1 ? "card" : "cards"}<br />{fmtDateTime(when.toISOString())}</div>
        <label className="mlabel" htmlFor="q">What would you like to ask? (optional)</label>
        <textarea id="q" rows={4} maxLength={1000} placeholder="Share as little or as much as you like…" value={q} onChange={(e) => setQ(e.target.value)} />
        {err && <div className="msg err" role="alert">{err}</div>}
        <div className="mbtns">
          <button key="back2" className="btn line" onClick={() => setStep(1)}>Back</button>
          <button key="confirm" className="btn solid grow" disabled={busy} onClick={book}>{busy ? "Booking…" : `Confirm · ${inr(pkg.price)}`}</button>
        </div>
      </>)}
    </Modal>
  );
}
