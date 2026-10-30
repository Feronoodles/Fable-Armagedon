import { getAbilityDescription } from "@/game-engine/ability-text";
import { getAbilityTiming } from "@/game-engine/effect-presentation";
import { getSubtypeLabel } from "@/game-engine/subtypes";
import { getManaOptions, getManaRequirements } from "@/game-engine/mana";
import { ELEMENT_APPEARANCE } from "@/lib/card-appearance";
import { CardArt } from "@/components/cards/CardArt";
import { useState } from "react";
import { GameCard } from "@/stores/gameStore";
import { cardTypeNames, elementIcons, rarityColors } from "./constants";

export function CardDetailsSidebar({
  detailCard,
  language,
  onClose,
  canActivate = false,
  onActivate,
  displayCost,
  displayAttack,
  displayDefense,
  canPlay = false,
  onPlay,
  playLabel,
  showPlayAction = false,
  playDisabledReason,
}: {
  detailCard: GameCard | null;
  language: string;
  onClose: () => void;
  canActivate?: boolean;
  onActivate?: () => void;
  displayCost?: number;
  displayAttack?: number;
  displayDefense?: number;
  canPlay?: boolean;
  onPlay?: () => void;
  playLabel?: string;
  showPlayAction?: boolean;
  playDisabledReason?: string;
}) {
  const [expanded, setExpanded] = useState(Boolean(detailCard));
  const en = language === "en", locale = en ? "en" : "es";
  const source = detailCard?.cardType === "MANA" || detailCard?.cardType === "TIERRA";
  const cost = displayCost ?? detailCard?.cost ?? 0;
  const requirements = detailCard && cost > 0 ? getManaRequirements(detailCard.manaTypes, detailCard.rarity) : [];
  const specialRequirement = requirements.find(type => type === "LEGENDARIO" || type === "CELESTIAL");

  return (
    <div className="flex w-full flex-shrink-0 items-stretch xl:w-80 2xl:w-96">
      <div className="w-full">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mb-2 flex w-full items-center justify-between rounded-xl border border-white/10 bg-gray-950/70 px-3 py-2 text-left text-xs font-bold text-gray-300 xl:hidden"
        >
          <span>{language === "en" ? "Card details" : "Detalles de carta"}</span>
          <span>{expanded ? "−" : "+"}</span>
        </button>
        <div
          className={`battle-ornate-panel ${expanded ? "block" : "hidden"} w-full rounded-[24px] border border-white/10 bg-gray-950/55 shadow-2xl backdrop-blur-xl xl:block`}
          style={{
            backgroundImage: "linear-gradient(rgba(3, 7, 18, 0.76), rgba(3, 7, 18, 0.91)), url('/assets/battle/panel-frame.png')",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            backgroundSize: "cover",
          }}
        >
        <div className="border-b border-white/10 px-4 py-3">
          <h3 className="text-sm font-bold text-gray-300">{language === "en" ? "Card Details" : "Detalles de Carta"}</h3>
        </div>
        <div className="max-h-[40vh] overflow-auto xl:max-h-[70vh]">
          {detailCard ? (
            <div className="p-4">
              <div className="battle-detail-art mb-3 aspect-[4/3] overflow-hidden rounded-xl"><CardArt card={detailCard} /></div>
              <div className="mb-3 flex justify-between items-start">
                <h4 className={`text-sm font-bold ${rarityColors[detailCard.rarity]?.split(" ")[1] || "text-white"}`}>{detailCard.name}</h4>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400">{language === "en" ? "Type" : "Tipo"}:</span>
                  <span className="text-white">{cardTypeNames[detailCard.cardType]?.[language === "en" ? "en" : "es"] || detailCard.cardType}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-400">{language === "en" ? "Rarity" : "Rareza"}:</span>
                  <span className={rarityColors[detailCard.rarity]?.split(" ")[1] || "text-white"}>{detailCard.rarity}</span>
                </div>

                {detailCard.cardType !== "MANA" && detailCard.cardType !== "TIERRA" && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">{language === "en" ? "Cost" : "Costo"}:</span>
                    <span className="flex items-center gap-1 text-white">
                      {requirements.map((m, i) => (
                        <span key={i} title={ELEMENT_APPEARANCE[m]?.[locale] ?? m}>{elementIcons[m] || "✨"}</span>
                      ))}
                       {displayCost ?? detailCard.cost}
                    </span>
                  </div>
                )}

                {(detailCard.cardType === "MANA" || detailCard.cardType === "TIERRA") && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">{language === "en" ? "Element" : "Elemento"}:</span>
                    <span className="flex items-center gap-1 text-white">
                      {elementIcons[detailCard.attribute] || "✨"}
                      {detailCard.attribute}
                    </span>
                  </div>
                )}

                {detailCard.cardType === "CRIATURA" && detailCard.attack !== undefined && detailCard.defense !== undefined && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">Stats:</span>
                    <span className="text-white">
                       <span className="text-red-400">{displayAttack ?? detailCard.attack}</span> / <span className="text-blue-400">{displayDefense ?? detailCard.defense}</span>
                    </span>
                  </div>
                )}

                {detailCard.subtypes && detailCard.subtypes.length > 0 && (
                  <div className="flex justify-between">
                    <span className="text-gray-400">{language === "en" ? "Subtypes" : "Subtipos"}:</span>
                    <span className="text-right text-[10px] text-white">{detailCard.subtypes.map(subtype => getSubtypeLabel(subtype, language)).join(", ")}</span>
                  </div>
                )}
              </div>

              {source && <div className="battle-mana-source-details">
                <span>{en ? "One source · choose one alternative" : "Una fuente · elige una alternativa"}</span>
                <strong>{getManaOptions(detailCard).map((type, index) => <span key={type}>{index > 0 && <small>{en ? " or " : " o "}</small>}<span style={{ color: ELEMENT_APPEARANCE[type]?.color }}>{elementIcons[type]} {ELEMENT_APPEARANCE[type]?.[locale] ?? type}</span></span>)}</strong>
                <p>{en ? "Pays one mana in total, even if it has several alternatives. Its legendary or celestial identity stays visible when spent." : "Paga un solo maná en total, aunque tenga varias alternativas. Conserva su identificación legendaria o celestial cuando se agota."}</p>
                {!showPlayAction && <b data-spent={Boolean(detailCard.isTapped)}>{detailCard.isTapped ? (en ? "Spent · prepares on the next turn" : "Agotado · se prepara al cambiar de turno") : (en ? "Available" : "Disponible")}</b>}
              </div>}

              {!source && specialRequirement && <div className="battle-special-payment-note" style={{ borderColor: ELEMENT_APPEARANCE[specialRequirement]?.color }}>
                <strong style={{ color: ELEMENT_APPEARANCE[specialRequirement]?.color }}>{en ? "Special mana requirement" : "Requisito de maná especial"}</strong>
                <p>{en ? "The total cost of " : "El costo total de "}{cost}{en ? " includes one " : " incluye un maná "}{ELEMENT_APPEARANCE[specialRequirement]?.[locale]}{en ? " mana. Each symbol is paid with a separate source; the rest can use any available sources." : ". Cada símbolo se paga con una fuente distinta; el resto puede usar cualquier fuente disponible."}</p>
              </div>}

              {detailCard.description && (
                <div className="mt-3 border-t border-gray-700 pt-3">
                  <p className="text-xs italic text-gray-300">{detailCard.description}</p>
                </div>
              )}

              {detailCard.abilities && detailCard.abilities.length > 0 && (
                <div className="mt-3 border-t border-gray-700 pt-3">
                  <p className="mb-2 text-xs text-gray-400">{language === "en" ? "Effects:" : "Efectos:"}</p>
                  {detailCard.abilities.map((ability, idx: number) => (
                    <div key={idx} className="mb-2 rounded bg-gray-700/50 p-2">
                      <p className="text-xs font-medium text-yellow-400">{ability.name}</p>
                      <p className="mt-1 text-[10px] font-semibold text-cyan-200">{getAbilityTiming(ability.trigger, language)}</p>
                      <p className="mt-1 text-xs text-gray-300">{getAbilityDescription(ability, language)}</p>
                    </div>
                  ))}
                </div>
              )}

              {detailCard.flavorText && (
                <div className="mt-3 border-t border-gray-700 pt-3">
                  <p className="text-xs italic text-gray-500">&quot;{detailCard.flavorText}&quot;</p>
                </div>
              )}

              {showPlayAction && onPlay && (
                <div className="mt-4">
                  <button
                    onClick={onPlay}
                    disabled={!canPlay}
                    className={`w-full rounded-lg py-2 text-xs font-bold transition-colors ${
                      canPlay
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-950 hover:from-yellow-400 hover:to-orange-400"
                        : "cursor-not-allowed bg-gray-800 text-gray-500"
                    }`}
                  >
                    {playLabel || (language === "en" ? "Play card" : "Jugar carta")}
                  </button>
                  {!canPlay && playDisabledReason && <p className="mt-2 text-center text-[11px] text-amber-300">{playDisabledReason}</p>}
                </div>
              )}

              {canActivate && onActivate && (
                <button
                  onClick={onActivate}
                  className="mt-4 w-full rounded-lg bg-cyan-500 py-2 text-xs font-bold text-gray-950 hover:bg-cyan-400"
                >
                  {language === "en" ? "Activate ability" : "Activar habilidad"}
                </button>
              )}

              <button onClick={onClose} className="mt-4 w-full rounded-lg bg-gray-700 py-2 text-xs text-white hover:bg-gray-600">
                {language === "en" ? "Close" : "Cerrar"}
              </button>
            </div>
          ) : (
            <div className="p-6 text-center text-sm text-gray-500">
              {language === "en" ? "Select a card to view details" : "Selecciona una carta para ver detalles"}
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
