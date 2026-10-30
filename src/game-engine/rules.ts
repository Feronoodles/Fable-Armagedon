import type { AbilityEffect, AbilityTrigger, EffectLog, EffectRequest, EffectSelectionGroup, EffectTarget, EffectTargetOption, GameAbility } from "./abilities";
import { normalizeAbilityTrigger } from "./abilities";
import { generateInstanceId } from "./setup";
import { cardCatalog, VOLCANIC_DRAGON_SUCCESSORS } from "./catalog";
import { CREATURE_SUBTYPE_KEYS } from "./subtypes";
import { FIELD_POSITIONS, GameCard, MAX_HAND_SIZE, Player, Turn } from "./types";

export interface EffectState { player: Player; cpu: Player }
export interface EffectResult extends EffectState {
  handled: boolean;
  logs: EffectLog[];
  queue: EffectRequest[];
  pendingDiscard?: Turn;
}
export const oppositeTurn = (turn: Turn): Turn => turn === "PLAYER" ? "CPU" : "PLAYER";
export const getPlayer = (state: EffectState, turn: Turn) => turn === "PLAYER" ? state.player : state.cpu;
export const setPlayer = (state: EffectState, turn: Turn, player: Player): EffectState =>
  turn === "PLAYER" ? { ...state, player } : { ...state, cpu: player };
export const normal = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
export const isCreature = (card: Pick<GameCard, "cardType">) => card.cardType === "CRIATURA";
export const isMana = (card: Pick<GameCard, "cardType">) => card.cardType === "MANA" || card.cardType === "TIERRA";
export const PASSIVE_EFFECTS = new Set([
  "BLOCK_ADDITIONAL", "BUFF_FIRE_ATK", "BUFF_IF_SUBTYPE_PRESENT", "BUFF_PER_SUBTYPE",
  "BUFF_SUBTYPE_DEFENSE", "CANT_ATTACK", "DAMAGE_ON_SACRIFICE", "DEF_BUFF_IF_3_FIRE",
  "DEF_BUFF_IF_OTHER_FIRE", "DOUBLE_ATTACK_IF_DRAGON", "DOUBLE_ATTACK_IF_SYNERGY",
  "HARD_ONCE_PER_TURN", "HASTE", "INTIMIDATE", "MASS_BUFF_AND_ABILITIES", "MUST_ATTACK",
  "PROTECT_OTHERS", "REDUCE_COST_SUBTYPE", "REQUIRES_3_ELEMENTS", "SPELL_IMMUNITY",
  "UNIQUE_ACTIVE_FIELD",
]);
export const hasAbility = (card: GameCard, effect: string) =>
  !card.abilitiesDisabled && (card.abilities ?? []).some(a => a.effect === effect);
export const canPlaceUniqueField = (card: GameCard, field: GameCard[]) =>
  !hasAbility(card, "UNIQUE_ACTIVE_FIELD") || !field.some(c => c.cardType === "ALTERADOR" && c.name === card.name);
export const createEffectLog = (
  controller: Turn, source: Pick<GameCard, "name"> & Partial<Pick<GameCard, "instanceId">>,
  effect: string, message: string, details: Partial<EffectLog> = {},
): EffectLog => ({
  id: generateInstanceId(), controller, source: source.name, sourceInstanceId: source.instanceId,
  effect: effect as AbilityEffect, message, ...details,
});
export const continuous = (card: GameCard) => card.abilitiesDisabled ? [] :
  (card.abilities ?? []).filter(a => normalizeAbilityTrigger(a.trigger) === "CONTINUO");
export const subtypeOf = (ability: GameAbility) => {
  const description = normal(ability.description);
  return [...CREATURE_SUBTYPE_KEYS, "GUARDIAN", "BESTIA"]
    .find(s => description.includes(s) || (s === "HUMANO" && description.includes("HUMANA")));
};
export const bonusOf = (ability: GameAbility) => {
  const description = normal(ability.description);
  const pair = description.match(/\+(\d+)\s*\/\s*\+(\d+)/);
  return {
    attack: pair ? Number(pair[1]) : Number(description.match(/\+(\d+)\s*(?:ATQ|ATK|ATTACK)/)?.[1] ?? 0),
    defense: pair ? Number(pair[2]) : Number(description.match(/\+(\d+)\s*(?:DEF|DEFENSE)/)?.[1] ?? 0),
  };
};
export const getElements = (owner: Player) => new Set(
  [...owner.field, ...owner.manaZone].map(c => c.attribute).filter(e => e && e !== "LEGENDARIO" && e !== "CELESTIAL"),
);
export const ELEMENTAL_KEYWORDS: Record<string, string> = {
  FUEGO: "HASTE", AGUA: "FIRST_DAMAGE_NEGATED", NATURALEZA: "BLOCK_ADDITIONAL",
  RAYO: "DOUBLE_ATTACK", VACIO: "INTIMIDATE", METAL: "SPELL_IMMUNITY",
};
const harmonyActive = (owner: Player) =>
  getElements(owner).size >= 3 && owner.field.some(c => hasAbility(c, "MASS_BUFF_AND_ABILITIES"));
