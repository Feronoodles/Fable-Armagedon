import type { GameCard, Player, Turn } from "./types";

export type AbilityTrigger =
  | "ACTIVATED"
  | "INSTANT"
  | "ON_ENTER"
  | "ON_ATTACK"
  | "ON_DAMAGE"
  | "ON_DEATH"
  | "ON_COMBAT_DAMAGE"
  | "TURN_START"
  | "TURN_END"
  | "CONTINUO"
  | "CONTINUOUS"
  | "DAMAGE_PREVENTION"
  | (string & {});

export type AbilityEffect =
  | "GENERATE_FIRE_MANA"
  | "GENERATE_WATER_MANA"
  | "GENERATE_NATURE_MANA"
  | "GENERATE_LIGHTNING_MANA"
  | "GENERATE_VOID_MANA"
  | "GENERATE_COLORLESS_MANA"
  | "GENERATE_EARTH_MANA"
  | "GENERATE_METAL_MANA"
  | "GENERATE_FIRE_OR_LEGENDARY_MANA"
  | "GENERATE_WATER_OR_LEGENDARY_MANA"
  | "GENERATE_NATURE_OR_LEGENDARY_MANA"
  | "GENERATE_LIGHTNING_OR_LEGENDARY_MANA"
  | "GENERATE_VOID_OR_LEGENDARY_MANA"
  | "GENERATE_COLORLESS_OR_LEGENDARY_MANA"
  | "GENERATE_EARTH_OR_LEGENDARY_MANA"
  | "GENERATE_METAL_OR_LEGENDARY_MANA"
  | "GENERATE_FIRE_OR_CELESTIAL_MANA"
  | "GENERATE_WATER_OR_CELESTIAL_MANA"
  | "GENERATE_NATURE_OR_CELESTIAL_MANA"
  | "GENERATE_LIGHTNING_OR_CELESTIAL_MANA"
  | "GENERATE_VOID_OR_CELESTIAL_MANA"
  | "GENERATE_COLORLESS_OR_CELESTIAL_MANA"
  | "GENERATE_EARTH_OR_CELESTIAL_MANA"
  | "GENERATE_METAL_OR_CELESTIAL_MANA"
  | "BUFF_IF_SUBTYPE_PRESENT"
  | "REDUCE_COST_SUBTYPE"
  | "BLOCK_ADDITIONAL"
  | "CANT_ATTACK"
  | "UPGRADE_COMMON_TO_UNCOMMON"
  | "CONVERT_MANA_RANDOM"
  | "UNBLOCKABLE_OPTION"
  | "BUFF_WHEN_DAMAGED"
  | "INTIMIDATE"
  | "BOUNCE_DRAW"
  | "LIFE_GAIN_PER_SUBTYPE"
  | "BUFF_SUBTYPE_DEFENSE"
  | "HASTE"
  | "FIRST_DAMAGE_NEGATED"
  | "SPELL_IMMUNITY"
  | "FORCE_BLOCK"
  | "DOUBLE_ATTACK_IF_SYNERGY"
  | "DESTROY_ALL_FIELD_ALTERERS"
  | "PLAY_FIELD_ALTERERS_FREE"
  | "BUFF_PER_SUBTYPE"
  | "MASS_BUFF_AND_ABILITIES"
  | "LIFE_GAIN_PER_ELEMENT"
  | "SUMMON_SAME_CARD_FROM_DECK"
  | (string & {});

export interface GameAbility {
  name: string;
  description: string;
  trigger: AbilityTrigger;
  effect: AbilityEffect;
  selectedIds?: string[];
  originalController?: Turn;
}

export type EffectTarget =
  | { type: "PLAYER"; player: Turn }
  | { type: "CARD"; instanceId: string }
  | { type: "CARDS"; instanceIds: string[] };

export interface EffectTargetOption {
  target: EffectTarget;
  label: string;
  card?: GameCard;
  group?: string;
}

export interface EffectSelectionGroup {
  label: string;
  options: EffectTargetOption[];
  min: number;
  max: number;
}

export interface EffectRequest {
  controller: Turn;
  source: GameCard;
  ability: GameAbility;
  target?: EffectTarget;
  reactionChecked?: boolean;
}

export interface EffectLog {
  id: string;
  controller: Turn;
  source: string;
  effect: AbilityEffect;
  message: string;
  turn?: number;
  phase?: string;
  sourceInstanceId?: string;
  originName?: string;
  originInstanceId?: string;
  abilityName?: string;
  trigger?: AbilityTrigger;
  targetInstanceId?: string;
  targetName?: string;
  targetController?: Turn;
  targetPosition?: number;
  targetZone?: "FIELD" | "DECK" | "HAND" | "MANA" | "GRAVEYARD";
  amount?: number;
  before?: number;
  after?: number;
  stat?: "LIFE" | "DEFENSE" | "ATTACK";
  damageType?: "COMBAT" | "EFFECT";
  outcome?: "APPLIED" | "PREVENTED" | "SKIPPED";
  batchId?: string;
}

export interface PendingEffect {
  controller: Turn;
  source: GameCard;
  ability: GameAbility;
  options: EffectTargetOption[];
  groups?: EffectSelectionGroup[];
  kind?: "PLAY" | "ACTIVATE" | "TRIGGER" | "REACTION";
  position?: number;
  cancellable?: boolean;
}

export interface AbilityContext {
  source: GameCard;
  controller: Turn;
  player: Player;
  cpu: Player;
  target?: EffectTarget;
  cardPool?: GameCard[];
  rng?: () => number;
}

export interface AbilityResolution {
  supported: boolean;
  effect: AbilityEffect;
  summary: string;
}

export const normalizeAbilityTrigger = (trigger: AbilityTrigger): AbilityTrigger => {
  if (trigger === "CONTINUOUS") return "CONTINUO";
  return trigger;
};
