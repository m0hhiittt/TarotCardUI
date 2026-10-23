import { useState } from "react";
import { adminApi, packageApi } from "../../api";
import { useApp } from "../../ctx";
import { useLoad } from "../../hooks";
import { inr } from "../../util";
import Modal, { Confirm } from "../Modal";
import { TableWrap } from "./Shared";
import type { Pkg } from "../../types";

type Draft = { id?: number; name: string; description: string; cardCount: string; price: string };
const blank: Draft = { name: "", description: "", cardCount: "1", price: "" };

export default function PackagesPanel() {
  const { toast, refresh, version } = useApp();
  const { data, loading, error } = useLoad(() => packageApi.list(), [version]);
  const [edit, setEdit] = useState<Draft | null>(null); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [del, setDel] = useState<Pkg | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault(); if (!edit) return; setErr("");
    const body = { name: edit.name.trim(), description: edit.description.trim() || null, cardCount: Number(edit.cardCount), price: Number(edit.price) };
    if (!body.name) return setErr("Name is required.");
    if (!(body.cardCount >= 1 && body.cardCount <= 78)) return setErr("Cards must be between 1 and 78.");
    if (!(body.price > 0)) return setErr("Price must be more than 0.");
    setBusy(true);
    try {
      if (edit.id) await adminApi.updatePackage(edit.id, body); else await adminApi.createPackage(body);
      toast(edit.id ? "Package updated." : "Package created."); setEdit(null); refresh();
    } catch (er: any) { setErr(er.message); } finally { setBusy(false); }
  };
  const remove = async () => {
    if (!del) return; const p = del; setDel(null);
    try { await adminApi.deletePackage(p.id); toast("Package deleted."); refresh(); } catch (e: any) { toast(e.message, "err"); }
  };

  return (<>
    <div className="toolbar"><button className="btn solid sm" onClick={() => { setEdit(blank); setErr(""); }}>Add package</button></div>
    <TableWrap loading={loading && !data} error={error} empty={data && data.length === 0 ? "No packages yet." : undefined}>
      <table>
        <thead><tr><th>Name</th><th>Cards</th><th>Price</th><th>Description</th><th /></tr></thead>
        <tbody>{data?.map((p) => (
          <tr key={p.id}>
            <td><b>{p.name}</b></td><td>{p.cardCount}</td><td>{inr(p.price)}</td><td className="msgcell">{p.description}</td>
            <td style={{ textAlign: "right", whiteSpace: "nowrap" }}>
              <button className="btn line sm" onClick={() => { setEdit({ id: p.id, name: p.name, description: p.description ?? "", cardCount: String(p.cardCount), price: String(p.price) }); setErr(""); }}>Edit</button>{" "}
              <button className="btn danger sm" onClick={() => setDel(p)}>Delete</button></td>
          </tr>))}
        </tbody>
      </table>
    </TableWrap>
    {edit && (
      <Modal onClose={() => setEdit(null)} label="Package">
        <div className="eyebrow">{edit.id ? "Edit" : "New"} package</div><div className="mtitle">{edit.id ? edit.name || "Package" : "Add a reading"}</div>
        <form onSubmit={save} noValidate>
          <label className="mlabel">Name</label><input value={edit.name} maxLength={100} onChange={(e) => setEdit({ ...edit, name: e.target.value })} autoFocus />
          <label className="mlabel">Description</label><textarea rows={3} maxLength={500} value={edit.description} onChange={(e) => setEdit({ ...edit, description: e.target.value })} />
          <div className="two"><div><label className="mlabel">Cards</label><input type="number" min={1} max={78} value={edit.cardCount} onChange={(e) => setEdit({ ...edit, cardCount: e.target.value })} /></div>
            <div><label className="mlabel">Price (₹)</label><input type="number" min={1} step="0.01" value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value })} /></div></div>
          {err && <div className="msg err">{err}</div>}
          <div className="mbtns"><button type="button" className="btn line" onClick={() => setEdit(null)}>Cancel</button><button className="btn solid grow" disabled={busy}>{busy ? "Saving…" : "Save package"}</button></div>
        </form>
      </Modal>)}
    {del && <Confirm title={`Delete “${del.name}”?`} text="Packages that already have bookings cannot be deleted." action="Delete package" onYes={remove} onNo={() => setDel(null)} />}
  </>);
}
