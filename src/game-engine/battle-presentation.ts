import type { EffectLog } from "./abilities";
import type { GameCard, Player, Turn } from "./types";
import type { EffectState } from "./rules";
import { createEffectLog, getEffectiveCardStats, isCreature } from "./rules";

export interface BattlePresentation {
  id: string;
  events: EffectLog[];
  player: Player;
  cpu: Player;
  durationMs: number;
  stage: "ACTIVATION" | "CHANGE" | "DESTRUCTION";
}

/** Also catches continuous auras and expiring bonuses, which do not run an ability. */
export const describeStatChanges = (before: EffectState, after: EffectState, logs: EffectLog[]): EffectLog[] => {
  const changes: EffectLog[] = [], origin = logs.find(log => log.abilityName) ?? logs[0];
  const add = (owner: Turn, source: GameCard | { name: string }, stat: EffectLog["stat"], from: number, to: number, restored = false) => {
    const id = "instanceId" in source ? source.instanceId : undefined;
    const existing = logs.filter(log => log.stat === stat && log.targetController === owner && log.targetInstanceId === id && log.outcome !== "PREVENTED");
    const previous = existing.at(-1)?.after ?? from;
    if (previous === to) return;
    const label = stat === "ATTACK" ? "ATQ" : stat === "DEFENSE" ? "DEF restante" : "Vida";
    changes.push(createEffectLog(origin?.controller ?? owner, { name: origin?.source ?? source.name }, restored ? "DEFENSE_RESTORED" : "STAT_CHANGE", source.name + ": " + label + " " + previous + " → " + to + ".", {
      originName: origin?.originName ?? origin?.source,
      originInstanceId: origin?.originInstanceId ?? origin?.sourceInstanceId,
      abilityName: origin?.abilityName, trigger: origin?.trigger,
      targetInstanceId: id, targetName: source.name, targetController: owner,
      targetPosition: "position" in source ? source.position : undefined,
      stat, before: previous, after: to, amount: Math.abs(to - previous),
    }));
  };
  for (const owner of ["PLAYER", "CPU"] as Turn[]) {
    const oldPlayer = owner === "PLAYER" ? before.player : before.cpu;
    const nextPlayer = owner === "PLAYER" ? after.player : after.cpu;
    add(owner, { name: nextPlayer.name }, "LIFE", oldPlayer.life, nextPlayer.life);
    for (const card of nextPlayer.field.filter(isCreature)) {
      const old = oldPlayer.field.find(c => c.instanceId === card.instanceId);
      const previous = old ? getEffectiveCardStats(old, oldPlayer) : { attack: card.attack ?? 0, remainingDefense: card.defense ?? 0 };
      const next = getEffectiveCardStats(card, nextPlayer);
      add(owner, card, "ATTACK", previous.attack, next.attack);
      add(owner, card, "DEFENSE", previous.remainingDefense, next.remainingDefense, (old?.damageMarked ?? 0) > (card.damageMarked ?? 0));
    }
  }
  return changes;
};

export const createBattlePresentations = (before: EffectState, after: EffectState, logs: EffectLog[]): BattlePresentation[] => {
  const changes = logs.filter(log => (log.stat && log.before !== log.after) || log.outcome === "PREVENTED");
  const deaths = logs.filter(log => (log.effect === "DESTROY" || log.effect === "SACRIFICE") && log.targetInstanceId);
  if (!changes.length && !deaths.length) {
    const activations = logs.filter(log => log.outcome !== "SKIPPED" && (log.abilityName || log.effect === "CAST" || log.effect === "SUMMON"));
    return activations.length ? [{ ...after, id: activations[0].id + "-activate", events: activations, stage: "ACTIVATION", durationMs: 1400 }] : [];
  }
  // Keep lethal targets on their own slot long enough to read the damage before they disappear.
  const retainTargets = (oldPlayer: Player, nextPlayer: Player): Player => {
    const departed = oldPlayer.field.filter(card => deaths.some(log => log.targetInstanceId === card.instanceId) &&
      !nextPlayer.field.some(c => c.instanceId === card.instanceId || (isCreature(c) && isCreature(card) && c.position === card.position)));
    return { ...nextPlayer, field: [...nextPlayer.field, ...departed.map(card => nextPlayer.graveyard.find(c => c.instanceId === card.instanceId) ?? card)] };
  };
  const visible = { player: retainTargets(before.player, after.player), cpu: retainTargets(before.cpu, after.cpu) };
  const frames: BattlePresentation[] = [];
  if (changes.length) frames.push({ ...visible, id: changes[0].id + "-change", events: changes, stage: "CHANGE", durationMs: changes.length > 3 ? 3000 : 2400 });
  if (deaths.length) frames.push({ ...visible, id: deaths[0].id + "-destroy", events: deaths, stage: "DESTRUCTION", durationMs: 1600 });
  return frames;
};

export const getPresentedStat = (frame: BattlePresentation | undefined, id: string, stat: "ATTACK" | "DEFENSE", fallback?: number) =>
  frame?.events.findLast(log => log.targetInstanceId === id && log.stat === stat)?.after ?? fallback;
