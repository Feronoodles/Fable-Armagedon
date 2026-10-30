import type { GameCard } from "./types";
import { getEffectiveCost, isMana } from "./rules";

/** Each untapped land supplies one mana, chosen from its printed alternatives. */
export const getManaOptions = (card: GameCard): string[] =>
  [...new Set([card.attribute, ...(card.manaTypes ?? [])].filter(Boolean))];
/** Printed symbols plus the special source required by legendary/celestial rarity. */
export const getManaRequirements = (manaTypes: string[], rarity?: string): string[] => {
  const requirements = manaTypes.filter(type => type !== "NORMAL");
  if (rarity === "LEGENDARIA" && !requirements.includes("LEGENDARIO")) requirements.push("LEGENDARIO");
  if (rarity === "CELESTIAL" && !requirements.includes("CELESTIAL")) requirements.push("CELESTIAL");
  return requirements;
};
export const getAvailableMana = (zone: GameCard[]): Record<string, number> => {
  const available: Record<string, number> = {};
  for (const card of zone.filter(c => isMana(c) && !c.isTapped)) {
    for (const element of getManaOptions(card)) available[element] = (available[element] ?? 0) + 1;
  }
  return available;
};
export const planManaPayment = (zone: GameCard[], manaTypes: string[], cost: number, rarity?: string): number[] | null => {
  if (cost <= 0) return [];
  const available = zone.map((card, index) => ({ card, index })).filter(({ card }) => isMana(card) && !card.isTapped);
  if (available.length < cost) return null;
  // Repeated symbols are distinct requirements (e.g. two Fire sources).
  const requirements = getManaRequirements(manaTypes, rarity);
  if (requirements.length > cost) return null;
  requirements.sort((a, b) => available.filter(v => getManaOptions(v.card).includes(a)).length - available.filter(v => getManaOptions(v.card).includes(b)).length);
  const reserve = (offset: number, used: number[]): number[] | null => {
    if (offset === requirements.length) {
      const rest = available.filter(v => !used.includes(v.index)).sort((a, b) => getManaOptions(a.card).length - getManaOptions(b.card).length);
      return [...used, ...rest.slice(0, cost - used.length).map(v => v.index)];
    }
    for (const { card, index } of available) {
      if (used.includes(index) || !getManaOptions(card).includes(requirements[offset])) continue;
      const payment = reserve(offset + 1, [...used, index]);
      if (payment) return payment;
    }
    return null;
  };
  return reserve(0, []);
};
export const canAffordCard = (card: GameCard, zone: GameCard[], field: GameCard[] = []) =>
  isMana(card) || planManaPayment(zone, card.manaTypes ?? [], getEffectiveCost(card, field), card.rarity) !== null;
export const spendManaFromZone = (zone: GameCard[], types: string[], cost: number, rarity?: string): GameCard[] => {
  const payment = planManaPayment(zone, types, cost, rarity);
  if (!payment) return zone;
  return zone.map((card, i) => payment.includes(i) ? { ...card, isTapped: true } : card);
};
