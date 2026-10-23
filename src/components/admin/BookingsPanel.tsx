import { useState } from "react";
import { adminApi } from "../../api";
import { useApp } from "../../ctx";
import { useLoad } from "../../hooks";
import { fmtDateTime, inr } from "../../util";
import { Confirm } from "../Modal";
import { Pager, TableWrap, useDebounced } from "./Shared";
import { BOOKING_STATUSES, type Booking, type BookingStatus } from "../../types";

export default function BookingsPanel() {
  const { toast, refresh, version } = useApp();
  const [search, setSearch] = useState(""); const [status, setStatus] = useState(""); const [page, setPage] = useState(1);
  const s = useDebounced(search);
  const { data, loading, error, reload } = useLoad(() => adminApi.bookings({ status, search: s, page, pageSize: 10 }), [s, status, page, version]);
  const [del, setDel] = useState<Booking | null>(null);

  const setSt = async (b: Booking, st: BookingStatus) => {
    try { await adminApi.setBookingStatus(b.id, st); toast(`Booking #${b.id} is now ${st}.`); refresh(); } catch (e: any) { toast(e.message, "err"); reload(); }
  };
  const remove = async () => {
    if (!del) return; const b = del; setDel(null);
    try { await adminApi.deleteBooking(b.id); toast("Booking deleted."); refresh(); } catch (e: any) { toast(e.message, "err"); }
  };

  return (<>
    <div className="toolbar">
      <input placeholder="Search customer or package…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
      <select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status"><option value="">All statuses</option>{BOOKING_STATUSES.map((x) => <option key={x}>{x}</option>)}</select>
    </div>
    <TableWrap loading={loading && !data} error={error} empty={data && data.items.length === 0 ? "No bookings match." : undefined}>
      <table>
        <thead><tr><th>#</th><th>Customer</th><th>Reading</th><th>When</th><th>Status</th><th /></tr></thead>
        <tbody>{data?.items.map((b) => (
          <tr key={b.id}>
            <td>{b.id}</td>
            <td><b>{b.userName}</b><small>{b.userEmail} · {b.userPhone}</small></td>
            <td>{b.packageName}<small>{b.cardCount} {b.cardCount === 1 ? "card" : "cards"} · {inr(b.price)}</small>{b.question && <small title={b.question}>“{b.question.length > 60 ? b.question.slice(0, 60) + "…" : b.question}”</small>}</td>
            <td>{fmtDateTime(b.appointmentDateTime)}</td>
            <td><select value={b.status} onChange={(e) => setSt(b, e.target.value as BookingStatus)} aria-label={`Status of booking ${b.id}`}>{BOOKING_STATUSES.map((x) => <option key={x}>{x}</option>)}</select></td>
            <td style={{ textAlign: "right" }}><button className="btn danger sm" onClick={() => setDel(b)}>Delete</button></td>
          </tr>))}
        </tbody>
      </table>
    </TableWrap>
    {data && data.totalCount > 0 && <Pager page={data.page} totalPages={data.totalPages} total={data.totalCount} onPage={setPage} />}
    {del && <Confirm title={`Delete booking #${del.id}?`} text="Linked reviews are kept, only the link is removed." action="Delete booking" onYes={remove} onNo={() => setDel(null)} />}
  </>);
}