export const hasKeyword = (card: GameCard, owner: Player, keyword: string) =>
  hasAbility(card, keyword) || (isCreature(card) && harmonyActive(owner) &&
    [...getElements(owner)].some(element => ELEMENTAL_KEYWORDS[element] === keyword));

export const getEffectiveCardStats = (card: GameCard, owner: Player) => {
  let attack = (card.attack ?? 0) + (card.permanentAttackBonus ?? 0) + (card.attackBonusThisTurn ?? 0);
  let defense = (card.defense ?? 0) + (card.permanentDefenseBonus ?? 0) + (card.defenseBonusThisTurn ?? 0);
  if (!isCreature(card)) return { attack, defense, remainingDefense: defense, canAttack: false, blockCapacity: 0, maxAttacks: 0 };
  const creatures = owner.field.filter(isCreature), fire = creatures.filter(c => c.attribute === "FUEGO");
  for (const support of owner.field) {
    for (const ability of continuous(support)) {
      const self = support.instanceId === card.instanceId, subtype = subtypeOf(ability), bonus = bonusOf(ability);
      switch (ability.effect) {
        case "BUFF_FIRE_ATK":
          if (card.attribute === "FUEGO" && (!normal(ability.description).includes("OTROS") || !self)) attack += bonus.attack || 1;
          break;
        case "BUFF_SUBTYPE_DEFENSE":
          if (subtype && card.subtypes.includes(subtype)) defense += bonus.defense || 1;
          break;
        case "BUFF_IF_SUBTYPE_PRESENT":
          if (self && subtype && creatures.some(c => c.instanceId !== card.instanceId && c.subtypes.includes(subtype))) {
            attack += bonus.attack; defense += bonus.defense;
          }
          break;
        case "BUFF_PER_SUBTYPE": {
          const count = new Set(creatures.flatMap(c => c.subtypes)).size;
          attack += count * (bonus.attack || 2); defense += count * (bonus.defense || 2);
          break;
        }
        case "MASS_BUFF_AND_ABILITIES":
          if (getElements(owner).size >= 3) { attack += 3; defense += 3; }
          break;
        case "DEF_BUFF_IF_3_FIRE": if (self && fire.length >= 3) defense += 2; break;
        case "DEF_BUFF_IF_OTHER_FIRE":
          if (self && fire.some(c => c.instanceId !== card.instanceId)) defense += 2;
          break;
      }
    }
  }
  if (harmonyActive(owner)) {
    if (getElements(owner).has("TIERRA")) defense += 2;
    if (getElements(owner).has("NORMAL")) attack += 1;
  }
  const triple = ["DINOSAURIO", "MECHA", "HUMANO"].every(s => creatures.some(c => c.subtypes.includes(s)));
  const doubleAttack = hasKeyword(card, owner, "DOUBLE_ATTACK") ||
    (hasAbility(card, "DOUBLE_ATTACK_IF_SYNERGY") && triple) ||
    (hasAbility(card, "DOUBLE_ATTACK_IF_DRAGON") && creatures.some(c => c.instanceId !== card.instanceId && c.subtypes.includes("DRAGON")));
  return {
    attack: Math.max(0, attack), defense: Math.max(0, defense),
    remainingDefense: Math.max(0, defense - (card.damageMarked ?? 0)),
    canAttack: !hasAbility(card, "CANT_ATTACK") && (card.canAttack !== false || hasKeyword(card, owner, "HASTE")),
    blockCapacity: hasKeyword(card, owner, "BLOCK_ADDITIONAL") ? 2 : 1,
    maxAttacks: doubleAttack ? 2 : 1,
  };
};
export const getEffectiveCost = (card: GameCard, ownerField: GameCard[]) => {
  if (isMana(card)) return 0;
  return Math.max(0, ownerField.reduce((cost, support) => continuous(support).reduce((value, a) =>
    a.effect === "REDUCE_COST_SUBTYPE" && isCreature(card) && card.subtypes.includes(subtypeOf(a) ?? "")
      ? value - Number(a.description.match(/(\d+)\s*(?:menos|less)/i)?.[1] ?? 1) : value, cost), card.cost));
};
export const canCardBlock = (attacker: GameCard, blocker: GameCard, attackerOwner: Player, blockerOwner: Player) => {
  if (!isCreature(blocker) || attacker.unblockableThisTurn) return false;
  return !hasKeyword(attacker, attackerOwner, "INTIMIDATE") ||
    getEffectiveCardStats(blocker, blockerOwner).attack >= getEffectiveCardStats(attacker, attackerOwner).attack;
};
export const getExtraBlocker = (field: GameCard[], used: Set<string>, attacker: GameCard, owner: Player, opponent: Player) =>
  field.filter(c => !used.has(c.instanceId) && getEffectiveCardStats(c, opponent).blockCapacity > 1 && canCardBlock(attacker, c, owner, opponent))
    .sort((a, b) => Math.abs((a.position ?? 0) - (attacker.position ?? 0)) - Math.abs((b.position ?? 0) - (attacker.position ?? 0)))[0];
