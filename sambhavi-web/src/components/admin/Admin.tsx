import { useEffect, useRef, useState } from "react";
import { adminApi } from "../../api";
import { useApp } from "../../ctx";
import { useLoad } from "../../hooks";
import { CountUp } from "../Motion";
import UsersPanel from "./UsersPanel";
import ReviewsPanel from "./ReviewsPanel";
import ChatPanel from "./ChatPanel";

type Tab = "overview" | "reviews" | "chats" | "users";

/** Admin panel. Only reachable for accounts whose role is Admin (the API enforces it as well). */
export default function Admin({ start = "overview", startClient }: { start?: Tab; startClient?: string }) {
  const { user, version, unread, setViewing } = useApp();
  const [tab, setTab] = useState<Tab>(start);
  const tabsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const box = tabsRef.current, on = box?.querySelector<HTMLElement>("button.on");
    if (box && on) box.scrollTo({ left: on.offsetLeft - (box.clientWidth - on.offsetWidth) / 2, behavior: "smooth" });
  }, [tab]);
  useEffect(() => { setViewing(`admin:${tab}`); return () => setViewing(""); }, [tab, setViewing]);
  const d = useLoad(() => adminApi.dashboard(), [version]);
  const s = d.data;

  const TabBtn = ({ id, label, count }: { id: Tab; label: string; count?: number }) =>
    <button className={tab === id ? "on" : ""} onClick={() => setTab(id)}>{label}{!!count && <span className="cnt">{count}</span>}</button>;

  return (
    <div className="page">
      <h1>Admin panel</h1>
      <p className="sub">Signed in as {user?.fullName}. Manage private chat conversations, users and reviews.</p>
      <div className="tabs" role="tablist" ref={tabsRef}>
        <TabBtn id="overview" label="Overview" />
        <TabBtn id="reviews" label="Reviews" />
        <TabBtn id="chats" label="Private chats" count={unread} />
        <TabBtn id="users" label="Users" />
      </div>

      {tab === "overview" && (<>
        {d.error && <div className="state err" style={{ marginTop: 0 }}>{d.error}</div>}
        <div className="kpis">
          <div className="kpi"><b>{s ? <CountUp to={s.totalUsers} /> : "–"}</b><span>Users</span></div>
          <div className="kpi"><b>{s ? <CountUp to={s.totalReviews} /> : "–"}</b><span>Reviews</span></div>
        </div>
        <div className="row">
          <button className="btn line sm" onClick={() => setTab("reviews")}>View reviews</button>
        </div>
      </>)}
      {tab === "reviews" && <ReviewsPanel />}
      {tab === "chats" && <ChatPanel startUserId={startClient} />}
      {tab === "users" && <UsersPanel />}
    </div>
  );
}
