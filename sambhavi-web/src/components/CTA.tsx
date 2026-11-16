import { Heading, Magnetic } from "./Motion";
import { useApp } from "../ctx";

export default function CTA() {
  const { openChats, isAdmin } = useApp();
  return (
    <section className="cta-big">
      <Heading as="h2" className="xl" text="Your question deserves a conversation" />
      <p className="sub">Draw a card, share what is on your mind and chat privately with the tarot reader.</p>
      {!isAdmin && <Magnetic><button className="btn solid lg" onClick={openChats}>Start a chat session</button></Magnetic>}
    </section>
  );
}
