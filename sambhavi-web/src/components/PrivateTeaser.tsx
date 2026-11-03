import { useApp } from "../ctx";
import { Heading, Reveal } from "./Motion";

/** Home page block that tells visitors about the private room. */
export default function PrivateTeaser() {
  const { user, isAdmin, openAuth, go } = useApp();
  const open = () => { if (!user) openAuth("login", "Log in to open your private room", "room"); else go("room"); };
  return (
    <section className="section" id="private">
      <div className="teaser">
        <div>
          <p className="kicker">Incognito mode</p>
          <Heading text="Prefer to talk it through privately?" />
          <p className="sub">Some questions are too personal for a form. Open your private room and talk with Shambhavi one to one.</p>
          {!isAdmin && <button className="btn solid" style={{ marginTop: 26 }} onClick={open}>{user ? "Open my private room" : "Log in to open it"}</button>}
        </div>
        <Reveal>
          <ul className="teaser-list">
            <li><b>Just the two of you</b><span>Only you and the reader can read this room. It is never shown on the site or to other clients.</span></li>
            <li><b>You stay in control</b><span>Delete the whole conversation whenever you like.</span></li>
            <li><b>Privacy blur</b><span>Hide your messages on a shared screen until you tap them.</span></li>
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
