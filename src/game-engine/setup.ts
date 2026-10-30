import { CardDefinition, GameCard, Player, STARTING_HAND_SIZE, STARTING_LIFE } from "./types";

export const generateInstanceId = () => Math.random().toString(36).substring(2, 15);

export const shuffleDeck = <T,>(deck: T[]): T[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const createGameCard = (card: CardDefinition): GameCard => ({
  ...card,
  instanceId: generateInstanceId(),
  canAttack: card.cardType === "CRIATURA",
  hasAttacked: false,
  isBlocked: false,
  isTapped: false,
  position: undefined,
  damageMarked: 0,
  attackBonusThisTurn: 0,
  defenseBonusThisTurn: 0,
  unblockableThisTurn: false,
  activatedThisTurn: false,
  isTemporary: false,
});

const isManaCard = (card: GameCard) => card.cardType === "MANA" || card.cardType === "TIERRA";

const ensureOpeningHandHasMana = (hand: GameCard[], deck: GameCard[]) => {
  if (hand.some(isManaCard)) return { hand, deck };

  const manaIndex = deck.findIndex(isManaCard);
  if (manaIndex === -1 || hand.length === 0) return { hand, deck };

  const nextHand = [...hand];
  const nextDeck = [...deck];
  const replacement = nextDeck[manaIndex];
  nextDeck[manaIndex] = nextHand[nextHand.length - 1];
  nextHand[nextHand.length - 1] = replacement;

  return { hand: nextHand, deck: nextDeck };
};

export const createEmptyPlayer = (id: string, name: string): Player => ({
  id,
  name,
  life: STARTING_LIFE,
  maxLife: STARTING_LIFE,
  hand: [],
  field: [],
  graveyard: [],
  deck: [],
  manaZone: [],
});

export const createInitialPlayers = (playerDeck: CardDefinition[], cpuDeck: CardDefinition[]) => {
  const playerGameDeck = shuffleDeck(playerDeck.map(createGameCard));
  const cpuGameDeck = shuffleDeck(cpuDeck.map(createGameCard));

  const playerHand = playerGameDeck.splice(0, STARTING_HAND_SIZE);
  const cpuHand = cpuGameDeck.splice(0, STARTING_HAND_SIZE);
  const playerOpening = ensureOpeningHandHasMana(playerHand, playerGameDeck);
  const cpuOpening = ensureOpeningHandHasMana(cpuHand, cpuGameDeck);

  return {
    player: {
      ...createEmptyPlayer("player", "Jugador"),
       hand: playerOpening.hand,
       deck: playerOpening.deck,
    },
    cpu: {
      ...createEmptyPlayer("cpu", "CPU"),
       hand: cpuOpening.hand,
       deck: cpuOpening.deck,
    },
  };
};
