import type { Card } from "@/components/cards/CardItem";

export interface CommandDeck { id: string; name: string; description?: string; isActive: boolean; totalCards: number; deckCards: { id?: string; quantity: number; card: Card }[] }
export const isMana = (card: { cardType: string }) => ["MANA", "TIERRA"].includes(card.cardType);
export const mainCount = (deck: CommandDeck) => deck.deckCards.filter(entry => !isMana(entry.card)).reduce((sum, entry) => sum + entry.quantity, 0);
export const manaCount = (deck: CommandDeck) => deck.deckCards.filter(entry => isMana(entry.card)).reduce((sum, entry) => sum + entry.quantity, 0);
export const playable = (deck: CommandDeck) => mainCount(deck) >= 40 && mainCount(deck) <= 50 && manaCount(deck) <= 24;
export const deckCover = (deck: CommandDeck) => [...deck.deckCards].filter(entry => !isMana(entry.card)).sort((a, b) => (b.card.attack ?? 0) - (a.card.attack ?? 0) || b.card.cost - a.card.cost)[0]?.card;
export const cleanText = (text: string) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
