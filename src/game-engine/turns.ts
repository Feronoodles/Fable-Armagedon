import { GameCard, GamePhase, Turn } from "./types";

export const PHASES: GamePhase[] = ["DRAW", "MAIN", "COMBAT", "END"];

export const getNextPhase = (phase: GamePhase): GamePhase => {
  const currentIndex = PHASES.indexOf(phase);
  return PHASES[(currentIndex + 1) % PHASES.length];
};

export const shouldSkipCombatPhase = (turn: Turn, turnNumber: number) => turn === "PLAYER" && turnNumber === 1;

export const getNextTurnState = (turn: Turn, turnNumber: number) => {
  const newTurn: Turn = turn === "PLAYER" ? "CPU" : "PLAYER";
  const newTurnNumber = newTurn === "PLAYER" ? turnNumber + 1 : turnNumber;
  return { newTurn, newTurnNumber };
};

export const resetFieldForNewTurn = (field: GameCard[]) =>
  field.map((c) => ({
    ...c,
    hasAttacked: false,
    isBlocked: false,
    canAttack: c.cardType === "CRIATURA",
    damageMarked: 0,
    attackBonusThisTurn: 0,
    defenseBonusThisTurn: 0,
    unblockableThisTurn: false,
    activatedThisTurn: false,
    damagePreventionUsed: false,
    attacksMade: 0,
    forcedBlockerIds: [],
  }));

export const resetManaZoneForNewTurn = (manaZone: GameCard[]) =>
  manaZone
    .filter((c) => !c.isTemporary)
    .map((c) => ({
      ...c,
      isTapped: false,
    }));
