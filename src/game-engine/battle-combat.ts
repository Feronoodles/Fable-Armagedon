import type { GameCard, Player, Turn } from "./types";
import {
  applyDamageBatch, canCardBlock, createEffectLog, effectResult, getEffectiveCardStats,
  getPlayer, hasAbility, isCreature, oppositeTurn, setPlayer,
} from "./rules";
import type { DamageEvent, EffectState } from "./rules";

export const determineBattleWinner = (playerLife: number, cpuLife: number): Turn | "DRAW" | null =>
  playerLife <= 0 && cpuLife <= 0 ? "DRAW" : playerLife <= 0 ? "CPU" : cpuLife <= 0 ? "PLAYER" : null;
export const canAttackNow = (card: GameCard, owner: Player) => {
  const stats = getEffectiveCardStats(card, owner);
  return isCreature(card) && stats.canAttack && (card.attacksMade ?? 0) < stats.maxAttacks;
};
export const selectBlockers = (state: EffectState, controller: Turn, attacker: GameCard, blocks: Map<string, number>): GameCard[] => {
  const own = getPlayer(state, controller), enemy = getPlayer(state, oppositeTurn(controller));
  if (attacker.unblockableThisTurn) return [];
  const available = enemy.field.filter(c => isCreature(c) &&
    (blocks.get(c.instanceId) ?? 0) < getEffectiveCardStats(c, enemy).blockCapacity);
  const protectors = available.filter(c => hasAbility(c, "PROTECT_OTHERS"));
  // Astravor redirects attacks to himself. Other blocking restrictions still apply.
  if (protectors.length) return protectors.filter(c => canCardBlock(attacker, c, own, enemy)).slice(0, 1);
  const forced = available.filter(c => attacker.forcedBlockerIds?.includes(c.instanceId) && canCardBlock(attacker, c, own, enemy));
  if (forced.length) return forced.slice(0, 3);
  const lane = available.find(c => c.position === attacker.position && canCardBlock(attacker, c, own, enemy));
  if (lane) return [lane];
  const extra = available.find(c => getEffectiveCardStats(c, enemy).blockCapacity > 1 && canCardBlock(attacker, c, own, enemy));
  return extra ? [extra] : [];
};
export const resolveAttackStep = (initial: EffectState, controller: Turn, attackerId: string, blockerIds: string[]) => {
  const own = getPlayer(initial, controller), enemy = getPlayer(initial, oppositeTurn(controller));
  const attacker = own.field.find(c => c.instanceId === attackerId);
  if (!attacker || !canAttackNow(attacker, own)) return effectResult(initial);
  const stats = getEffectiveCardStats(attacker, own);
  const blockers = enemy.field.filter(c => blockerIds.includes(c.instanceId) && canCardBlock(attacker, c, own, enemy));
  const attacksMade = (attacker.attacksMade ?? 0) + 1;
  const state = setPlayer(initial, controller, { ...own, field: own.field.map(c => c.instanceId === attackerId
    ? { ...c, attacksMade, hasAttacked: attacksMade >= stats.maxAttacks } : c) });
  const events: DamageEvent[] = [];
  if (!blockers.length) {
    events.push({ source: attacker, controller, combat: true, target: { type: "PLAYER", player: oppositeTurn(controller) }, amount: stats.attack });
  } else {
    let damage = stats.attack;
    for (const blocker of blockers) {
      const targetStats = getEffectiveCardStats(blocker, enemy), assigned = Math.min(damage, targetStats.remainingDefense);
      events.push({ source: attacker, controller, combat: true, target: { type: "CARD", instanceId: blocker.instanceId }, amount: assigned });
      events.push({ source: blocker, controller: oppositeTurn(controller), combat: true, target: { type: "CARD", instanceId: attackerId }, amount: targetStats.attack });
      damage -= assigned;
    }
  }
  const resolved = applyDamageBatch(state, events);
  return { ...resolved, logs: [
    createEffectLog(controller, attacker, "ATTACK", attacker.name + (blockers.length ? " combate contra " + blockers.map(c => c.name).join(", ") + "." : " ataca directamente.")),
    ...resolved.logs,
  ] };
};
