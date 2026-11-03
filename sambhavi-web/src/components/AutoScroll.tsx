import { useEffect, useRef, useState } from "react";

const SPEEDS = [{ label: "Slow", px: 45 }, { label: "Normal", px: 85 }, { label: "Fast", px: 150 }];

/**
 * Optional guided scroll: the page glides down by itself, like a tour of the site.
 * It never starts on its own. Any touch, wheel, key press or click stops it at once, and it stops at the bottom.
 */
export default function AutoScroll() {
  const [on, setOn] = useState(false);
  const [speed, setSpeed] = useState(1);
  const pos = useRef(0); const spd = useRef(SPEEDS[1].px);
  useEffect(() => { spd.current = SPEEDS[speed].px; }, [speed]);

  useEffect(() => {
    if (!on) return;
    let raf = 0, last = performance.now(); pos.current = scrollY;
    const stop = (e: Event) => { if ((e.target as Element | null)?.closest?.(".autoscroll")) return; setOn(false); };
    const tick = (t: number) => {
      const dt = Math.min(t - last, 60); last = t;
      const max = document.documentElement.scrollHeight - innerHeight;
      if (Math.abs(scrollY - pos.current) > 4) { setOn(false); return; }       // the visitor moved the page themselves (e.g. dragged the scrollbar)
      pos.current = Math.min(pos.current + (spd.current * dt) / 1000, max);
      window.scrollTo({ top: pos.current, behavior: "instant" as ScrollBehavior });
      if (pos.current >= max - 1) { setOn(false); return; }
      raf = requestAnimationFrame(tick);
    };
    const evs: (keyof WindowEventMap)[] = ["wheel", "touchstart", "keydown", "mousedown"];
    evs.forEach((n) => addEventListener(n, stop, { passive: true }));
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); evs.forEach((n) => removeEventListener(n, stop)); };
  }, [on]);

  return (
    <div className="autoscroll" role="group" aria-label="Auto scroll">
      <button className="as-main" onClick={() => setOn((v) => !v)} aria-pressed={on} data-cursor={on ? "Pause" : "Play"}>
        <span aria-hidden>{on ? "❚❚" : "▶"}</span> {on ? "Pause" : "Auto scroll"}
      </button>
      {on && <button className="as-speed" onClick={() => setSpeed((s) => (s + 1) % SPEEDS.length)} aria-label="Change speed">{SPEEDS[speed].label}</button>}
    </div>
  );
}
