import { useState } from "react";
import { authApi } from "../api";
import { useApp } from "../ctx";
import { fmtDate } from "../util";
import MyReviews from "./MyReviews";

/** A normal user's page: profile, password, own bookings and own reviews. */
export default function Account() {
  const { user, setUser, openChats } = useApp();
  const u = user!;
  const [p, setP] = useState({ firstName: u.firstName, lastName: u.lastName, phoneNumber: u.phoneNumber, dob: u.dob ?? "" });
  const [pm, setPm] = useState<{ k: "ok" | "err"; t: string } | null>(null); const [saving, setSaving] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setPm(null);
    try { setUser(await authApi.updateProfile(p)); setPm({ k: "ok", t: "Profile saved." }); } catch (er: any) { setPm({ k: "err", t: er.message }); } finally { setSaving(false); }
  };


  return (
    <div className="page">
      <h1>Hello, {u.firstName}</h1>
      <p className="sub">Your profile and reviews.</p>

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
          <div className="msg ok" style={{ marginBottom: 0 }}>Email verified. Your account is ready for private tarot chat.</div>
        </div>
      </div>

      <div className="panel" style={{ marginTop: 20 }}>
        <h3>Private tarot chat</h3>
        <p className="sub">Continue your conversation with the tarot reader.</p>
        <button className="btn solid sm" onClick={openChats}>Open private chat</button>
      </div>

      <div className="panel" style={{ marginTop: 20 }}>
        <h3>My reviews</h3>
        <MyReviews />
      </div>

    </div>
  );
}
