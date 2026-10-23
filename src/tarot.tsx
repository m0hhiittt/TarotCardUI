import type { ReactElement } from "react";

const ink = "#F6E9E4", gold = "#E8B890", rose = "#FF5C7A", amber = "#FFB86B";
const sw = { stroke: gold, strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export interface TarotCard { name: string; num: string; text: string; art: ReactElement }

export const TAROT: TarotCard[] = [
  { name: "The Sun", num: "XIX", text: "Clarity and good news. Move ahead with confidence.", art: (
    <svg viewBox="0 0 100 100"><g {...sw}>{Array.from({ length: 12 }).map((_, i) => <path key={i} d="M50 8v12" transform={`rotate(${i * 30} 50 50)`} />)}</g><circle cx="50" cy="50" r="22" fill={amber} fillOpacity=".25" {...sw} /><circle cx="50" cy="50" r="9" fill={rose} {...sw} /></svg>) },
  { name: "The Moon", num: "XVIII", text: "Not everything is visible yet. Trust your instinct.", art: (
    <svg viewBox="0 0 100 100"><path d="M62 12A38 38 0 1 0 62 88A24 38 0 1 1 62 12z" fill={gold} fillOpacity=".25" {...sw} /><circle cx="78" cy="30" r="3.5" fill={rose} {...sw} /><circle cx="84" cy="52" r="2.4" fill={amber} {...sw} /><path d="M12 92h76" {...sw} /></svg>) },
  { name: "The Star", num: "XVII", text: "Hope returns. Healing is already under way.", art: (
    <svg viewBox="0 0 100 100"><path d="M50 8l10 30 30 10-30 10-10 32-10-32-30-10 30-10z" fill={rose} fillOpacity=".35" {...sw} /><circle cx="18" cy="20" r="3" fill={gold} {...sw} /><circle cx="84" cy="82" r="3" fill={amber} {...sw} /><circle cx="86" cy="18" r="2" fill={ink} /></svg>) },
  { name: "The Wheel", num: "X", text: "Fortune turns. A pivotal change is beginning.", art: (
    <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="38" fill="none" {...sw} /><circle cx="50" cy="50" r="14" fill={rose} fillOpacity=".35" {...sw} /><g {...sw}>{Array.from({ length: 8 }).map((_, i) => <path key={i} d="M50 12v24" transform={`rotate(${i * 45} 50 50)`} />)}</g><circle cx="50" cy="50" r="4" fill={gold} /></svg>) },
  { name: "The Lovers", num: "VI", text: "A meaningful choice, made from the heart.", art: (
    <svg viewBox="0 0 100 100"><circle cx="38" cy="50" r="26" fill={rose} fillOpacity=".3" {...sw} /><circle cx="62" cy="50" r="26" fill={gold} fillOpacity=".25" {...sw} /><path d="M50 36c6 5 6 23 0 28-6-5-6-23 0-28z" fill={ink} /></svg>) },
  { name: "The Hermit", num: "IX", text: "Step back. Your own light shows the path.", art: (
    <svg viewBox="0 0 100 100"><path d="M6 88L38 38l16 24 12-16 28 42z" fill={rose} fillOpacity=".3" {...sw} /><path d="M50 8l4 10 10 4-10 4-4 10-4-10-10-4 10-4z" fill={amber} fillOpacity=".5" {...sw} /></svg>) },
  { name: "Strength", num: "VIII", text: "Quiet courage will gently overcome the challenge.", art: (
    <svg viewBox="0 0 100 100"><path d="M50 50C38 30 12 34 12 50s26 20 38 0 38-30 38-10-26 20-38 0z" fill="none" {...sw} strokeWidth="3.5" /><circle cx="50" cy="50" r="6" fill={rose} {...sw} /><circle cx="50" cy="16" r="6" fill="none" {...sw} /></svg>) },
  { name: "The Empress", num: "III", text: "Abundance grows where you nurture it.", art: (
    <svg viewBox="0 0 100 100">{[-60, -30, 0, 30, 60].map((r, i) => <ellipse key={i} cx="50" cy="38" rx="9" ry="26" transform={`rotate(${r} 50 76)`} fill={i % 2 ? rose : gold} fillOpacity=".3" {...sw} />)}<path d="M20 90h60" {...sw} /></svg>) },
];
