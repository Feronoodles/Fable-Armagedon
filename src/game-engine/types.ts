import type { GameAbility } from "./abilities";

export interface GameCard {
  id: string;
  instanceId: string;
  name: string;
  description?: string;
  cost: number;
  attack?: number;
  defense?: number;
  cardType: string;
  rarity: string;
  manaTypes: string[];
  attribute: string;
  subtypes: string[];
  abilities?: GameAbility[];
  flavorText?: string;
  picture?: string;
  imageUrl?: string;
  canAttack?: boolean;
  hasAttacked?: boolean;
  isBlocked?: boolean;
  isTapped?: boolean;
  position?: number;
  damageMarked?: number;
  attackBonusThisTurn?: number;
  defenseBonusThisTurn?: number;
  unblockableThisTurn?: boolean;
  activatedThisTurn?: boolean;
  isTemporary?: boolean;
  permanentAttackBonus?: number;
  permanentDefenseBonus?: number;
  damagePreventionUsed?: boolean;
  attacksMade?: number;
  forcedBlockerIds?: string[];
  abilitiesDisabled?: boolean;
}

export type CardDefinition = Omit<
  GameCard,
  | "instanceId"
  | "canAttack"
  | "hasAttacked"
  | "isBlocked"
  | "isTapped"
  | "position"
  | "damageMarked"
  | "attackBonusThisTurn"
  | "defenseBonusThisTurn"
  | "unblockableThisTurn"
  | "activatedThisTurn"
  | "isTemporary"
>;

export interface Player {
  id: string;
  name: string;
  life: number;
  maxLife: number;
  hand: GameCard[];
  field: GameCard[];
  graveyard: GameCard[];
  deck: GameCard[];
  manaZone: GameCard[];
  usedCardsThisTurn?: string[];
}

export type GamePhase = "DRAW" | "MAIN" | "COMBAT" | "END";
export type Turn = "PLAYER" | "CPU";

export const MAX_HAND_SIZE = 7;
export const STARTING_LIFE = 25;
export const STARTING_HAND_SIZE = 5;
export const FIELD_POSITIONS = 6;
