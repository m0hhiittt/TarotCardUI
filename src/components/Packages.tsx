import { packageApi } from "../api";
import { useLoad } from "../hooks";
import { useApp } from "../ctx";
import { inr } from "../util";
import { Heading, Reveal, CountUp, spotMove } from "./Motion";
import type { Pkg } from "../types";

function Mini({ n }: { n: number }) {
  return <div className="mini">{Array.from({ length: Math.min(Math.max(n, 1), 3) }).map((_, i) => <i key={i} />)}</div>;
}

export default function Packages() {
  const { openBooking, version } = useApp();
  const { data, loading, error, reload } = useLoad(() => packageApi.list(), [version]);
  const list = [...(data ?? [])].sort((a, b) => a.cardCount - b.cardCount);
  const feat = list.length > 3 ? list[list.length - 1] : undefined;
  const rest = feat ? list.slice(0, -1) : list;
  const popular = list.find((p) => p.cardCount === 3)?.id;

  const Card = ({ p, f }: { p: Pkg; f?: boolean }) => (
    <article className={`pk spot ${f ? "feat" : ""}`} onMouseMove={spotMove}>
      {!f && p.id === popular && <span className="badge">Most loved</span>}
      <Mini n={p.cardCount} />
      <div className="fb" style={f ? undefined : { display: "contents" }}>
        <h3>{p.name}</h3>
        <p>{p.description || `A ${p.cardCount}-card reading.`}</p>
        <div className="pk-foot">
          <div className="price"><b>{inr(p.price)}</b><span>{p.cardCount} {p.cardCount === 1 ? "card" : "cards"}</span></div>
          <button className="btn solid sm" onClick={() => openBooking(p.id)} data-cursor="Book">Book</button>
        </div>
      </div>
    </article>
  );

  return (
    <section className="section" id="readings">
      <p className="kicker">Readings & prices</p>
      <Heading text="Pick the depth that fits your question" />
      <p className="sub">Every reading is personal, written for you and delivered within 24 hours.</p>
      {loading && !data && <div className="bento">{[0, 1, 2].map((i) => <div key={i} className="skeleton" style={{ height: 280 }} />)}</div>}
      {error && <div className="state err">{error} <button className="btn line sm" style={{ marginLeft: 12 }} onClick={reload}>Retry</button></div>}
      {data && list.length === 0 && <div className="state">No readings are available right now. Please check back soon.</div>}
      {data && list.length > 0 && (
        <div className="bento">
          {rest.map((p, i) => <Reveal key={p.id} delay={i * .08}><Card p={p} /></Reveal>)}
          {feat && <Reveal className="featwrap" ><Card p={feat} f /></Reveal>}
        </div>
      )}
      {data && list.length > 0 && <p className="sub" style={{ marginTop: 22 }}>From <b style={{ color: "var(--a)" }}><CountUp to={Math.min(...list.map((p) => p.price))} prefix="₹" /></b> · pay after your reading is confirmed.</p>}
    </section>
  );
}
