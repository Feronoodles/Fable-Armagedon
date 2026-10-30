import type { GameCard } from "@/game-engine/types";
import { CardArt } from "@/components/cards/CardArt";
import type { EffectLog } from "@/game-engine/abilities";
import { getEffectCue } from "@/game-engine/effect-animation";
import { EffectAura } from "./EffectAura";
export function SupportZone({ cards, onCardClick, language, events = [] }: { cards: GameCard[]; isOpponent?: boolean; onCardClick: (card: GameCard) => void; language: string; events?: EffectLog[] }) {
  return <div className="battle-support-zone">
    <div className="battle-zone-caption"><span className="text-amber-200">{language === "en" ? "Fields" : "Campos"}</span><small>{cards.length} {language === "en" ? "active" : "activos"}</small></div>
    <div className="battle-support-strip">{cards.map(card => {
      const activation = events.find(entry => getEffectCue(entry).sourceInstanceId === card.instanceId);
      return <button type="button" key={card.instanceId} data-battle-card-id={card.instanceId} onClick={() => onCardClick(card)}
        title={card.name + (activation?.abilityName ? " · " + activation.abilityName : "")} aria-label={card.name}
        className={"battle-support-card " + (activation ? "is-activating" : "")} data-tone={activation ? getEffectCue(activation).tone : undefined}>
        <CardArt card={card} />{activation && <EffectAura key={activation.id} event={activation} source language={language} />}
      </button>;
    })}
      {!cards.length && <span className="text-[9px] text-slate-600">{language === "en" ? "No field effects" : "Sin cartas de campo"}</span>}
    </div>
  </div>;
}
