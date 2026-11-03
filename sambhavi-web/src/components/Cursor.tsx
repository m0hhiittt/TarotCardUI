import { useEffect, useRef } from "react";
import { useFinePointer } from "../hooks";

/** Ember cursor: glowing dot + trailing ring. Uses pre-made sprites and stops drawing while nothing moves (no idle cost). */
export default function Cursor() {
  const fine = useFinePointer();
  const dot = useRef<HTMLDivElement>(null), ring = useRef<HTMLDivElement>(null), label = useRef<HTMLSpanElement>(null), cv = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!fine) return;
    document.documentElement.classList.add("has-cursor");
    const ctx = cv.current!.getContext("2d")!;
    const size = () => { cv.current!.width = innerWidth; cv.current!.height = innerHeight; };
    size(); addEventListener("resize", size);
    const sprites = [350, 20, 32].map((hue) => {
      const s = document.createElement("canvas"); s.width = s.height = 32; const g = s.getContext("2d")!;
      const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16);
      gr.addColorStop(0, `hsla(${hue},95%,70%,1)`); gr.addColorStop(1, `hsla(${hue},95%,60%,0)`);
      g.fillStyle = gr; g.fillRect(0, 0, 32, 32); return s;
    });
    const m = { x: innerWidth / 2, y: innerHeight / 2 }, r = { ...m }; let last = { ...m };
    type S = { x: number; y: number; vx: number; vy: number; life: number; s: number; c: number };
    const sp: S[] = []; let raf = 0, running = false, drewTrail = false;
    const kick = () => { if (!running) { running = true; raf = requestAnimationFrame(loop); } };

    const move = (e: MouseEvent) => {
      m.x = e.clientX; m.y = e.clientY;
      if (Math.hypot(m.x - last.x, m.y - last.y) > 14 && sp.length < 40) {
        last = { ...m };
        sp.push({ x: m.x, y: m.y, vx: (Math.random() - .5) * .8, vy: -Math.random() * 1.1 - .2, life: 1, s: Math.random() * 8 + 6, c: Math.floor(Math.random() * 3) });
      }
      const t = (e.target as HTMLElement).closest?.("a,button,[data-cursor],input,textarea,select,label,.pk") as HTMLElement | null;
      ring.current!.classList.toggle("hot", !!t);
      ring.current!.classList.toggle("txt", !!t && /^(INPUT|TEXTAREA)$/.test(t.tagName));
      const lb = t?.closest("[data-cursor]")?.getAttribute("data-cursor") || "";
      if (label.current!.textContent !== lb) label.current!.textContent = lb;
      ring.current!.classList.toggle("lbl", !!lb);
      kick();
    };
    const down = () => ring.current!.classList.add("down"), up = () => ring.current!.classList.remove("down");
    const loop = () => {
      r.x += (m.x - r.x) * .2; r.y += (m.y - r.y) * .2;
      dot.current!.style.transform = `translate3d(${m.x}px,${m.y}px,0)`;
      ring.current!.style.transform = `translate3d(${r.x}px,${r.y}px,0)`;
      if (sp.length || drewTrail) { ctx.clearRect(0, 0, cv.current!.width, cv.current!.height); drewTrail = sp.length > 0; }
      for (let i = sp.length - 1; i >= 0; i--) {
        const p = sp[i]; p.life -= .03; p.x += p.vx; p.y += p.vy;
        if (p.life <= 0) { sp.splice(i, 1); continue; }
        ctx.globalAlpha = p.life * .9; ctx.drawImage(sprites[p.c], p.x - p.s, p.y - p.s, p.s * 2, p.s * 2);
      }
      // keep looping only while something is still moving
      if (sp.length || Math.abs(m.x - r.x) > .3 || Math.abs(m.y - r.y) > .3) raf = requestAnimationFrame(loop); else running = false;
    };
    addEventListener("mousemove", move, { passive: true }); addEventListener("mousedown", down); addEventListener("mouseup", up);
    return () => {
      document.documentElement.classList.remove("has-cursor"); cancelAnimationFrame(raf);
      removeEventListener("mousemove", move); removeEventListener("mousedown", down); removeEventListener("mouseup", up); removeEventListener("resize", size);
    };
  }, [fine]);

  if (!fine) return null;
  return (<>
    <canvas ref={cv} className="trail" />
    <div ref={ring} className="cur-ring"><span ref={label} /></div>
    <div ref={dot} className="cur-dot" />
  </>);
}
