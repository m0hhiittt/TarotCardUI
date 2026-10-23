import type { TarotCard } from "../tarot";

export function Back() {
  return (
    <div className="f back"><svg viewBox="0 0 216 350" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <rect x="12" y="12" width="192" height="326" rx="12" /><rect x="20" y="20" width="176" height="310" rx="8" opacity=".5" />
        <circle cx="108" cy="175" r="70" /><circle cx="108" cy="175" r="46" /><circle cx="108" cy="175" r="22" />
        {Array.from({ length: 12 }).map((_, i) => <path key={i} d="M108 105v-34" transform={`rotate(${i * 30} 108 175)`} />)}
        <path d="M108 105l8 18-8 18-8-18zM108 245l8-18-8-18-8 18z" />
      </g><circle cx="108" cy="175" r="5" fill="currentColor" />
    </svg></div>
  );
}
export function Face({ card }: { card: TarotCard }) {
  return (
    <div className="f face"><div className="inner">
      <div className="num">{card.num}</div><div className="art">{card.art}</div><div className="nm">{card.name}</div>
    </div></div>
  );
}
