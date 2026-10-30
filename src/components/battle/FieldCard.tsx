import { CardArt } from "@/components/cards/CardArt";
import { useI18n } from "@/components/I18nProvider";
import { GameCard } from "@/stores/gameStore";
import { elementIcons } from "./constants";
import type { EffectLog } from "@/game-engine/abilities";
import { AnimatedStatNumber } from "./AnimatedStatNumber";
import type { CSSProperties } from "react";

// Adjacent triangles cover the complete card, so every shard keeps its own piece of the art and frame.
const fractureEdge = [[0, 0], [32, 0], [68, 0], [100, 0], [100, 34], [100, 69],
  [100, 100], [66, 100], [31, 100], [0, 100], [0, 66], [0, 32]];

export function FieldCard({
  card,
  onClick,
  isSelected = false,
  canAttack = false,
  isAttacking = false,
  isBlocked = false,
  isCombatPosition = false,
  isCombatAnimation = false,
  isDestroying = false,
  isClashing = false,
  presentationClone = false,
  displayAttack,
  displayDefense,
  attackChanged = false,
  defenseChanged = false,
  attackChange,
  defenseChange,
  paused = false,
}: {
  card: GameCard;
  isOpponent?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
  isSelected?: boolean;
  canAttack?: boolean;
  isAttacking?: boolean;
  isBlocked?: boolean;
  isCombatPosition?: boolean;
  isCombatAnimation?: boolean;
  isDestroying?: boolean;
  isClashing?: boolean;
  presentationClone?: boolean;
  displayAttack?: number;
  displayDefense?: number;
  attackChanged?: boolean;
  defenseChanged?: boolean;
  attackChange?: EffectLog;
  defenseChange?: EffectLog;
  paused?: boolean;
}) {
  const { translateCardName, language } = useI18n();

  const renderFace = (fragment = false) => <div className="battle-card-face absolute inset-0 rounded-[inherit]">
    <div className="absolute inset-0 overflow-hidden rounded-[inherit]"><CardArt card={card} eager={presentationClone || isDestroying} /><div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/20" /></div>
    {canAttack && !card.hasAttacked && <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-green-500 animate-pulse" />}
    {isAttacking && <div className="absolute -left-1 -top-1 h-3 w-3 rounded-full bg-red-500" />}
    {card.abilities && card.abilities.length > 0 && (
      <div className="absolute left-0.5 top-0.5 z-10 flex h-3 w-3 items-center justify-center rounded-full bg-yellow-300 text-[8px] font-black text-gray-950">i</div>
    )}
    <div className="absolute right-0 top-0 rounded-bl bg-gray-900 px-1 text-[8px] text-white">{card.cost}</div>
    <div className="absolute left-0 top-0 p-0.5 text-[10px]">{elementIcons[card.manaTypes[0]] || "✨"}</div>
    <p className="battle-field-name">{translateCardName(card.name)}</p>
    {card.cardType === "CRIATURA" && card.attack !== undefined && card.defense !== undefined && (
      <div className="battle-field-stats absolute bottom-0.5 left-0.5 right-0.5 flex justify-between">
        <span className={"rounded bg-gray-900 px-1 text-[8px] font-bold text-red-400 " + (!fragment && (attackChanged || attackChange) ? "battle-stat-changed" : "")}><AnimatedStatNumber value={displayAttack ?? card.attack} change={fragment ? undefined : attackChange} paused={paused} label={language === "en" ? "ATK" : "ATQ"} /></span>
        <span className={"rounded bg-gray-900 px-1 text-[8px] font-bold text-blue-400 " + (!fragment && (defenseChanged || defenseChange) ? "battle-stat-changed" : "")}><AnimatedStatNumber value={displayDefense ?? card.defense} change={fragment ? undefined : defenseChange} paused={paused} label="DEF" /></span>
      </div>
    )}
  </div>;

  const renderDestructionEffect = () => {
    if (!isDestroying) return null;

    return (
      <div className="battle-destruction-overlay pointer-events-none absolute inset-0 z-20" aria-hidden="true">
        <div className="battle-shatter-flash" />
        <div className="battle-shatter-ring" />
        {fractureEdge.map(([x, y], index) => {
          const [nextX, nextY] = fractureEdge[(index + 1) % fractureEdge.length];
          const dx = (x + nextX + 49) / 3 - 50, dy = (y + nextY + 46) / 3 - 50;
          return <div key={index} className="battle-shatter-fragment" style={{
            clipPath: `polygon(49% 46%, ${x}% ${y}%, ${nextX}% ${nextY}%)`,
            "--fragment-x": `${dx * 3.4}%`, "--fragment-y": `${dy * 3.4}%`,
            "--fragment-fall": `${dy * 3.4 + 55}%`, "--fragment-rotation": `${(index % 2 ? 1 : -1) * (30 + index * 7)}deg`,
          } as CSSProperties}>{renderFace(true)}</div>;
        })}
        <div className="battle-shatter-embers">{Array.from({ length: 10 }, (_, index) => <i key={index} style={{ "--ember-angle": `${index * 36}deg`, "--ember-distance": `${40 + (index % 3) * 18}px` } as CSSProperties} />)}</div>
      </div>
    );
  };

  return (
    <div
      data-battle-card-id={presentationClone ? undefined : card.instanceId}
      data-battle-clone={presentationClone || undefined}
      onClick={(e) => onClick?.(e)}
      title={card.abilities && card.abilities.length > 0 ? "Ver efectos de la carta" : card.name}
      className={`battle-field-card relative h-22 w-16 rounded-lg border-2 shadow-lg transition-all duration-200 ${
        isSelected ? "border-yellow-400 ring-2 ring-yellow-400" : ""
      } ${canAttack ? "cursor-pointer border-green-400 hover:scale-105" : "border-gray-600"} ${
        isAttacking ? "animate-pulse ring-2 ring-red-500" : ""
      } ${isBlocked ? "opacity-50" : ""} ${
        isCombatPosition && isCombatAnimation ? "border-yellow-400 shadow-yellow-500/50 shadow-lg" : ""
      } ${card.abilities && card.abilities.length > 0 ? "battle-card-with-effect" : ""} ${
        isClashing ? "battle-card-in-combat" : ""
      } ${isDestroying ? "battle-card-destroying" : ""}`}
    >
      {renderFace()}
      {renderDestructionEffect()}
    </div>
  );
}
