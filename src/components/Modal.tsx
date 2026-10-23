import { useEffect, type ReactNode } from "react";
import { motion } from "framer-motion";

export default function Modal({ children, onClose, wide = false, label }: { children: ReactNode; onClose: () => void; wide?: boolean; label: string }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    addEventListener("keydown", k);
    const prev = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { removeEventListener("keydown", k); document.body.style.overflow = prev; };
  }, [onClose]);
  return (
    <motion.div className="overlay" role="dialog" aria-modal="true" aria-label={label} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <motion.div className={`modal ${wide ? "wide" : ""}`} initial={{ y: 40, scale: .94, opacity: 0 }} animate={{ y: 0, scale: 1, opacity: 1 }} exit={{ y: 30, scale: .96, opacity: 0 }} transition={{ type: "spring", damping: 24, stiffness: 260 }}>
        <button className="x" onClick={onClose} aria-label="Close">×</button>
        {children}
      </motion.div>
    </motion.div>
  );
}

/** Small "are you sure?" dialog used before deleting / cancelling. */
export function Confirm({ title, text, action, onYes, onNo }: { title: string; text: string; action: string; onYes: () => void; onNo: () => void }) {
  useEffect(() => { const k = (e: KeyboardEvent) => e.key === "Escape" && onNo(); addEventListener("keydown", k); return () => removeEventListener("keydown", k); }, [onNo]);
  return (
    <div className="confirm" onMouseDown={(e) => e.target === e.currentTarget && onNo()}>
      <div className="modal">
        <div className="mtitle">{title}</div>
        <p className="sub" style={{ margin: "0 0 22px" }}>{text}</p>
        <div className="mbtns"><button className="btn line grow" onClick={onNo}>Keep it</button><button className="btn danger grow" onClick={onYes}>{action}</button></div>
      </div>
    </div>
  );
}
