import { CardArt } from "@/components/cards/CardArt";
import { useI18n } from "@/components/I18nProvider";
import type { GameCard } from "@/game-engine/types";
import { getManaOptions } from "@/game-engine/mana";
import { ELEMENT_APPEARANCE, getCardAppearance } from "@/lib/card-appearance";
import { elementIcons } from "./constants";

export function ManaCard({ card, onClick, isTapped = Boolean(card.isTapped) }: { card: GameCard; onClick: () => void; isTapped?: boolean }) {
  const { translateCardName, language } = useI18n();
  const appearance = getCardAppearance(card);
  const locale = language === "en" ? "en" : "es";
  const options = getManaOptions(card);
  const grades = options.filter(type => type === "LEGENDARIO" || type === "CELESTIAL");
  const alternatives = options.map(type => ELEMENT_APPEARANCE[type]?.[locale] ?? type).join(locale === "en" ? " or " : " o ");
  const state = isTapped ? (locale === "en" ? "Spent" : "Agotado") : (locale === "en" ? "Available" : "Disponible");
  const label = translateCardName(card.name) + " · " + alternatives + " · " + state;

  return (
    <button
      type="button"
      onClick={onClick}
      title={label + (locale === "en" ? ". One source = one mana. Click for details." : ". Una fuente = un maná. Pulsa para ver detalles.")}
      aria-label={label + (locale === "en" ? ". View details" : ". Ver detalles")}
      data-mana-grade={grades.join(" ") || "BASIC"}
      data-spent={isTapped}
      style={appearance.style}
      className="battle-mana-card themed-mana-card relative flex h-16 w-12 cursor-pointer flex-col items-center justify-center rounded border-2 bg-gray-800 shadow-lg transition-all duration-200"
    >
      <div className="mana-source-art absolute inset-0 overflow-hidden rounded"><CardArt card={card} /><div className="absolute inset-0 bg-slate-950/50" /></div>
      <span className="mana-source-element relative text-lg" aria-hidden="true">{elementIcons[card.attribute] || "✨"}</span>
      <p className="relative mt-1 line-clamp-1 px-0.5 text-center text-[6px] text-white">{translateCardName(card.name)}</p>
      {grades.length > 0 && <span className="mana-grade-marks" aria-hidden="true">{grades.map(grade => <span className="mana-grade-badge" key={grade} data-mana-grade={grade}>{grade === "LEGENDARIO" ? "L" : "C"}</span>)}</span>}
      {isTapped && <span className="mana-spent-mark" aria-hidden="true">×</span>}
    </button>
  );
}