export const getFieldPositions = (field: GameCard[]) =>
  Array.from({ length: FIELD_POSITIONS }, (_, i) => i + 1).filter(p => !field.some(c => isCreature(c) && c.position === p));
export const getKnownCards = (state: EffectState): GameCard[] => [
  ...state.player.hand, ...state.player.field, ...state.player.manaZone, ...state.player.deck, ...state.player.graveyard,
  ...state.cpu.hand, ...state.cpu.field, ...state.cpu.manaZone, ...state.cpu.deck, ...state.cpu.graveyard,
];
export const getCardOwner = (state: EffectState, id: string): Turn | undefined =>
  state.player.field.some(c => c.instanceId === id) ? "PLAYER" : state.cpu.field.some(c => c.instanceId === id) ? "CPU" : undefined;
export const getTargetCard = (state: EffectState, target: EffectTarget) =>
  target.type === "CARD" ? getKnownCards(state).find(c => c.instanceId === target.instanceId) : undefined;
export const targetIds = (target?: EffectTarget): string[] =>
  target?.type === "CARD" ? [target.instanceId] : target?.type === "CARDS" ? target.instanceIds : [];
const option = (card: GameCard): EffectTargetOption => ({ target: { type: "CARD", instanceId: card.instanceId }, label: card.name, card });
export const isOptionalCombatEffect = (a: GameAbility) => a.effect === "UNBLOCKABLE_OPTION";
export const getUnblockableAbility = (c: GameCard) => c.abilities?.find(isOptionalCombatEffect);
const targeted = new Set([
  "DAMAGE_2_TARGET", "DAMAGE_3_TARGET", "BOUNCE_TARGET", "UPGRADE_COMMON_TO_UNCOMMON",
  "SACRIFICE_DRAW", "SACRIFICE_FIRE_DRAW_DAMAGE", "SACRIFICE_FIRE_DRAW_DRAGON_BONUS",
  "SACRIFICE_SEARCH_FIRE", "DESTROY_BOTH_FIELDS", "DESTROY_LOW_DEFENSE", "NEGATE_AND_DESTROY",
  "SUMMON_FROM_GRAVEYARD", "SUMMON_LOW_COST_FROM_GRAVEYARD", "DRAW_CHOICE_LEGENDARY",
  "DRAW_LOW_COST_FIRE", "SEARCH_LEGENDARY_IF_WAR_DRAGON", "REQUIRES_SACRIFICE",
  "REQUIRES_2_FIRE_SACRIFICE", "FORCE_BLOCK", "PLAY_FIELD_ALTERERS_FREE",
  "BOTH_SACRIFICE_DAMAGE", "RITUAL_OTHER_CHOICE",
  "SACRIFICE_SEARCH_FIRE_MANA", "SEARCH_DRAGON_FROM_DECK",
  "DESTROY_LOW_COST_CREATURE_FROM_DECK",
]);
export const requiresTarget = (ability: GameAbility) => targeted.has(ability.effect);
export const getEffectSelectionGroups = (ability: GameAbility, state: EffectState, controller: Turn, source: GameCard): EffectSelectionGroup[] => {
  const own = getPlayer(state, controller), enemy = getPlayer(state, oppositeTurn(controller));
  const ownCreatures = own.field.filter(isCreature), enemyCreatures = enemy.field.filter(isCreature);
  const protectedIds = enemyCreatures.filter(c => hasAbility(c, "PROTECT_OTHERS")).map(c => c.instanceId);
  const legalEnemy = enemyCreatures.filter(c =>
    (!protectedIds.length || protectedIds.includes(c.instanceId)) &&
    !(source.cardType === "HECHIZO" && hasKeyword(c, enemy, "SPELL_IMMUNITY")));
  const group = (label: string, cards: GameCard[], min = 1, max = 1) => ({ label, options: cards.map(option), min, max });
  const fire = ownCreatures.filter(c => c.attribute === "FUEGO");
  const legendary = own.deck.filter(c => ["Emperador Volcánico Ignathor", "Dominus Volcánico Astravor"].includes(c.name));
  switch (ability.effect) {
    case "DAMAGE_2_TARGET": case "DAMAGE_3_TARGET":
      return [{ label: "Objetivo", min: 1, max: 1, options: [
        ...(!protectedIds.length ? [{ target: { type: "PLAYER" as const, player: oppositeTurn(controller) }, label: enemy.name }] : []),
        ...legalEnemy.map(option),
      ] }];
    case "BOUNCE_TARGET": return [group("Devolver a la mano", legalEnemy.filter(c => getEffectiveCardStats(c, enemy).attack <= 2))];
    case "UPGRADE_COMMON_TO_UNCOMMON":
      return [group("Criatura que evoluciona", own.hand.filter(c => isCreature(c) && c.rarity === "COMUN" &&
        cardCatalog.some(candidate => isCreature(candidate) && candidate.rarity === "INFRECUENTE" && candidate.attribute === c.attribute)))];
    case "SACRIFICE_DRAW": case "SACRIFICE_SEARCH_FIRE_MANA": return [group("Sacrificar", ownCreatures)];
    case "SEARCH_DRAGON_FROM_DECK": return [group("Elegir un dragón del mazo", own.deck.filter(c => isCreature(c) && c.subtypes.includes("DRAGON")))];
    case "DESTROY_LOW_COST_CREATURE_FROM_DECK": return [group("Destruir una criatura de tu mazo (opcional)", own.deck.filter(c => isCreature(c) && c.cost <= 2), 0, 1)];
    case "BOTH_SACRIFICE_DAMAGE": case "RITUAL_OTHER_CHOICE":
      return [group("Elegir tu sacrificio para el ritual", ownCreatures, ownCreatures.length ? 1 : 0, ownCreatures.length ? 1 : 0)];
    case "SACRIFICE_FIRE_DRAW_DAMAGE": case "SACRIFICE_FIRE_DRAW_DRAGON_BONUS":
      return [group("Sacrificar una criatura de fuego", fire)];
    case "SACRIFICE_SEARCH_FIRE":
      return [group("Sacrificar una criatura de fuego", fire), group("Añadir a la mano desde el mazo", own.deck.filter(c => c.attribute === "FUEGO" && c.cost <= 6))];
    case "DESTROY_BOTH_FIELDS":
      return [group("Destruir en tu campo", ownCreatures), group("Destruir en el campo enemigo", legalEnemy)];
    case "DESTROY_LOW_DEFENSE": return [group("Destruir", legalEnemy.filter(c => getEffectiveCardStats(c, enemy).defense <= 4))];
    case "NEGATE_AND_DESTROY": return [group("Negar y destruir", legalEnemy)];
    case "SUMMON_FROM_GRAVEYARD":
      return [group("Invocar desde el cementerio", getFieldPositions(own.field).length ? own.graveyard.filter(c => ["Dragón Volcánico", "Dragón Volcánico Ancestral"].includes(c.name)) : [])];
    case "SUMMON_LOW_COST_FROM_GRAVEYARD":
      return [group("Invocar desde el cementerio", getFieldPositions(own.field).length ? own.graveyard.filter(c => isCreature(c) && c.attribute === "FUEGO" && c.cost <= 3) : [])];
    case "DRAW_CHOICE_LEGENDARY": return [group("Buscar en el mazo", legendary)];
    case "DRAW_LOW_COST_FIRE": return [group("Buscar en el mazo", own.deck.filter(c => isCreature(c) && c.attribute === "FUEGO" && c.cost <= 2))];
    case "SEARCH_LEGENDARY_IF_WAR_DRAGON":
      return [group("Buscar en el mazo", own.field.some(c => c.name === "Dragón de Guerra Volcánico") ? legendary : [])];
    case "REQUIRES_SACRIFICE": return [group("Sacrificio de invocación", ownCreatures.filter(c => c.name === "Dragón de Guerra Volcánico"))];
    case "REQUIRES_2_FIRE_SACRIFICE": return [group("Sacrificios de invocación", fire, 2, 2)];
    case "FORCE_BLOCK": return [group("Obligar a bloquear (hasta 3)", legalEnemy, 0, Math.min(3, legalEnemy.length))];
    case "PLAY_FIELD_ALTERERS_FREE": {
      const cards = own.hand.filter(c => c.cardType === "ALTERADOR" && canPlaceUniqueField(c, own.field));
      return [group("Jugar alteradores gratis", cards, 0, cards.length)];
    }
    default: return [];
  }
};
export const getEffectTargetOptions = (ability: GameAbility, state: EffectState, controller: Turn, source: GameCard) =>
  getEffectSelectionGroups(ability, state, controller, source).flatMap(g => g.options.map(o => ({ ...o, group: g.label })));
