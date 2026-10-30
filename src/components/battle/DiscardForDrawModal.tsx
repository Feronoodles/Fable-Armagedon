import { useI18n } from "@/components/I18nProvider";
import { GameCard } from "@/stores/gameStore";
import { elementIcons } from "./constants";

export function DiscardForDrawModal({
  hand,
  onDiscard,
  language,
}: {
  hand: GameCard[];
  onDiscard: (cardId: string) => void;
  language: string;
}) {
  const { translateCardName } = useI18n();

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
      <div className="era-panel w-full max-w-3xl rounded-3xl p-5 sm:p-7">
        <p className="era-kicker mb-2">{language === "en" ? "Hand limit" : "Límite de mano"}</p>
        <h2 className="text-2xl font-black text-white sm:text-3xl">
          {language === "en" ? "Choose a card to discard" : "Elige una carta para descartar"}
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-300">
          {language === "en"
            ? "All cards were drawn. Discard until you have 7 cards to continue resolving effects."
            : "Ya robaste las cartas. Descarta hasta quedarte con 7 para continuar resolviendo los efectos."}
        </p>

        <div className="mt-6 grid max-h-[50vh] grid-cols-3 gap-3 overflow-y-auto sm:grid-cols-4 md:grid-cols-7">
          {hand.map((card) => (
            <button
              key={card.instanceId}
              type="button"
              onClick={() => onDiscard(card.instanceId)}
              className="group relative min-h-32 rounded-xl border border-slate-600/70 bg-slate-950/70 p-2 text-left transition hover:-translate-y-1 hover:border-red-300/70 hover:bg-red-950/30"
            >
              <span className="absolute right-1 top-1 rounded-full bg-slate-800 px-1.5 py-0.5 text-[10px] font-bold text-white">{card.cost}</span>
              <span className="text-sm">{elementIcons[card.manaTypes[0]] || "✦"}</span>
              <span className="mt-3 block line-clamp-3 text-[11px] font-semibold leading-tight text-white">{translateCardName(card.name)}</span>
              {card.cardType === "CRIATURA" && card.attack !== undefined && card.defense !== undefined && (
                <span className="absolute bottom-2 left-2 right-2 flex justify-between text-[10px] font-bold">
                  <span className="text-red-300">{card.attack}</span>
                  <span className="text-blue-300">{card.defense}</span>
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
