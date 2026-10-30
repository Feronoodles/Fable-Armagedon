import type { GameCard } from "@/game-engine/types";
import { getAvailableMana, getManaOptions } from "@/game-engine/mana";
import { ManaCard } from "./ManaCard";
export function ManaZonePanel({ cards, language, onCardClick }: { cards: GameCard[]; isOpponent?: boolean; language: string; onCardClick: (card: GameCard) => void }) {
  const en = language === "en";
  const available = cards.filter(c => !c.isTapped).length;
  const capacities = getAvailableMana(cards);
  const special = (["LEGENDARIO", "CELESTIAL"] as const).map(type => ({
    type, total: cards.filter(card => getManaOptions(card).includes(type)).length, available: capacities[type] ?? 0,
    label: type === "LEGENDARIO" ? (en ? "Legendary" : "Legendario") : "Celestial",
  })).filter(group => group.total > 0);
  return <div className="battle-mana-panel">
    <div className="battle-zone-caption battle-mana-caption" title={en ? "Available / total sources. Each source pays one mana, choosing one of its alternatives." : "Fuentes disponibles / totales. Cada fuente paga un maná, eligiendo una de sus alternativas."}>
      <div className="mana-total-caption"><span>{en ? "Mana" : "Maná"}</span><small>{available}/{cards.length}</small></div>
      {special.length > 0 && <div className="mana-special-summary" title={en ? "These sources are already included in the mana total." : "Estas fuentes ya están incluidas en el total de maná."}>{special.map(group => <span key={group.type} data-mana-grade={group.type} aria-label={group.label + ": " + group.available + (en ? " available of " : " disponibles de ") + group.total}><span>{group.label}</span><b>{group.available}/{group.total}</b></span>)}</div>}
    </div>
    <div className="battle-mana-strip">{cards.map(card => <ManaCard key={card.instanceId} card={card} isTapped={card.isTapped} onClick={() => onCardClick(card)} />)}
      {!cards.length && <span className="text-[9px] text-slate-600">{language === "en" ? "Play one each turn" : "Juega uno por turno"}</span>}
    </div>
  </div>;
}
