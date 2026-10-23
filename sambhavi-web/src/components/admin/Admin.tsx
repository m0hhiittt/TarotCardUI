import { useState } from "react";
import { adminApi } from "../../api";
import { useApp } from "../../ctx";
import { useLoad } from "../../hooks";
import { CountUp } from "../Motion";
import UsersPanel from "./UsersPanel";
import BookingsPanel from "./BookingsPanel";
import ReviewsPanel from "./ReviewsPanel";
import PackagesPanel from "./PackagesPanel";

type Tab = "overview" | "bookings" | "reviews" | "users" | "packages";

/** Admin panel. Only reachable for accounts whose role is Admin (the API enforces it as well). */
export default function Admin() {
  const { user, version } = useApp();
  const [tab, setTab] = useState<Tab>("overview");
  const d = useLoad(() => adminApi.dashboard(), [version]);
  const s = d.data;

  const TabBtn = ({ id, label, count }: { id: Tab; label: string; count?: number }) =>
    <button className={tab === id ? "on" : ""} onClick={() => setTab(id)}>{label}{!!count && <span className="cnt">{count}</span>}</button>;

  return (
    <div className="page">
      <h1>Admin panel</h1>
      <p className="sub">Signed in as {user?.fullName}. Manage bookings, reviews, users and readings.</p>
      <div className="tabs" role="tablist">
        <TabBtn id="overview" label="Overview" />
        <TabBtn id="bookings" label="Bookings" count={s?.pendingBookings} />
        <TabBtn id="reviews" label="Reviews" count={s?.pendingReviews} />
        <TabBtn id="users" label="Users" />
        <TabBtn id="packages" label="Packages" />
      </div>

      {tab === "overview" && (<>
        {d.error && <div className="state err" style={{ marginTop: 0 }}>{d.error}</div>}
        <div className="kpis">
          <div className="kpi"><b>{s ? <CountUp to={s.totalUsers} /> : "–"}</b><span>Users</span></div>
          <div className="kpi"><b>{s ? <CountUp to={s.totalBookings} /> : "–"}</b><span>Bookings</span></div>
          <div className={`kpi ${s?.pendingBookings ? "hot" : ""}`}><b>{s ? <CountUp to={s.pendingBookings} /> : "–"}</b><span>Bookings to confirm</span></div>
          <div className="kpi"><b>{s ? <CountUp to={s.totalReviews} /> : "–"}</b><span>Reviews</span></div>
          <div className={`kpi ${s?.pendingReviews ? "hot" : ""}`}><b>{s ? <CountUp to={s.pendingReviews} /> : "–"}</b><span>Reviews to approve</span></div>
          <div className="kpi"><b>{s ? <CountUp to={s.revenue} prefix="₹" /> : "–"}</b><span>Revenue (confirmed &amp; completed)</span></div>
        </div>
        <div className="row">
          <button className="btn solid sm" onClick={() => setTab("bookings")}>Review bookings</button>
          <button className="btn line sm" onClick={() => setTab("reviews")}>Moderate reviews</button>
        </div>
      </>)}
      {tab === "bookings" && <BookingsPanel />}
      {tab === "reviews" && <ReviewsPanel />}
      {tab === "users" && <UsersPanel />}
      {tab === "packages" && <PackagesPanel />}
    </div>
  );
}
