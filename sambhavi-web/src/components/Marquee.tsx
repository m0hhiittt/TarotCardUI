import { motion, useScroll, useTransform } from "framer-motion";

const WORDS = ["Love", "Career", "Clarity", "Healing", "Fortune", "Intuition", "Purpose", "Change"];
function Row({ fill, dir }: { fill?: boolean; dir: 1 | -1 }) {
  const { scrollY } = useScroll();
  const x = useTransform(scrollY, [0, 4000], dir === 1 ? ["0%", "-30%"] : ["-30%", "0%"]);
  const list = [...WORDS, ...WORDS, ...WORDS];
  return (
    <motion.div className={`mq ${fill ? "fill" : ""}`} style={{ x }}>
      {list.map((w, i) => <span key={i}>{w}<em>✦</em></span>)}
    </motion.div>
  );
}
export default function Marquee() {
  return <div className="marquee" aria-hidden><Row dir={1} /><Row fill dir={-1} /></div>;
}
