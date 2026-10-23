import { useState } from "react";
import { adminApi } from "../../api";
import { useApp } from "../../ctx";
import { useLoad } from "../../hooks";
import { fmtDate } from "../../util";
import { Confirm } from "../Modal";
import { Pager, TableWrap, useDebounced } from "./Shared";
import type { Role, User } from "../../types";

export default function UsersPanel() {
  const { user: me, toast, refresh, version } = useApp();
  const [search, setSearch] = useState(""); const [page, setPage] = useState(1);
  const s = useDebounced(search);
  const { data, loading, error, reload } = useLoad(() => adminApi.users({ search: s, page, pageSize: 10 }), [s, page, version]);
  const [del, setDel] = useState<User | null>(null);

  const role = async (u: User, r: Role) => {
    try { await adminApi.changeRole(u.id, r); toast(`${u.fullName} is now ${r === "Admin" ? "an admin" : "a user"}.`); reload(); }
    catch (e: any) { toast(e.message, "err"); reload(); }
  };
  const remove = async () => {
    if (!del) return; const u = del; setDel(null);
    try { await adminApi.deleteUser(u.id); toast("User deleted."); refresh(); } catch (e: any) { toast(e.message, "err"); }
  };

  return (<>
    <div className="toolbar"><input placeholder="Search name, email or phone…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} /></div>
    <TableWrap loading={loading && !data} error={error} empty={data && data.items.length === 0 ? "No users found." : undefined}>
      <table>
        <thead><tr><th>Name</th><th>Contact</th><th>Joined</th><th>Role</th><th /></tr></thead>
        <tbody>{data?.items.map((u) => (
          <tr key={u.id}>
            <td><b>{u.fullName}</b>{u.id === me?.id && <small>You</small>}</td>
            <td>{u.email}<small>{u.phoneNumber}</small></td>
            <td>{fmtDate(u.createdAt)}</td>
            <td><select value={u.role} disabled={u.id === me?.id} onChange={(e) => role(u, e.target.value as Role)} aria-label={`Role for ${u.fullName}`}><option>User</option><option>Admin</option></select></td>
            <td style={{ textAlign: "right" }}>{u.id !== me?.id && <button className="btn danger sm" onClick={() => setDel(u)}>Delete</button>}</td>
          </tr>))}
        </tbody>
      </table>
    </TableWrap>
    {data && data.totalCount > 0 && <Pager page={data.page} totalPages={data.totalPages} total={data.totalCount} onPage={setPage} />}
    {del && <Confirm title={`Delete ${del.fullName}?`} text="This also removes their bookings and reviews. It cannot be undone." action="Delete user" onYes={remove} onNo={() => setDel(null)} />}
  </>);
}
