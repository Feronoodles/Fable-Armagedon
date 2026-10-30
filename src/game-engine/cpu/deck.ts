import type { CardDefinition } from "../types";
import { cardCatalog } from "../catalog";

export const CPU_DECK_PROFILE = {
  name: { es: "Legión de Brasa", en: "Ember Legion" },
  description: {
    es: "Criaturas de Fuego desde los primeros turnos, dragones que se potencian entre sí y daño directo. Los fanáticos alimentan los rituales; los estandartes refuerzan todo el campo.",
    en: "Early Fire creatures, dragons that strengthen each other, and direct damage. Fanatics fuel rituals; banners strengthen the whole field.",
  },
  element: "FUEGO",
  mainCount: 40,
  manaCount: 22,
  mainCards: [
    { name: "Aprendiz de la Primera Llama", quantity: 4 },
    { name: "Dragón de Chispa", quantity: 4 },
    { name: "Cría de Brasa", quantity: 4 },
    { name: "Fanático de la Llama Solar", quantity: 4 },
    { name: "Cazador de Chispas", quantity: 4 },
    { name: "Portador del Estandarte Carmesí", quantity: 3 },
    { name: "Orco Renacido por la Forja", quantity: 3 },
    { name: "General Volcánico Kharzeth", quantity: 2 },
    { name: "Flecha de Fuego Ancestral", quantity: 4 },
    { name: "Ofrenda al Sol Carmesí", quantity: 2 },
    { name: "Ritual de la Erupción Imperial", quantity: 2 },
    { name: "Estandarte de la Primera Llama", quantity: 4 },
  ],
  lands: [{ name: "Mana de Fuego", quantity: 22 }],
} as const;

/** Fixed, legal composition. The normal battle setup shuffles both players' decks. */
export const generateCpuDeck = (allCards: CardDefinition[] = []): CardDefinition[] => {
  const supplied = new Map(allCards.map(card => [card.name, card]));
  const builtIn = new Map<string, CardDefinition>(cardCatalog.map(card => [card.name, { ...card, id: "catalog-" + card.name }]));
  return [...CPU_DECK_PROFILE.mainCards, ...CPU_DECK_PROFILE.lands].flatMap(({ name, quantity }) => {
    const card = supplied.get(name) ?? builtIn.get(name);
    if (!card) throw new Error("Falta una carta del mazo de la CPU: " + name);
    return Array.from({ length: quantity }, () => ({
      ...card, manaTypes: [...card.manaTypes], subtypes: [...card.subtypes],
      abilities: card.abilities?.map(ability => ({ ...ability })),
    }));
  });
};
