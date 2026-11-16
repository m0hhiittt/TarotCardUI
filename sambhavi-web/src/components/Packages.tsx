import { useApp } from "../ctx";
import { Heading } from "./Motion";

export default function Packages() {
  const { openChats } = useApp();
  return (
    <section className="section" id="readings">
      <p className="kicker">Private tarot session</p>
      <Heading text="One card. One question. A private conversation." />
      <p className="sub">Draw your card for free. When you are ready to share it with the reader, start a test chat session.</p>
      <article className="pk" style={{ maxWidth: 520, margin: "34px auto", textAlign: "center" }}>
        <div className="mini"><i /></div><h3>Tarot reader chat</h3>
        <p>Share your selected card, explain your question and chat privately with the reader.</p>
        <div className="price" style={{ justifyContent: "center", margin: "22px 0" }}><b>₹50</b><span>per test session</span></div>
        <button className="btn solid" onClick={openChats}>Start chat</button>
        <p className="hint-line">Test mode: the Pay button does not process real money.</p>
      </article>
    </section>
  );
}
