import { useEffect, useRef } from "react";

/** Lightweight Crimson Velvet background: static wine glow (pure CSS, no blur filter) + a small field of embers.
 *  Speed tricks: embers are drawn from pre-made sprites (no gradients per frame), the loop pauses when the tab is hidden,
 *  and it runs at most ~40 fps. */
export default function Background() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = ref.current!; const ctx = c.getContext("2d")!;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const small = innerWidth < 800;
    let w = 0, h = 0, raf = 0, last = 0; const mouse = { x: -999, y: -999 };

    // one pre-rendered glow sprite per colour
    const sprites = [350, 18, 30].map((hue) => {
      const s = document.createElement("canvas"); s.width = s.height = 48; const g = s.getContext("2d")!;
      const grad = g.createRadialGradient(24, 24, 0, 24, 24, 24);
      grad.addColorStop(0, `hsla(${hue},95%,70%,1)`); grad.addColorStop(.35, `hsla(${hue},95%,62%,.45)`); grad.addColorStop(1, `hsla(${hue},95%,60%,0)`);
      g.fillStyle = grad; g.fillRect(0, 0, 48, 48); return s;
    });

    type E = { x: number; y: number; vx: number; vy: number; r: number; t: number; s: number };
    let es: E[] = [];
    const make = (anywhere: boolean): E => ({
      x: Math.random() * w, y: anywhere ? Math.random() * h : h + 10, vx: (Math.random() - .5) * .3, vy: -(Math.random() * .5 + .12),
      r: Math.random() * 7 + 4, t: Math.random() * 6, s: Math.floor(Math.random() * 3),
    });
    const init = () => {
      w = innerWidth; h = innerHeight; c.width = w; c.height = h; // DPR 1 on purpose: soft glows don't need sharp pixels
      es = Array.from({ length: small ? 22 : 42 }, () => make(true));
    };
    const draw = (now: number) => {
      raf = requestAnimationFrame(draw);
      if (document.hidden || now - last < 24) return; last = now;
      ctx.clearRect(0, 0, w, h);
      for (const p of es) {
        p.t += .03; p.x += p.vx + Math.sin(p.t) * .25; p.y += p.vy;
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
        if (d < 150) { p.x += (dx / d) * (150 - d) * .04; p.y += (dy / d) * (150 - d) * .04; }
        if (p.y < -12 || p.x < -12 || p.x > w + 12) Object.assign(p, make(false));
        ctx.globalAlpha = .3 + (Math.sin(p.t * 1.6) + 1) * .3;
        ctx.drawImage(sprites[p.s], p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
      }
    };
    const mv = (e: MouseEvent) => { mouse.x = e.clientX; mouse.y = e.clientY; };
    init();
    if (reduce) { draw(100); cancelAnimationFrame(raf); } else raf = requestAnimationFrame(draw);
    addEventListener("resize", init); addEventListener("mousemove", mv, { passive: true });
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", init); removeEventListener("mousemove", mv); };
  }, []);

  return (
    <div className="bgwrap" aria-hidden>
      <i className="blob b1" /><i className="blob b2" /><i className="blob b3" />
      <canvas ref={ref} />
      <div className="grain" />
    </div>
  );
}
