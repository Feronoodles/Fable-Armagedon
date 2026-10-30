import type { Turn } from "./types";

export const COMBAT_CLASH_DURATION_MS = 1100;

export interface CombatAnimation {
  id: string;
  attackerId: string;
  blockerIds: string[];
  controller: Turn;
}
