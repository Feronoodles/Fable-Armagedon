/** Pack rules shared by the shop, seed, API and probability tests. */
export const MAX_PACK_PURCHASE = 100;
export const VOLCAN_PACK_ART = "/assets/cards/dragon-volcanico-v2.webp";
export const VOLCAN_PACK_ODDS = {
  commonChance: 44, uncommonChance: 30, rareChance: 15,
  epicChance: 7, legendaryChance: 3, celestialChance: 1,
} as const;
export const VOLCAN_PACK_DESCRIPTION = "Diez cartas de Fuego: dragones volcánicos, guerreros ígneos y la posibilidad de obtener Santuario de Fuego, Trono de Fuego o Dominus Volcánico Astravor.";
export const VOLCAN_SPECIAL_MANA = ["Santuario de Fuego", "Trono de Fuego"] as const;
export const VOLCAN_FEATURED_DROPS = ["Dominus Volcánico Astravor", ...VOLCAN_SPECIAL_MANA] as const;
export const PACK_RARITIES = ["COMUN", "INFRECUENTE", "RARA", "EPICA", "LEGENDARIA", "CELESTIAL"] as const;
export type PackRarity = typeof PACK_RARITIES[number];
export type PackOdds = { commonChance: number; uncommonChance: number; rareChance: number; epicChance: number; legendaryChance: number; celestialChance: number };
export type PackRules = PackOdds & { name: string; expansionKey?: string | null; cardsPerPack: number; guaranteeRare: boolean };
export type PoolCard = { id: string; name: string; rarity: string; cardType: string; attribute: string; expansionKey: string };
export type FeaturedDrop = { name: string; rarity: string; chance: number };
export type PackPurchase = { packTypeId: string; currency: "gold" | "gems"; quantity: number };
const RARITY_FIELDS: Record<PackRarity, keyof PackOdds> = {
  COMUN: "commonChance", INFRECUENTE: "uncommonChance", RARA: "rareChance",
  EPICA: "epicChance", LEGENDARIA: "legendaryChance", CELESTIAL: "celestialChance",
};
export class PackError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function isVolcanPack(pack: { name: string; expansionKey?: string | null }) {
  return pack.expansionKey === "VOLCAN_DORMIDO" || pack.name === "Volcán Dormido";
}
export function isCardInPack(card: PoolCard, pack: { name: string; expansionKey?: string | null }) {
  const mana = card.cardType === "MANA" || card.cardType === "TIERRA";
  if (isVolcanPack(pack)) {
    if (card.attribute !== "FUEGO") return false;
    if (mana) return VOLCAN_SPECIAL_MANA.some(name => name === card.name) &&
      (card.name === "Santuario de Fuego" ? card.rarity === "LEGENDARIA" : card.rarity === "CELESTIAL");
    return card.expansionKey === "VOLCAN_DORMIDO";
  }
  return !mana && (!pack.expansionKey || card.expansionKey === pack.expansionKey);
}
export function rarityChance(pack: PackOdds, rarity: PackRarity) { return pack[RARITY_FIELDS[rarity]]; }
export function featuredPackDrops(pack: PackRules, cards: PoolCard[]): FeaturedDrop[] {
  if (!isVolcanPack(pack)) return [];
  const pool = cards.filter(card => isCardInPack(card, pack));
  return VOLCAN_FEATURED_DROPS.flatMap(name => {
    const card = pool.find(candidate => candidate.name === name);
    if (!card || !PACK_RARITIES.includes(card.rarity as PackRarity)) return [];
    const count = pool.filter(candidate => candidate.rarity === card.rarity).length;
    return [{ name, rarity: card.rarity, chance: rarityChance(pack, card.rarity as PackRarity) / count }];
  });
}
export function parsePackPurchase(body: unknown): PackPurchase {
  if (!body || typeof body !== "object" || Array.isArray(body)) throw new PackError("Compra inválida.");
  const { packTypeId, currency, quantity = 1 } = body as Record<string, unknown>;
  if (typeof packTypeId !== "string" || !packTypeId.trim()) throw new PackError("Indica el sobre que quieres comprar.");
  if (currency !== "gold" && currency !== "gems") throw new PackError("Selecciona oro o gemas.");
  if (typeof quantity !== "number" || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_PACK_PURCHASE)
    throw new PackError("La cantidad debe ser un entero entre 1 y " + MAX_PACK_PURCHASE + ".");
  return { packTypeId, currency, quantity };
}
export function packPurchaseCost(unitPrice: number, quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_PACK_PURCHASE)
    throw new PackError("La cantidad debe ser un entero entre 1 y " + MAX_PACK_PURCHASE + ".");
  const total = unitPrice * quantity;
  if (!Number.isSafeInteger(unitPrice) || unitPrice <= 0) throw new PackError("Este sobre no está disponible con esa moneda.");
  if (!Number.isSafeInteger(total) || total > 2147483647) throw new PackError("El importe de la compra es demasiado alto.");
  return total;
}
/** Roll rarity first; every eligible card of that rarity has the same chance. */
export function drawPack<T extends PoolCard>(pack: PackRules, candidates: T[], random = Math.random): T[] {
  if (!Number.isSafeInteger(pack.cardsPerPack) || pack.cardsPerPack < 1 || pack.cardsPerPack > 100)
    throw new PackError("El tamaño de este sobre no es válido.", 409);
  const weights = PACK_RARITIES.map(rarity => ({ rarity, weight: rarityChance(pack, rarity) }));
  if (weights.some(item => !Number.isFinite(item.weight) || item.weight < 0) || weights.reduce((sum, item) => sum + item.weight, 0) !== 100)
    throw new PackError("Las probabilidades del sobre deben sumar 100%.", 409);
  const cards = candidates.filter(card => isCardInPack(card, pack));
  const pools = new Map(PACK_RARITIES.map(rarity => [rarity, cards.filter(card => card.rarity === rarity)]));
  for (const item of weights) {
    if (item.weight > 0 && !pools.get(item.rarity)?.length)
      throw new PackError("Faltan cartas de rareza " + item.rarity + " para este sobre. No se consumió el sobre.", 409);
  }
  const chooseRarity = (rareOrBetter: boolean) => {
    const choices = weights.filter(item => item.weight > 0 && (!rareOrBetter || PACK_RARITIES.indexOf(item.rarity) >= 2));
    const total = choices.reduce((sum, item) => sum + item.weight, 0);
    if (!total) throw new PackError("No hay cartas disponibles para la garantía de rareza.", 409);
    let roll = random() * total;
    for (const choice of choices) { if (roll < choice.weight) return choice.rarity; roll -= choice.weight; }
    return choices[choices.length - 1].rarity;
  };
  const result: T[] = [];
  for (let slot = 0; slot < pack.cardsPerPack; slot++) {
    const needsGuarantee = pack.guaranteeRare && slot === pack.cardsPerPack - 1 && !result.some(card => PACK_RARITIES.indexOf(card.rarity as PackRarity) >= 2);
    const pool = pools.get(chooseRarity(needsGuarantee))!;
    result.push(pool[Math.floor(random() * pool.length)]);
  }
  return result;
}
