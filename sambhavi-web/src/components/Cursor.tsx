import { useEffect, useRef } from "react";
import { useFinePointer } from "../hooks";

/** Ember cursor: glowing dot + trailing ring that grows on buttons/cards and leaves a trail of embers. */
export default function Cursor() {
  const fine = useFinePointer();
  const dot = useRef<HTMLDivElement>(null), ring = useRef<HTMLDivElement>(null), label = useRef<HTMLSpanElement>(null), cv = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!fine) return;
    document.documentElement.classList.add("has-cursor");
    const ctx = cv.current!.getContext("2d")!;
    const size = () => { cv.current!.width = innerWidth; cv.current!.height = innerHeight; };
    size(); addEventListener("resize", size);
    const m = { x: innerWidth / 2, y: innerHeight / 2 }, r = { ...m }; let last = { ...m };
    type S = { x: number; y: number; vx: number; vy: number; life: number; s: number; hue: number };
    const sp: S[] = []; let raf = 0;
    const move = (e: MouseEvent) => {
      m.x = e.clientX; m.y = e.clientY;
      if (Math.hypot(m.x - last.x, m.y - last.y) > 10) {
        last = { ...m };
        sp.push({ x: m.x, y: m.y, vx: (Math.random() - .5) * .8, vy: -Math.random() * 1.1 - .2, life: 1, s: Math.random() * 4 + 2, hue: [350, 20, 32][Math.floor(Math.random() * 3)] });
      }
      const t = (e.target as HTMLElement).closest?.("a,button,[data-cursor],input,textarea,select,label,.pk") as HTMLElement | null;
      ring.current!.classList.toggle("hot", !!t);
      ring.current!.classList.toggle("txt", !!t && /^(INPUT|TEXTAREA)$/.test(t.tagName));
      const lb = t?.closest("[data-cursor]")?.getAttribute("data-cursor") || "";
      label.current!.textContent = lb; ring.current!.classList.toggle("lbl", !!lb);
    };
    const down = () => ring.current!.classList.add("down"), up = () => ring.current!.classList.remove("down");
    const loop = () => {
      r.x += (m.x - r.x) * .16; r.y += (m.y - r.y) * .16;
      dot.current!.style.transform = `translate(${m.x}px,${m.y}px)`;
      ring.current!.style.transform = `translate(${r.x}px,${r.y}px)`;
      ctx.clearRect(0, 0, cv.current!.width, cv.current!.height);
      for (let i = sp.length - 1; i >= 0; i--) {
        const p = sp[i]; p.life -= .022; p.x += p.vx; p.y += p.vy;
        if (p.life <= 0) { sp.splice(i, 1); continue; }
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * 3);
        g.addColorStop(0, `hsla(${p.hue},95%,68%,${p.life * .9})`); g.addColorStop(1, `hsla(${p.hue},95%,60%,0)`);
        ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 3, 0, 6.283); ctx.fill();
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    addEventListener("mousemove", move); addEventListener("mousedown", down); addEventListener("mouseup", up);
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
