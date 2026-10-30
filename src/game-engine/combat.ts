import { FIELD_POSITIONS, STARTING_LIFE, type GameCard, type Player, type Turn } from "./types";
import { canAttackNow, determineBattleWinner, resolveAttackStep } from "./battle-combat";
export { canAttackNow, determineBattleWinner, resolveAttackStep, selectBlockers } from "./battle-combat";
export { FIELD_POSITIONS };

export interface CombatSlotState {
  playerField: GameCard[]; cpuField: GameCard[]; playerLife: number; cpuLife: number;
  playerGraveyard: GameCard[]; cpuGraveyard: GameCard[];
}
export interface CombatSlotResolution extends CombatSlotState {
  cardsToDestroy: string[]; destroyedInstanceIds: string[];
}
export const findCombatCard = (field: GameCard[], position: number, destroyed: string[], owner?: Player) =>
  field.find(c => c.position === position && c.cardType === "CRIATURA" && !destroyed.includes(c.instanceId) &&
    (owner ? canAttackNow(c, owner) : !c.hasAttacked));
/** Compatibility entry point; all damage and triggers use the shared battle resolver. */
export const resolveCombatAtPosition = (state: CombatSlotState, playerCreature?: GameCard, cpuCreature?: GameCard): CombatSlotResolution => {
  const make = (id: string, field: GameCard[], life: number, graveyard: GameCard[]): Player =>
    ({ id, name: id, field, life, graveyard, maxLife: STARTING_LIFE, hand: [], deck: [], manaZone: [] });
  const initial = {
    player: make("player", state.playerField, state.playerLife, state.playerGraveyard),
    cpu: make("cpu", state.cpuField, state.cpuLife, state.cpuGraveyard),
  };
  const controller: Turn = playerCreature ? "PLAYER" : "CPU";
  const attacker = playerCreature ?? cpuCreature, blocker = playerCreature ? cpuCreature : undefined;
  const resolved = attacker ? resolveAttackStep(initial, controller, attacker.instanceId, blocker ? [blocker.instanceId] : []) : initial;
  const survivors = new Set([...resolved.player.field, ...resolved.cpu.field].map(c => c.instanceId));
  const destroyed = [...state.playerField, ...state.cpuField].filter(c => !survivors.has(c.instanceId)).map(c => c.instanceId);
  return {
    playerField: resolved.player.field, cpuField: resolved.cpu.field, playerLife: resolved.player.life, cpuLife: resolved.cpu.life,
    playerGraveyard: resolved.player.graveyard, cpuGraveyard: resolved.cpu.graveyard,
    cardsToDestroy: destroyed, destroyedInstanceIds: destroyed,
  };
};
export const removeDestroyedCards = (field: GameCard[], ids: string[]) => field.filter(c => !ids.includes(c.instanceId));
export const determineWinner = determineBattleWinner;
export const hasGameEnded = (playerLife: number, cpuLife: number) => playerLife <= 0 || cpuLife <= 0;
