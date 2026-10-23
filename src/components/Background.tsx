import { useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

/** Crimson Velvet background: drifting wine blobs (parallax on scroll) + glowing embers that rise and bend away from the mouse. */
export default function Background() {
  const ref = useRef<HTMLCanvasElement>(null);
  const { scrollYProgress } = useScroll();
  const y1 = useTransform(scrollYProgress, [0, 1], ["0%", "45%"]);
  const y2 = useTransform(scrollYProgress, [0, 1], ["0%", "-40%"]);

  useEffect(() => {
    const c = ref.current!; const ctx = c.getContext("2d")!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0, h = 0, raf = 0; const mouse = { x: -999, y: -999 };
    type E = { x: number; y: number; vx: number; vy: number; r: number; t: number; hue: number };
    let es: E[] = [];
    const make = (anywhere: boolean): E => ({
      x: Math.random() * w, y: anywhere ? Math.random() * h : h + 10, vx: (Math.random() - .5) * .3, vy: -(Math.random() * .5 + .12),
      r: Math.random() * 2.4 + .6, t: Math.random() * 6, hue: [350, 18, 30][Math.floor(Math.random() * 3)],
    });
    const init = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = innerWidth; h = innerHeight; c.width = w * dpr; c.height = h * dpr; c.style.width = w + "px"; c.style.height = h + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      es = Array.from({ length: Math.min(90, Math.floor((w * h) / 16000)) }, () => make(true));
    };
    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of es) {
        p.t += .03; p.x += p.vx + Math.sin(p.t) * .25; p.y += p.vy;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < 150) { p.x += (dx / d) * (150 - d) * .04; p.y += (dy / d) * (150 - d) * .04; }
        if (p.y < -12 || p.x < -12 || p.x > w + 12) Object.assign(p, make(false));
        const a = .25 + (Math.sin(p.t * 1.6) + 1) * .28;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 6);
        g.addColorStop(0, `hsla(${p.hue},95%,68%,${a})`); g.addColorStop(1, `hsla(${p.hue},95%,60%,0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 6, 0, 6.283); ctx.fill();
      }
      if (!reduce) raf = requestAnimationFrame(draw);
    };
    const mv = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    init(); draw(); addEventListener("resize", init); addEventListener("mousemove", mv);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", init); removeEventListener("mousemove", mv); };
  }, []);

  return (
    <div className="bgwrap" aria-hidden>
      <motion.i className="blob b1" style={{ y: y1 }} />
      <motion.i className="blob b2" style={{ y: y2 }} />
      <i className="blob b3" />
      <canvas ref={ref} />
      <div className="grain" />
    </div>
  );
}
