import { useI18n } from "@/components/I18nProvider";
import type { GameCard } from "@/game-engine/types";
import { CardArt } from "@/components/cards/CardArt";
import { getCardAppearance } from "@/lib/card-appearance";
import { elementIcons } from "./constants";

export function HandCard({ card, onClick, disabled = false, canAfford = false, isSelected = false, displayCost, isPlayable = true }: {
  card: GameCard; onClick?: (event: React.MouseEvent) => void; disabled?: boolean;
  canAfford?: boolean; isSelected?: boolean; displayCost?: number; isPlayable?: boolean;
}) {
  const { translateCardName, language } = useI18n();
  const appearance = getCardAppearance(card);
  return <button type="button" onClick={disabled ? undefined : onClick} disabled={disabled} title={translateCardName(card.name)}
    style={appearance.style} data-card-type={card.cardType}
    className={"battle-hand-card themed-hand-card " + (isSelected ? "is-selected" : canAfford ? "is-playable" : "") + (!isPlayable ? " is-unavailable" : "")}>
    <div className="absolute inset-0"><CardArt card={card} /><div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/10 to-slate-950/10" /></div>
    <span className="absolute right-1 top-1 rounded-full bg-slate-950/85 px-1.5 py-0.5 text-[9px] font-bold text-white">{elementIcons[card.attribute]} {displayCost ?? card.cost}</span>
    <span className="hand-type-mark" title={appearance.type[language === "en" ? "en" : "es"]}>{appearance.type.icon}</span>
    <span className="battle-hand-name">{translateCardName(card.name)}</span>
    {card.cardType === "CRIATURA" && <span className="absolute bottom-0 left-0 right-0 flex justify-between bg-slate-950/85 px-1.5 py-0.5 text-[9px] font-black"><span className="text-orange-300">{card.attack}</span><span className="text-cyan-200">{card.defense}</span></span>}
  </button>;
}
