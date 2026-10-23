import { Heading, Magnetic } from "./Motion";
import { useApp } from "../ctx";

export default function CTA() {
  const { openBooking, user, isAdmin } = useApp();
  return (
    <section className="cta-big">
      <Heading as="h2" className="xl" text="Your question deserves an answer" />
      <p className="sub">Take a quiet minute, choose a reading and let the cards speak.</p>
      {!isAdmin && <Magnetic><button className="btn solid lg" onClick={() => openBooking()}>{user ? "Book a reading" : "Log in to book"}</button></Magnetic>}
    </section>
  );
}