export const hasValidSelection = (groups: EffectSelectionGroup[]) => groups.every(g => g.options.length >= g.min);
export const isValidEffectTarget = (ability: GameAbility, state: EffectState, controller: Turn, source: GameCard, target: EffectTarget) => {
  const groups = getEffectSelectionGroups(ability, state, controller, source);
  if (target.type === "PLAYER") return groups.length === 1 && groups[0].options.some(o => o.target.type === "PLAYER" && o.target.player === target.player);
  const ids = targetIds(target);
  if (ids.length !== new Set(ids).size) return false;
  const available = new Set(groups.flatMap(g => g.options.flatMap(o => targetIds(o.target))));
  return ids.every(id => available.has(id)) && groups.every(g => {
    const options = new Set(g.options.flatMap(o => targetIds(o.target)));
    const count = ids.filter(id => options.has(id)).length;
    return count >= g.min && count <= g.max;
  });
};
export const chooseAutomaticTarget = (ability: GameAbility, state: EffectState, controller: Turn, source: GameCard): EffectTarget | undefined => {
  const groups = getEffectSelectionGroups(ability, state, controller, source);
  if (!hasValidSelection(groups)) return undefined;
  const enemy = getPlayer(state, oppositeTurn(controller));
  const value = (card?: GameCard) => card ? card.cost * 2 + (card.attack ?? 0) * 2 + (card.defense ?? 0) : 0;
  const ranked = groups.map(group => {
    const sacrifice = group.label.toLowerCase().includes("sacrific");
    const ownCost = sacrifice || group.label.toLowerCase().includes("en tu campo");
    const options = [...group.options].sort((a, b) => {
      const worth = (option: EffectTargetOption) => value(option.card) -
        (sacrifice && option.card?.abilities?.some(effect => effect.trigger === "ON_SACRIFICE") ? 30 : 0) -
        (ownCost && option.card?.abilities?.some(effect => effect.trigger === "ON_DEATH") ? 8 : 0);
      return ownCost ? worth(a) - worth(b) : worth(b) - worth(a);
    });
    return { ...group, options };
  });
  if (ranked.length === 1 && ranked[0].max === 1) {
    const options = ranked[0].options, player = options.find(option => option.target.type === "PLAYER");
    if (ability.effect === "DESTROY_LOW_COST_CREATURE_FROM_DECK") {
      const own = getPlayer(state, controller);
      const successor = options.find(option => option.card?.abilities?.some(a => a.trigger === "ON_DEATH" && a.effect === "DRAW_SPECIFIC_CARD_FROM_DECK") &&
        own.deck.some(card => card.name === VOLCANIC_DRAGON_SUCCESSORS[option.card!.name]));
      if (successor) return successor.target;
      const draw = own.deck.length > 1 ? options.find(option => option.card?.abilities?.some(a => a.trigger === "ON_DEATH" && a.effect === "DRAW_1")) : undefined;
      if (draw) return draw.target;
      const canRevive = [...own.field, ...own.hand].some(card => card.abilities?.some(a => a.effect === "SUMMON_LOW_COST_FROM_GRAVEYARD"));
      const useful = canRevive ? options.find(option => option.card && isCreature(option.card) && option.card.attribute === "FUEGO") : undefined;
      return useful?.target ?? { type: "CARDS", instanceIds: [] };
    }
    const amount = Number(ability.effect.match(/^DAMAGE_(\d)_TARGET$/)?.[1] ?? 0);
    if (amount && player && enemy.life <= amount) return player.target;
    if (amount) {
      const kill = options.find(option => option.card && getEffectiveCardStats(option.card, enemy).remainingDefense <= amount);
      return kill?.target ?? player?.target ?? options[0]?.target;
    }
    if (ability.effect === "UPGRADE_COMMON_TO_UNCOMMON") {
      return [...options].sort((a, b) => value(a.card) - value(b.card))[0]?.target;
    }
    return options[0]?.target;
  }
  return { type: "CARDS", instanceIds: ranked.flatMap(group => group.options.slice(0, group.max).flatMap(option => targetIds(option.target))) };
};
export const collectTriggeredAbilities = (state: EffectState, controller: Turn, trigger: AbilityTrigger, source?: GameCard): EffectRequest[] =>
  (source ? [source] : getPlayer(state, controller).field).flatMap(card => card.abilitiesDisabled ? [] :
    (card.abilities ?? []).filter(a => normalizeAbilityTrigger(a.trigger) === normalizeAbilityTrigger(trigger) && !isOptionalCombatEffect(a))
      .map(ability => ({ controller, source: card, ability })));
