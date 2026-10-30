import type { EffectState } from "./rules";
import type { GameCard, Turn } from "./types";
import { canAffordCard } from "./mana";
import {
  canPlaceUniqueField, getElements, getFieldPositions, getEffectSelectionGroups, getPlayer, hasAbility,
  hasValidSelection, isCreature, isMana, requiresTarget,
} from "./rules";

export const getPlayCondition = (card: GameCard) =>
  card.abilities?.find(a => a.trigger === "SUMMON_CONDITION");
export const getPlayTargetAbility = (card: GameCard) =>
  getPlayCondition(card) ?? (card.cardType === "HECHIZO" ? card.abilities?.find(a => a.trigger === "INSTANT" && requiresTarget(a)) : undefined);
export const getPlayRestriction = (state: EffectState, controller: Turn, card: GameCard): string | null => {
  const own = getPlayer(state, controller);
  if (isMana(card)) return null;
  if (!canPlaceUniqueField(card, own.field)) return "Ya controlas un " + card.name + " activo.";
  if (!canAffordCard(card, own.manaZone, own.field)) return "No tienes suficiente maná disponible.";
  if (hasAbility(card, "HARD_ONCE_PER_TURN") && own.usedCardsThisTurn?.includes(card.name)) return "Ya jugaste esta carta este turno.";
  if (hasAbility(card, "REQUIRES_3_ELEMENTS") && getElements(own).size < 3) return "Necesitas 3 elementos diferentes en tu campo.";
  const condition = getPlayCondition(card), target = getPlayTargetAbility(card);
  if (isCreature(card) && !getFieldPositions(own.field).length && !condition) return "Tu campo de criaturas está lleno.";
  if (target && !hasValidSelection(getEffectSelectionGroups(target, state, controller, card))) {
    return condition ? "No controlas los sacrificios requeridos." : "No hay objetivos válidos para este efecto.";
  }
  return null;
};
