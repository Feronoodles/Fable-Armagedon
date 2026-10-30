import { canAffordCard, spendManaFromZone } from "@/game-engine/mana";
import { FIELD_POSITIONS, GameCard, Player } from "@/game-engine/types";
import { getPlayCondition } from "@/game-engine/battle-actions";
import { canPlaceUniqueField, getEffectiveCardStats, getEffectiveCost } from "@/game-engine/rules";

export const getAvailablePosition = (field: GameCard[]): number | undefined => {
  const occupied = new Set(field.filter(c => c.cardType === "CRIATURA").map(c => c.position));
  return Array.from({ length: FIELD_POSITIONS }, (_, i) => i + 1).find(position => !occupied.has(position));
};
export const getCpuManaCardToPlay = (hand: GameCard[], playedManaThisTurn: boolean): GameCard | null =>
  playedManaThisTurn ? null : hand.find(c => c.cardType === "MANA" || c.cardType === "TIERRA") ?? null;

const priority = (card: GameCard, field: GameCard[], opponent?: Player): number => {
  const effects = (card.abilities ?? []).map(a => a.effect);
  const damage = effects.includes("DAMAGE_3_TARGET") ? 3 : effects.includes("DAMAGE_2_TARGET") ? 2 : 0;
  if (damage && opponent && opponent.life <= damage && !opponent.field.some(c => c.abilities?.some(a => a.effect === "PROTECT_OTHERS"))) return 1000;
  if (card.cardType === "CRIATURA") return 12 + (card.attack ?? 0) * 3 + (card.defense ?? 0) - card.cost * .5;
  if (card.cardType === "ALTERADOR" && effects.includes("BUFF_FIRE_ATK")) {
    return 6 + field.filter(c => c.cardType === "CRIATURA" && c.attribute === "FUEGO").length * 7;
  }
  if (damage && opponent) {
    const kill = opponent.field.filter(c => c.cardType === "CRIATURA" && getEffectiveCardStats(c, opponent).remainingDefense <= damage)
      .sort((a, b) => (b.attack ?? 0) + b.cost - (a.attack ?? 0) - a.cost)[0];
    return kill ? 24 + kill.cost * 2 : 5;
  }
  if (effects.some(effect => effect.startsWith("SACRIFICE"))) {
    return field.some(c => c.abilities?.some(a => a.trigger === "ON_SACRIFICE")) ? 30 : 7;
  }
  return 10 - card.cost * .4;
};
export const getCpuPlayableCards = (hand: GameCard[], manaZone: GameCard[], field: GameCard[], opponent?: Player): GameCard[] =>
  hand.filter(card => card.cardType !== "MANA" && card.cardType !== "TIERRA" && canAffordCard(card, manaZone, field) && canPlaceUniqueField(card, field))
    .sort((a, b) => priority(b, field, opponent) - priority(a, field, opponent) || a.cost - b.cost);

export const getCpuSummonPlan = (hand: GameCard[], manaZone: GameCard[], field: GameCard[], opponent?: Player): Array<{ card: GameCard; position?: number }> => {
  const candidates = getCpuPlayableCards(hand, manaZone, field, opponent), plannedField = [...field];
  let availableMana = [...manaZone];
  const plan: Array<{ card: GameCard; position?: number }> = [];
  for (const card of candidates) {
    if (plan.length >= 2) break;
    if (!canAffordCard(card, availableMana, plannedField) || !canPlaceUniqueField(card, plannedField)) continue;
    const creature = card.cardType === "CRIATURA", position = creature ? getAvailablePosition(plannedField) : undefined;
    if (creature && position === undefined && !getPlayCondition(card)) continue;
    plan.push({ card, position });
    availableMana = spendManaFromZone(availableMana, card.manaTypes, getEffectiveCost(card, plannedField), card.rarity);
    if (creature || card.cardType === "ALTERADOR") plannedField.push({ ...card, position });
  }
  return plan;
};