export const effectResult = (state: EffectState, logs: EffectLog[] = [], queue: EffectRequest[] = [], handled = true): EffectResult => ({
  ...state, handled, logs, queue, pendingDiscard: state.player.hand.length > MAX_HAND_SIZE ? "PLAYER" : undefined,
});
export const updateCard = (state: EffectState, turn: Turn, id: string, update: (c: GameCard) => GameCard): EffectState => {
  const own = getPlayer(state, turn);
  return setPlayer(state, turn, { ...own, field: own.field.map(c => c.instanceId === id ? update(c) : c) });
};
export const resetCardRuntime = (card: GameCard, instanceId = card.instanceId): GameCard => ({
  ...card, instanceId, canAttack: false, hasAttacked: false, isBlocked: false, isTapped: false,
  position: undefined, damageMarked: 0, attackBonusThisTurn: 0, defenseBonusThisTurn: 0,
  unblockableThisTurn: false, activatedThisTurn: false, isTemporary: false,
  permanentAttackBonus: 0, permanentDefenseBonus: 0, damagePreventionUsed: false,
  attacksMade: 0, forcedBlockerIds: [], abilitiesDisabled: false,
});
export const drawCards = (state: EffectState, controller: Turn, count: number): EffectResult => {
  let own = getPlayer(state, controller);
  const cards = own.deck.slice(0, count);
  own = { ...own, deck: own.deck.slice(cards.length), hand: [...own.hand, ...cards] };
  if (cards.length < count) own = { ...own, life: 0 };
  const logs = [createEffectLog(controller, { name: own.name }, "DRAW", own.name + " roba " + cards.length + " carta(s)." + (cards.length < count ? " No quedan cartas en el mazo." : ""), {
    targetName: own.name, targetController: controller, amount: cards.length,
  })];
  if (controller === "CPU" && own.hand.length > MAX_HAND_SIZE) {
    const discarded = [...own.hand].sort((a, b) => b.cost - a.cost).slice(0, own.hand.length - MAX_HAND_SIZE);
    own = { ...own, hand: own.hand.filter(c => !discarded.includes(c)), graveyard: [...own.graveyard, ...discarded] };
  }
  return effectResult(setPlayer(state, controller, own), logs);
};
export const destroyCards = (initial: EffectState, ids: string[], sacrifice = false): EffectResult => {
  let state = initial;
  const logs: EffectLog[] = [], queue: EffectRequest[] = [];
  const deaths: { card: GameCard; owner: Turn }[] = [];
  for (const owner of ["PLAYER", "CPU"] as Turn[]) {
    const own = getPlayer(state, owner), removed = own.field.filter(c => ids.includes(c.instanceId));
    deaths.push(...removed.map(card => ({ card, owner })));
    state = setPlayer(state, owner, { ...own, field: own.field.filter(c => !ids.includes(c.instanceId)), graveyard: [...own.graveyard, ...removed] });
  }
  for (const { card, owner } of deaths) {
    logs.push(createEffectLog(owner, card, sacrifice ? "SACRIFICE" : "DESTROY", card.name + (sacrifice ? " es sacrificado." : " es destruido."), {
      targetInstanceId: card.instanceId, targetName: card.name, targetController: owner, targetPosition: card.position,
    }));
    queue.push(...collectTriggeredAbilities(state, owner, "ON_DEATH", card));
    if (sacrifice) {
      queue.push(...collectTriggeredAbilities(state, owner, "ON_SACRIFICE", card));
      if (card.attribute === "FUEGO") queue.push(...collectTriggeredAbilities(state, owner, "ON_SACRIFICE_FIRE"));
      if (card.subtypes.includes("DRAGON")) queue.push(...collectTriggeredAbilities(state, owner, "ON_SACRIFICE_DRAGON"));
      for (const watcher of getPlayer(state, owner).field.filter(c => hasAbility(c, "DAMAGE_ON_SACRIFICE"))) {
        const amount = getEffectiveCardStats(card, getPlayer(initial, owner)).attack, enemy = getPlayer(state, oppositeTurn(owner));
        state = setPlayer(state, oppositeTurn(owner), { ...enemy, life: Math.max(0, enemy.life - amount) });
        logs.push(createEffectLog(owner, watcher, "DAMAGE_ON_SACRIFICE", watcher.name + " inflige " + amount + " de daño por el sacrificio de " + card.name + ".", {
          amount, targetName: enemy.name, targetController: oppositeTurn(owner), before: enemy.life,
          after: Math.max(0, enemy.life - amount), stat: "LIFE", damageType: "EFFECT",
        }));
      }
    } else if (isCreature(card) && card.attribute === "FUEGO") {
      for (const observerOwner of ["PLAYER", "CPU"] as Turn[]) queue.push(...collectTriggeredAbilities(state, observerOwner, "ON_FIRE_DESTROYED"));
    }
  }
  const collateral = [...state.player.field, ...state.cpu.field].filter(c =>
    isCreature(c) && getEffectiveCardStats(c, getPlayer(state, getCardOwner(state, c.instanceId)!)).remainingDefense <= 0);
  if (collateral.length) {
    const resolved = destroyCards(state, collateral.map(c => c.instanceId));
    return effectResult(resolved, [...logs, ...resolved.logs], [...queue, ...resolved.queue]);
  }
  return effectResult(state, logs, queue);
};
/** Destruction from the deck resolves the card's death effects, without summoning or sacrificing it. */
export const destroyDeckCards = (initial: EffectState, controller: Turn, ids: string[]): EffectResult => {
  const own = getPlayer(initial, controller), selected = own.deck.filter(card => ids.includes(card.instanceId));
  const state = setPlayer(initial, controller, { ...own, deck: own.deck.filter(card => !ids.includes(card.instanceId)), graveyard: [...own.graveyard, ...selected] });
  const logs = selected.map(card => createEffectLog(controller, card, "DESTROY_FROM_DECK", card.name + " es destruida desde el mazo y enviada al cementerio.", {
    targetInstanceId: card.instanceId, targetName: card.name, targetController: controller, targetZone: "DECK", amount: 1,
  }));
  const queue = selected.flatMap(card => {
    const effects = collectTriggeredAbilities(state, controller, "ON_DEATH", card);
    if (isCreature(card) && card.attribute === "FUEGO") {
      for (const owner of ["PLAYER", "CPU"] as Turn[]) effects.push(...collectTriggeredAbilities(state, owner, "ON_FIRE_DESTROYED"));
    }
    return effects;
  });
  return effectResult(state, logs, queue);
};

