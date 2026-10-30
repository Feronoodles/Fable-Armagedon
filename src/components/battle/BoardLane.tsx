import type { GameCard } from "@/game-engine/types";
import type { EffectLog } from "@/game-engine/abilities";
import { describeEffect } from "@/game-engine/effect-presentation";
import { getEffectCue } from "@/game-engine/effect-animation";
import { FieldCard } from "./FieldCard";
import { AnimatedStatNumber } from "./AnimatedStatNumber";
import { EffectAura } from "./EffectAura";

export function BoardLane({ position, card, onClick, isOpponent = false, isCombatPosition = false,
  isCombatAnimation = false, isDestroying = false, isClashing = false, displayAttack, displayDefense, effect, events = [], language = "es", paused = false }: {
  position: number; card?: GameCard; onClick?: () => void; isOpponent?: boolean;
  isCombatPosition?: boolean; isCombatAnimation?: boolean; isDestroying?: boolean; isClashing?: boolean;
  displayAttack?: number; displayDefense?: number; effect?: EffectLog; events?: EffectLog[]; language?: string; paused?: boolean;
}) {
  const targeted = events.filter(entry => card ? entry.targetInstanceId === card.instanceId :
    entry.targetPosition === position && entry.targetController === (isOpponent ? "CPU" : "PLAYER"));
  const sourceEvent = events.find(entry => card && getEffectCue(entry).sourceInstanceId === card.instanceId);
  const statChanges = targeted.filter(entry => entry.stat && entry.before !== entry.after);
  effect = targeted.at(-1) ?? events.find(entry => card && (entry.originInstanceId ?? entry.sourceInstanceId) === card.instanceId) ?? effect;
  const info = effect ? describeEffect(effect, language) : undefined;
  const isSource = Boolean(sourceEvent || (card && info?.sourceInstanceId === card.instanceId));
  const isTarget = Boolean(effect && (card ? effect.targetInstanceId === card.instanceId :
    effect.targetPosition === position && effect.targetController === (isOpponent ? "CPU" : "PLAYER")));
  const badge = info?.tone === "damage" && effect?.amount !== undefined ? "−" + effect.amount :
    info?.tone === "heal" && effect?.amount !== undefined ? "+" + effect.amount :
      info?.tone === "protection" ? "0" : info?.tone === "buff" && effect?.amount !== undefined ? "+" + effect.amount :
        info?.tone === "destroy" ? "×" : language === "en" ? "Effect" : "Efecto";
  return <div className={"battle-lane " + (isSource ? "is-effect-source " : "") + (isTarget ? "is-effect-target " : "") + (isCombatPosition ? "is-combat-lane" : "")} data-tone={info?.tone}>
    <div className="battle-lane-card">
      {card ? <FieldCard card={card} onClick={onClick} isOpponent={isOpponent}
        isCombatPosition={isCombatPosition} isCombatAnimation={isCombatAnimation}
        isDestroying={isDestroying} isClashing={isClashing} displayAttack={displayAttack} displayDefense={displayDefense}
        attackChange={targeted.findLast(entry => entry.stat === "ATTACK" && entry.before !== entry.after)}
        defenseChange={targeted.findLast(entry => entry.stat === "DEFENSE" && entry.before !== entry.after)} paused={paused} /> :
        <div className="battle-field-slot" aria-label={(language === "en" ? "Empty slot " : "Posición vacía ") + position}><span aria-hidden="true">◇</span></div>}
      {sourceEvent && <EffectAura key={sourceEvent.id + "-source"} event={sourceEvent} source language={language} />}
      {targeted.length > 0 && <EffectAura key={targeted.at(-1)!.id + "-target"} event={targeted.at(-1)!} language={language} />}
      {(isSource || isTarget) && <span key={effect?.id} className="battle-lane-effect" title={effect?.message}>{sourceEvent ? getEffectCue(sourceEvent, language).activation : isTarget ? badge : language === "en" ? "Source" : "Activa"}</span>}
      {statChanges.length > 0 && <div key={statChanges.map(entry => entry.id).join("-")} className="battle-stat-callout" data-many={statChanges.length > 1}>
        {statChanges.map(entry => {
          const delta = entry.after! - entry.before!, info = describeEffect(entry, language);
          const label = entry.stat === "ATTACK" ? (language === "en" ? "ATK" : "ATQ") : "DEF";
          return <div key={entry.id} data-tone={info.tone}>
            <strong className="battle-stat-caption">{label} {delta > 0 ? "+" : "−"}{Math.abs(delta)}</strong>
            <AnimatedStatNumber value={entry.after!} change={entry} paused={paused} label={label} className="battle-callout-number" />
            <span className="battle-stat-history">{entry.before} → {entry.after}</span>
          </div>;
        })}
      </div>}
    </div>
    <span className="battle-lane-number" aria-label={(language === "en" ? "Slot " : "Posición ") + position}>{position}</span>
  </div>;
}
