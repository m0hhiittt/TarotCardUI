import { useRef } from "react";
import { motion, useScroll, useTransform, useSpring, type MotionValue } from "framer-motion";
import { Back } from "./CardArt";
import { Heading } from "./Motion";

const STEPS = [
  { n: "01", t: "Choose your reading", p: "Pick one card for a quick answer, or ten for the whole story." },
  { n: "02", t: "Share your question", p: "Pick a day and time, and tell me what is on your mind. A single line is enough." },
  { n: "03", t: "Receive your answer", p: "A personal, written reading arrives within 24 hours. It is honest, kind and clear." },
];

function Step({ i, p, s }: { i: number; p: MotionValue<number>; s: (typeof STEPS)[number] }) {
  const a = i / 3, b = (i + 1) / 3;
  const o = useTransform(p, [a - .06, a + .05, b - .06, b], [0, 1, 1, i === 2 ? 1 : 0]);
  const y = useTransform(p, [a - .06, a + .05, b - .06, b], [40, 0, 0, i === 2 ? 0 : -40]);
  return <motion.div className="step" style={{ opacity: o, y }}><div className="sn">{s.n}</div><h3>{s.t}</h3><p>{s.p}</p></motion.div>;
}
function SCard({ i, p }: { i: number; p: MotionValue<number> }) {
  const sp = useSpring(p, { stiffness: 90, damping: 22 });
  const x = useTransform(sp, [0, .5, 1], [(i - 1) * 8, (i - 1) * 90, (i - 1) * 120]);
  const r = useTransform(sp, [0, .5, 1], [(i - 1) * 4, (i - 1) * 14, (i - 1) * 18]);
  const y = useTransform(sp, [0, 1], [0, i === 1 ? -26 : 16]);
  return <motion.div className="scard" style={{ x, rotate: r, y, zIndex: i === 1 ? 3 : 1 }}><div className="tc" style={{ width: "100%", height: "100%" }}><Back /></div></motion.div>;
}

export default function Story() {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress: p } = useScroll({ target: ref, offset: ["start start", "end end"] });
  const bar = useTransform(p, [0, 1], [0, 1]);
  return (
    <div className="story" id="process" ref={ref}>
      <div className="story-in">
        <div>
          <p className="kicker">How it works</p>
          <Heading text="Three quiet steps" />
          <div className="steps">{STEPS.map((s, i) => <Step key={i} i={i} p={p} s={s} />)}</div>
          <div className="prog"><motion.i style={{ scaleX: bar }} /></div>
        </div>
        <div className="stage">{[0, 1, 2].map((i) => <SCard key={i} i={i} p={p} />)}</div>
      </div>
    </div>
  );
}