export interface DamageEvent {
  target: EffectTarget; amount: number; controller: Turn; source: GameCard; combat?: boolean;
  ability?: Pick<GameAbility, "name" | "trigger">;
}
export const applyDamageBatch = (initial: EffectState, events: DamageEvent[]): EffectResult => {
  let state = initial;
  const logs: EffectLog[] = [], queue: EffectRequest[] = [];
  const damaged = new Map<string, { card: GameCard; owner: Turn }>();
  for (const event of events) {
    const amount = Math.max(0, event.amount);
    if (!amount) continue;
    if (event.target.type === "PLAYER") {
      const owner = event.target.player, own = getPlayer(state, owner);
      state = setPlayer(state, owner, { ...own, life: Math.max(0, own.life - amount) });
      logs.push(createEffectLog(event.controller, event.source, "DAMAGE", event.source.name + " inflige " + amount + " de daño a " + own.name + ".", {
        abilityName: event.ability?.name, trigger: event.ability?.trigger, amount,
        targetName: own.name, targetController: owner, before: own.life,
        after: Math.max(0, own.life - amount), stat: "LIFE", damageType: event.combat ? "COMBAT" : "EFFECT",
      }));
      if (event.combat) queue.push(...collectTriggeredAbilities(state, event.controller, "ON_COMBAT_DAMAGE", event.source));
      continue;
    }
    if (event.target.type !== "CARD") continue;
    const targetId = event.target.instanceId, owner = getCardOwner(state, targetId);
    if (!owner) continue;
    const own = getPlayer(state, owner), card = own.field.find(c => c.instanceId === targetId)!;
    const before = getEffectiveCardStats(card, own).remainingDefense;
    const details: Partial<EffectLog> = {
      originName: event.source.name, originInstanceId: event.source.instanceId,
      abilityName: event.ability?.name, trigger: event.ability?.trigger, amount,
      targetInstanceId: card.instanceId, targetName: card.name, targetController: owner, targetPosition: card.position,
      before, after: Math.max(0, before - amount), stat: "DEFENSE", damageType: event.combat ? "COMBAT" : "EFFECT",
    };
    if (!event.combat && event.source.cardType === "HECHIZO" && hasKeyword(card, own, "SPELL_IMMUNITY")) {
      const protection = card.abilities?.find(a => a.effect === "SPELL_IMMUNITY")?.name ?? "Protección de metal de Armonía";
      logs.push(createEffectLog(owner, card, "SPELL_IMMUNITY", card.name + " ignora el hechizo de " + event.source.name + " gracias a " + protection + ".", {
        ...details, abilityName: protection, trigger: "CONTINUO", after: before, outcome: "PREVENTED",
      })); continue;
    }
    if (hasKeyword(card, own, "FIRST_DAMAGE_NEGATED") && !card.damagePreventionUsed) {
      state = updateCard(state, owner, card.instanceId, c => ({ ...c, damagePreventionUsed: true }));
      const protection = card.abilities?.find(a => a.effect === "FIRST_DAMAGE_NEGATED")?.name ?? "Protección de agua de Armonía";
      logs.push(createEffectLog(owner, card, "FIRST_DAMAGE_NEGATED", card.name + " evita " + amount + " de daño de " + event.source.name + " con " + protection + ".", {
        ...details, abilityName: protection, trigger: "DAMAGE_PREVENTION", after: before, outcome: "PREVENTED",
      })); continue;
    }
    state = updateCard(state, owner, card.instanceId, c => ({ ...c, damageMarked: (c.damageMarked ?? 0) + amount }));
    damaged.set(card.instanceId, { card, owner });
    logs.push(createEffectLog(event.controller, event.source, "DAMAGE", event.source.name + " inflige " + amount + " de daño a " + card.name + ".", details));
    if (event.combat) queue.push(...collectTriggeredAbilities(state, event.controller, "ON_COMBAT_DAMAGE", event.source));
  }
  for (const { card, owner } of damaged.values()) queue.push(...collectTriggeredAbilities(state, owner, "ON_DAMAGE", card));
  const lethal = [...state.player.field, ...state.cpu.field].filter(c => {
    const owner = getCardOwner(state, c.instanceId)!;
    return isCreature(c) && getEffectiveCardStats(c, getPlayer(state, owner)).remainingDefense <= 0;
  });
  const destroyed = destroyCards(state, lethal.map(c => c.instanceId));
  for (const event of events.filter(e => e.combat && e.target.type === "CARD")) {
    if (lethal.some(c => c.instanceId === (event.target as { instanceId: string }).instanceId) &&
        getCardOwner(destroyed, event.source.instanceId)) queue.push(...collectTriggeredAbilities(destroyed, event.controller, "ON_DESTROY_ENEMY", event.source));
  }
  return effectResult(destroyed, [...logs, ...destroyed.logs], [...queue, ...destroyed.queue]);
};
export const summonFromZone = (state: EffectState, controller: Turn, card: GameCard, zone: "deck" | "graveyard" | "hand"): EffectResult => {
  const own = getPlayer(state, controller), position = getFieldPositions(own.field)[0];
  if (!canPlaceUniqueField(card, own.field)) return effectResult(state, [createEffectLog(controller, card, "UNIQUE_ACTIVE_FIELD", "Ya controlas un " + card.name + " activo.", { outcome: "SKIPPED" })]);
  if (isCreature(card) && position === undefined) return effectResult(state, [createEffectLog(controller, card, "NO_SPACE", "No hay espacio para invocar " + card.name + ".")]);
  const placed = { ...resetCardRuntime(card), position: isCreature(card) ? position : undefined };
  const next = setPlayer(state, controller, { ...own, [zone]: own[zone].filter(c => c.instanceId !== card.instanceId), field: [...own.field, placed] });
  const passiveLogs = continuous(placed).map(a => createEffectLog(controller, placed, a.effect, placed.name + ": " + a.description, {
    abilityName: a.name, trigger: a.trigger, targetInstanceId: placed.instanceId, targetName: placed.name,
    targetController: controller, targetPosition: placed.position,
  }));
  return effectResult(next, [createEffectLog(controller, placed, "SUMMON", placed.name + " entra al campo.", {
    targetInstanceId: placed.instanceId, targetName: placed.name, targetController: controller, targetPosition: placed.position,
  }), ...passiveLogs], collectTriggeredAbilities(next, controller, "ON_ENTER", placed));
};
