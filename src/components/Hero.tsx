import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Back, Face } from "./CardArt";
import { TAROT } from "../tarot";
import { useApp } from "../ctx";
import { CountUp, Heading, Magnetic } from "./Motion";

export default function Hero() {
  const { openBooking, user } = useApp();
  const [flip, setFlip] = useState(false);
  const [i, setI] = useState(0);
  const tilt = useRef<HTMLDivElement>(null), glare = useRef<HTMLDivElement>(null);
  const card = TAROT[i];

  const draw = () => {
    if (flip) { setFlip(false); return; }
    setI((p) => { let n = Math.floor(Math.random() * TAROT.length); if (n === p) n = (n + 1) % TAROT.length; return n; });
    setFlip(true);
  };
  const mv = (e: React.MouseEvent) => {
    const r = tilt.current!.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
    tilt.current!.style.transform = `rotateY(${x * 18}deg) rotateX(${-y * 18}deg)`;
    glare.current!.style.background = `radial-gradient(circle at ${(x + .5) * 100}% ${(y + .5) * 100}%,rgba(255,200,170,.55),transparent 55%)`;
  };
  const lv = () => { tilt.current!.style.transform = ""; glare.current!.style.background = "none"; };

  return (
    <section className="hero" id="hero">
      <div className="hero-stage">
        <svg className="orbit" viewBox="0 0 400 400"><circle cx="200" cy="200" r="198" /><circle cx="200" cy="200" r="150" strokeDasharray="2 7" />
          <g className="spin"><circle cx="200" cy="2" r="4" /></g><g className="spin rev"><circle cx="200" cy="50" r="3" /></g></svg>
        <motion.div initial={{ opacity: 0, y: 120, rotate: -8 }} animate={{ opacity: 1, y: 0, rotate: 0 }} transition={{ duration: 1.2, delay: .4, ease: [.2, .8, .2, 1] }}>
          <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}>
            <div className="tilt" ref={tilt} onMouseMove={mv} onMouseLeave={lv} onClick={draw} data-cursor={flip ? "Again" : "Draw"} role="button" tabIndex={0}
              onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && draw()} aria-label="Draw a tarot card">
              <div className={`tc ${flip ? "flip" : ""}`}><Back /><Face card={card} /></div>
              <div className="glare" ref={glare} />
            </div>
          </motion.div>
        </motion.div>
        <p className="reading">{flip ? <><b>{card.name}.</b> {card.text}</> : "Tap the card to draw yours."}</p>
      </div>

      <div>
        <motion.p className="kicker" initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .1 }}>Tarot readings by Sambhavi Shiva</motion.p>
        <Heading as="h1" text="Ask one question. Pull one card." instant />
        <motion.p className="lede" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: .9 }}>
          Honest, intuitive guidance for love, work and the decisions in between. Your answer arrives within 24 hours, and a single card starts at ₹50.
        </motion.p>
        <motion.div className="row" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.1 }}>
          <Magnetic><button className="btn solid lg" style={{ padding: "16px 30px" }} onClick={() => openBooking()}>{user ? "Book a reading" : "Log in to book"}</button></Magnetic>
          <Magnetic><button className="btn line lg" style={{ padding: "16px 30px" }} onClick={() => document.getElementById("readings")?.scrollIntoView({ behavior: "smooth" })}>See prices</button></Magnetic>
        </motion.div>
        <motion.div className="stats" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}>
          <div><b><CountUp to={2000} suffix="+" /></b><span>readings given</span></div>
          <div><b><CountUp to={4.9} decimals={1} /></b><span>average rating</span></div>
          <div><b><CountUp to={24} suffix="h" /></b><span>to your answer</span></div>
        </motion.div>
      </div>
    </section>
  );
}
