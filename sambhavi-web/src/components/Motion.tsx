import { useEffect, useRef, type ReactNode } from "react";
import { motion, animate, useInView, useMotionValue, useSpring, type Variants } from "framer-motion";

export function Reveal({ children, delay = 0, y = 44, className = "" }: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div className={className} initial={{ opacity: 0, y, filter: "blur(10px)" }} whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }} transition={{ duration: .9, delay, ease: [.2, .7, .2, 1] }}>{children}</motion.div>
  );
}

const word: Variants = { hidden: { y: "115%", rotate: 4, opacity: 0, filter: "blur(14px)" }, show: (i: number) => ({ y: "0%", rotate: 0, opacity: 1, filter: "blur(0px)", transition: { duration: 1, delay: .08 * i, ease: [.2, .8, .2, 1] } }) };
/** Headline that blurs in word by word and softly glows in crimson. */
export function Heading({ text, as: Tag = "h2", className = "", instant = false }: { text: string; as?: "h1" | "h2"; className?: string; instant?: boolean }) {
  const M = motion[Tag];
  return (
    <M className={`hd ${className}`} aria-label={text} initial="hidden" whileInView="show" animate={instant ? "show" : undefined} viewport={{ once: true, margin: "-60px" }}>
      {text.split(" ").map((w, i) => (
        <span key={i} aria-hidden><span className="mask"><motion.span className="shine" variants={word} custom={i} style={{ animationDelay: `${i * 130}ms` }}>{w}</motion.span></span>{" "}</span>
      ))}
    </M>
  );
}

export function Magnetic({ children, strength = .3 }: { children: ReactNode; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useSpring(useMotionValue(0), { stiffness: 220, damping: 15 }), y = useSpring(useMotionValue(0), { stiffness: 220, damping: 15 });
  return (
    <motion.div ref={ref} style={{ x, y, display: "inline-block" }}
      onMouseMove={(e) => { const r = ref.current!.getBoundingClientRect(); x.set((e.clientX - r.left - r.width / 2) * strength); y.set((e.clientY - r.top - r.height / 2) * strength); }}
      onMouseLeave={() => { x.set(0); y.set(0); }}>{children}</motion.div>
  );
}

export function CountUp({ to, prefix = "", suffix = "", decimals = 0 }: { to: number; prefix?: string; suffix?: string; decimals?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, { duration: 1.6, ease: "easeOut", onUpdate: (v) => { if (ref.current) ref.current.textContent = prefix + v.toLocaleString("en-IN", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }) + suffix; } });
    return () => c.stop();
  }, [inView, to, prefix, suffix, decimals]);
  return <span ref={ref}>{prefix}0{suffix}</span>;
}

/** Spotlight that follows the mouse inside a card (used with the .spot class). */
export const spotMove = (e: React.MouseEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`); e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
};
