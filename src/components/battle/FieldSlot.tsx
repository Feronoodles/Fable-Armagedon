import { GameCard } from "@/stores/gameStore";
import { FieldCard } from "./FieldCard";

export function FieldSlot({
  position,
  card,
  onClick,
  isOpponent = false,
  isCombatPosition = false,
  isCombatAnimation = false,
  isDestroying = false,
  displayAttack,
  displayDefense,
}: {
  position: number;
  card?: GameCard;
  onClick?: () => void;
  isOpponent?: boolean;
  isCombatPosition?: boolean;
  isCombatAnimation?: boolean;
  isDestroying?: boolean;
  displayAttack?: number;
  displayDefense?: number;
}) {
  const renderCombatEffect = () => {
    if (!isCombatPosition || !isCombatAnimation) return null;
    return (
      <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
        <div className="relative flex h-full w-full items-center justify-center">
          <div className="absolute -rotate-45 transform text-2xl animate-swordClash">⚔️</div>
          <div className="absolute rotate-45 transform text-2xl animate-swordClash">⚔️</div>
          <div className="absolute h-16 w-16 rounded-full border-2 border-yellow-400 animate-shockwave" />
        </div>
      </div>
    );
  };

  if (card) {
    return (
      <FieldCard
        card={card}
        isOpponent={isOpponent}
        onClick={onClick}
        isCombatPosition={isCombatPosition}
        isCombatAnimation={isCombatAnimation}
        isDestroying={isDestroying}
        displayAttack={displayAttack}
        displayDefense={displayDefense}
      />
    );
  }

  return (
    <div
      className={`battle-field-slot relative flex h-22 w-16 items-center justify-center rounded-lg border-2 border-dashed border-gray-600 bg-gray-800/30 opacity-30 transition-all duration-200 ${
        isCombatPosition && isCombatAnimation ? "border-yellow-400 bg-yellow-900/20" : ""
      }`}
    >
      <span className="text-xs text-gray-500">{position}</span>
      {renderCombatEffect()}
    </div>
  );
}
