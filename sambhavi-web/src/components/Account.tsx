import { useState } from "react";
import { authApi, bookingApi } from "../api";
import { useLoad } from "../hooks";
import { useApp } from "../ctx";
import { fmtDate, fmtDateTime, inr } from "../util";
import { Confirm } from "./Modal";
import MyReviews from "./MyReviews";
import type { Booking } from "../types";

/** A normal user's page: profile, password, own bookings and own reviews. */
export default function Account() {
  const { user, setUser, toast, openBooking, version, refresh } = useApp();
  const u = user!;
  const [p, setP] = useState({ firstName: u.firstName, lastName: u.lastName, phoneNumber: u.phoneNumber, dob: u.dob ?? "" });
  const [pm, setPm] = useState<{ k: "ok" | "err"; t: string } | null>(null); const [saving, setSaving] = useState(false);
  const bookings = useLoad(() => bookingApi.mine(), [version]);
  const [ask, setAsk] = useState<{ id: number } | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setPm(null);
    try { setUser(await authApi.updateProfile(p)); setPm({ k: "ok", t: "Profile saved." }); } catch (er: any) { setPm({ k: "err", t: er.message }); } finally { setSaving(false); }
  };
  const doAsk = async () => {
    if (!ask) return; const a = ask; setAsk(null);
    try {
      await bookingApi.cancel(a.id); toast("Booking cancelled.");
      refresh();
    } catch (er: any) { toast(er.message, "err"); }
  };

  return (
    <div className="page">
      <h1>Hello, {u.firstName}</h1>
      <p className="sub">Your details, bookings and reviews, all in one place.</p>

      <div className="grid2">
        <form className="panel" onSubmit={save}>
          <h3>Your details</h3>
          <div className="two"><div><label className="mlabel">First name</label><input value={p.firstName} onChange={(e) => setP({ ...p, firstName: e.target.value })} required /></div>
            <div><label className="mlabel">Last name</label><input value={p.lastName} onChange={(e) => setP({ ...p, lastName: e.target.value })} required /></div></div>
          <label className="mlabel">Email</label><input value={u.email} disabled style={{ opacity: .6 }} />
          <div className="two"><div><label className="mlabel">Phone</label><input value={p.phoneNumber} onChange={(e) => setP({ ...p, phoneNumber: e.target.value })} required /></div>
            <div><label className="mlabel">Date of birth</label><input type="date" value={p.dob} onChange={(e) => setP({ ...p, dob: e.target.value })} /></div></div>
          {pm && <div className={`msg ${pm.k}`}>{pm.t}</div>}
          <div className="row" style={{ alignItems: "center" }}><button className="btn solid sm" disabled={saving}>{saving ? "Saving…" : "Save details"}</button><span className="sub" style={{ margin: 0, fontSize: 13 }}>Member since {fmtDate(u.createdAt)}</span></div>
        </form>

        <div className="panel">
          <h3>Sign-in</h3>
          <p className="sub" style={{ margin: "0 0 10px" }}>There is no password. Each time you log in, we email a 6-digit code to:</p>
          <p style={{ margin: "0 0 12px", wordBreak: "break-all" }}><b>{u.email}</b></p>
          <div className="msg ok" style={{ marginBottom: 0 }}>Email verified. You can book readings.</div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 20 }}>
        <h3 style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>My bookings <button type="button" className="btn solid sm" onClick={() => openBooking()}>New booking</button></h3>
        {bookings.loading && !bookings.data && <><div className="skeleton" /><div className="skeleton" /></>}
        {bookings.error && <div className="msg err">{bookings.error}</div>}
        {bookings.data?.length === 0 && <p className="empty">No bookings yet. Your first reading is one click away.</p>}
        <div className="list">
          {bookings.data?.map((b: Booking) => (
            <div className="item" key={b.id}>
              <div><b>{b.packageName}</b> <span className={`tag ${b.status}`}>{b.status}</span>
                <small>{fmtDateTime(b.appointmentDateTime)} · {b.cardCount} {b.cardCount === 1 ? "card" : "cards"} · {inr(b.price)}</small>
                {b.question && <small>“{b.question}”</small>}</div>
              {(b.status === "Pending" || b.status === "Confirmed") && <button className="btn danger sm" onClick={() => setAsk({ id: b.id })}>Cancel</button>}
            </div>
          ))}
        </div>
      </div>

      <div className="panel" style={{ marginTop: 20 }}>
        <h3>My reviews</h3>
        <MyReviews />
      </div>

      {ask && <Confirm title="Cancel this booking?" text="The reading will be cancelled. You can always book another." action="Cancel booking" onYes={doAsk} onNo={() => setAsk(null)} />}
    </div>
  );
}
