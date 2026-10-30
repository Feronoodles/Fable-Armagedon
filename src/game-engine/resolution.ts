import type { AbilityContext, AbilityTrigger, EffectLog, EffectRequest, EffectTarget, GameAbility } from "./abilities";
import { generateInstanceId } from "./setup";
import { cardCatalog, VOLCANIC_DRAGON_SUCCESSORS } from "./catalog";
import type { GameCard, Turn } from "./types";
import { MAX_HAND_SIZE } from "./types";
import {
  applyDamageBatch, collectTriggeredAbilities, createEffectLog, destroyCards, destroyDeckCards, drawCards,
  effectResult, getCardOwner, getEffectiveCardStats, getElements, getFieldPositions, getPlayer,
  hasKeyword, isCreature, isMana, isValidEffectTarget, normal, oppositeTurn, requiresTarget,
  resetCardRuntime, setPlayer, subtypeOf, summonFromZone, targetIds, updateCard, PASSIVE_EFFECTS,
} from "./rules";
import type { EffectResult, EffectState } from "./rules";

export const resolveGameAbility = (ability: GameAbility, context: AbilityContext): EffectResult => {
  let state: EffectState = { player: context.player, cpu: context.cpu };
  const { source, controller } = context, opponentTurn = oppositeTurn(controller);
  let own = getPlayer(state, controller), enemy = getPlayer(state, opponentTurn);
  const logs: EffectLog[] = [], queue: EffectRequest[] = [], ids = targetIds(context.target);
  const finish = (message: string, handled = true, details: Partial<EffectLog> = {}) => effectResult(state,
    message ? [...logs, createEffectLog(controller, source, ability.effect, message, { abilityName: ability.name, trigger: ability.trigger, ...details })] : logs, queue, handled);
  const merge = (resolved: EffectResult) => {
    state = { player: resolved.player, cpu: resolved.cpu };
    logs.push(...resolved.logs.map(log => ({
      ...log, originName: log.originName ?? source.name, originInstanceId: log.originInstanceId ?? source.instanceId,
      abilityName: log.abilityName ?? ability.name, trigger: log.trigger ?? ability.trigger,
    })));
    queue.push(...resolved.queue);
    own = getPlayer(state, controller); enemy = getPlayer(state, opponentTurn);
  };
  const damage = (targets: EffectTarget[], amount: number) => merge(applyDamageBatch(state, targets.map(target => ({ target, amount, source, controller, ability }))));
  const changeSource = (fn: (c: GameCard) => GameCard) => { state = updateCard(state, controller, source.instanceId, fn); own = getPlayer(state, controller); };
  const take = (card?: GameCard) => {
    if (!card) return;
    state = setPlayer(state, controller, { ...own, deck: own.deck.filter(c => c.instanceId !== card.instanceId), hand: [...own.hand, resetCardRuntime(card)] });
    own = getPlayer(state, controller);
    logs.push(createEffectLog(controller, source, ability.effect, source.name + " añade " + card.name + " del mazo a la mano.", {
      abilityName: ability.name, trigger: ability.trigger, targetInstanceId: card.instanceId, targetName: card.name, targetController: controller, targetZone: "HAND", amount: 1,
    }));
  };
  if (requiresTarget(ability) && context.target && !isValidEffectTarget(ability, state, controller, source, context.target)) return finish("El objetivo de " + ability.name + " ya no es válido.", false);
  if (requiresTarget(ability) && !context.target) return finish("No hay objetivo para " + ability.name + ".", false);
  switch (ability.effect) {
    case "DESTROY_LOW_COST_CREATURE_FROM_DECK": {
      const chosen = own.deck.find(card => ids.includes(card.instanceId) && isCreature(card) && card.cost <= 2);
      if (!chosen) return finish(source.name + " no destruye ninguna criatura de su mazo.", true, { outcome: "SKIPPED" });
      merge(destroyDeckCards(state, controller, [chosen.instanceId]));
      return finish("");
    }
    case "DRAW_1": merge(drawCards(state, controller, 1)); return finish("");
    case "DAMAGE_1_PLAYER": case "DAMAGE_2_PLAYER": case "LIFE_LOSS_2":
      damage([{ type: "PLAYER", player: opponentTurn }], ability.effect === "DAMAGE_1_PLAYER" ? 1 : 2); return finish("");
    case "DAMAGE_2_TARGET": case "DAMAGE_3_TARGET":
      damage([context.target!], ability.effect === "DAMAGE_2_TARGET" ? 2 : 3); return finish("");
    case "DAMAGE_2_ALL_ENEMIES": case "DAMAGE_2_NON_FIRE": case "DAMAGE_3_ALL": {
      const all = ability.effect === "DAMAGE_2_ALL_ENEMIES" ? enemy.field : [...own.field, ...enemy.field];
      const cards = all.filter(c => isCreature(c) && (ability.effect !== "DAMAGE_2_NON_FIRE" || c.attribute !== "FUEGO"));
      const targets: EffectTarget[] = cards.map(c => ({ type: "CARD", instanceId: c.instanceId }));
      if (ability.effect === "DAMAGE_3_ALL" && source.name === "Rex Volcánico Biomecánico") targets.push({ type: "PLAYER", player: "PLAYER" }, { type: "PLAYER", player: "CPU" });
      damage(targets, ability.effect === "DAMAGE_3_ALL" ? 3 : 2);
      return finish(source.name + " resuelve su daño en área.");
    }
    case "BOUNCE_TARGET": case "BOUNCE_DRAW": {
      const cards = enemy.field.filter(c => isCreature(c) && (ability.effect === "BOUNCE_TARGET" ? ids.includes(c.instanceId) : getEffectiveCardStats(c, enemy).attack <= 3) &&
        !(source.cardType === "HECHIZO" && hasKeyword(c, enemy, "SPELL_IMMUNITY")));
      state = setPlayer(state, opponentTurn, { ...enemy, field: enemy.field.filter(c => !cards.includes(c)), hand: [...enemy.hand, ...cards.map(c => resetCardRuntime(c))] });
      if (opponentTurn === "CPU") {
        const cpu = getPlayer(state, "CPU"), excess = Math.max(0, cpu.hand.length - MAX_HAND_SIZE);
        state = setPlayer(state, "CPU", { ...cpu, hand: cpu.hand.slice(excess), graveyard: [...cpu.graveyard, ...cpu.hand.slice(0, excess)] });
      }
      if (ability.effect === "BOUNCE_DRAW" && cards.length) merge(drawCards(state, controller, cards.length));
      return finish(source.name + " devuelve " + cards.length + " criatura(s) a la mano.");
    }
    case "UPGRADE_COMMON_TO_UNCOMMON": {
      const selected = own.hand.find(c => ids.includes(c.instanceId));
      if (!selected) return finish("No se pudo evolucionar la carta.", false);
      const candidates = cardCatalog.filter(c => isCreature(c) && c.rarity === "INFRECUENTE" && c.attribute === selected.attribute);
      const replacement = candidates[Math.floor((context.rng ?? Math.random)() * candidates.length)];
      if (!replacement) return finish("No existe una evolución compatible.", false);
      const evolved = resetCardRuntime({ ...replacement, id: "evolved-" + normal(replacement.name), instanceId: selected.instanceId });
      state = setPlayer(state, controller, { ...own, hand: own.hand.map(c => c.instanceId === selected.instanceId ? evolved : c) });
      return finish(selected.name + " evoluciona a " + replacement.name + ".");
    }
    case "CONVERT_MANA_RANDOM": {
      const mana = own.manaZone.find(c => !c.isTapped);
      if (!mana) return finish("No hay maná disponible para convertir.", false);
      const elements = ["FUEGO", "AGUA", "NATURALEZA", "RAYO", "VACIO", "NORMAL", "TIERRA", "METAL"].filter(e => e !== mana.attribute);
      const element = elements[Math.floor((context.rng ?? Math.random)() * elements.length)];
      const generated: GameCard = { id: "generated", instanceId: generateInstanceId(), name: "Maná " + element, cost: 0, cardType: "MANA", rarity: "COMUN", manaTypes: [element], attribute: element, subtypes: [], isTemporary: true, isTapped: false };
      state = setPlayer(state, controller, { ...own, manaZone: [...own.manaZone.map(c => c.instanceId === mana.instanceId ? { ...c, isTapped: true } : c), generated] });
      return finish(source.name + " convierte 1 maná en " + element + ".");
    }
    case "BUFF_IF_ATTRIBUTE_PRESENT":
      if (own.field.some(c => c.instanceId !== source.instanceId && isCreature(c) && c.attribute === source.attribute)) {
        changeSource(c => ({ ...c, attackBonusThisTurn: (c.attackBonusThisTurn ?? 0) + 1 }));
        return finish(source.name + " gana +1 ATQ este turno.");
      }
      return finish(source.name + " no tiene otra criatura de su elemento.");
    case "BUFF_WHEN_DAMAGED": case "TEMP_ATK_BUFF": {
      const current = own.field.find(c => c.instanceId === source.instanceId);
      if (!current) return finish(source.name + " ya salió del campo; no recibe el bono.", true, { outcome: "SKIPPED" });
      const before = getEffectiveCardStats(current, own).attack;
      changeSource(c => ({ ...c, attackBonusThisTurn: (c.attackBonusThisTurn ?? 0) + 2 }));
      return finish(source.name + " gana +2 ATQ hasta el final del turno.", true, {
        targetInstanceId: current.instanceId, targetName: current.name, targetController: controller,
        targetPosition: current.position, amount: 2, before, after: before + 2, stat: "ATTACK",
      });
    }
    case "PERMANENT_ATK_BUFF":
      changeSource(c => ({ ...c, permanentAttackBonus: (c.permanentAttackBonus ?? 0) + 1 }));
      return finish(source.name + " gana +1 ATQ permanente.");
    case "LIFE_GAIN_PER_SUBTYPE": case "LIFE_GAIN_PER_ELEMENT": {
      const subtype = subtypeOf(ability), perCreature = /por cada|per /i.test(ability.description);
      const count = ability.effect === "LIFE_GAIN_PER_ELEMENT" ? getElements(own).size :
        perCreature ? own.field.filter(c => isCreature(c) && c.subtypes.includes(subtype ?? "")).length :
        Number(own.field.some(c => c.instanceId !== source.instanceId && isCreature(c) && c.subtypes.includes(subtype ?? "")));
      const life = Math.min(own.maxLife, own.life + count);
      state = setPlayer(state, controller, { ...own, life });
      return finish(source.name + " recupera " + (life - own.life) + " vida(s).", true, {
        targetName: own.name, targetController: controller, amount: life - own.life, before: own.life, after: life, stat: "LIFE",
      });
    }
    case "SUMMON_SAME_CARD_FROM_DECK": {
      const next = own.deck.find(c => c.name === source.name);
      if (next && getFieldPositions(own.field).length) merge(summonFromZone(state, controller, next, "deck"));
      return finish(next ? source.name + " invoca otra copia desde el mazo." : "No quedan copias de " + source.name + " en el mazo.");
    }
    case "DRAW_SPECIFIC_CARD_FROM_DECK": {
      const name = VOLCANIC_DRAGON_SUCCESSORS[source.name], card = own.deck.find(c => c.name === name);
      take(card); return finish(card ? "" : "No queda " + name + " en el mazo.");
    }
    case "DRAW_CHOICE_LEGENDARY": case "DRAW_LOW_COST_FIRE": case "SEARCH_LEGENDARY_IF_WAR_DRAGON":
      take(own.deck.find(c => ids.includes(c.instanceId))); return finish("");
    case "SEARCH_DRAGON_FROM_DECK":
      take(own.deck.find(c => ids.includes(c.instanceId) && isCreature(c) && c.subtypes.includes("DRAGON"))); return finish("");
    case "SACRIFICE_SEARCH_FIRE_MANA": {
      const sacrifice = own.field.find(c => ids.includes(c.instanceId) && isCreature(c));
      if (!sacrifice) return finish("Falta una criatura para sacrificar.", false);
      merge(destroyCards(state, [sacrifice.instanceId], true));
      const mana = own.deck.find(c => isMana(c) && c.name === "Mana de Fuego");
      take(mana);
      return finish(mana ? source.name + " transforma el sacrificio de " + sacrifice.name + " en un Mana de Fuego para tu mano." : source.name + ": no queda Mana de Fuego en el mazo.");
    }
    case "DESTROY_OWN_FIELD_SEARCH_DRAGON": {
      const victims = own.field.filter(c => isCreature(c) || c.cardType === "ALTERADOR");
      merge(destroyCards(state, victims.map(c => c.instanceId)));
      queue.unshift({ controller, source, reactionChecked: true, ability: {
        name: ability.name, description: "Elige 1 criatura DRAGON de tu mazo y añádela a tu mano.",
        trigger: "ON_DEATH", effect: "SEARCH_DRAGON_FROM_DECK",
      } });
      return finish(source.name + " destruye tus criaturas y cartas de campo. Tus fuentes de maná se conservan; después eliges un dragón del mazo.");
    }
    case "SACRIFICE_DRAW": case "SACRIFICE_FIRE_DRAW_DAMAGE": case "SACRIFICE_FIRE_DRAW_DRAGON_BONUS": case "SACRIFICE_SEARCH_FIRE": {
      const sacrifice = own.field.find(c => ids.includes(c.instanceId));
      if (!sacrifice) return finish("Falta una criatura para sacrificar.", false);
      const search = own.deck.find(c => ids.includes(c.instanceId));
      merge(destroyCards(state, [sacrifice.instanceId], true));
      if (ability.effect === "SACRIFICE_SEARCH_FIRE") take(search);
      else merge(drawCards(state, controller, ability.effect === "SACRIFICE_FIRE_DRAW_DRAGON_BONUS" ? 2 : 1));
      if (ability.effect === "SACRIFICE_FIRE_DRAW_DAMAGE" || (ability.effect === "SACRIFICE_FIRE_DRAW_DRAGON_BONUS" && sacrifice.subtypes.includes("DRAGON"))) damage([{ type: "PLAYER", player: opponentTurn }], 2);
      return finish(source.name + " completa el sacrificio de " + sacrifice.name + ".");
    }
    case "REQUIRES_SACRIFICE": case "REQUIRES_2_FIRE_SACRIFICE":
      merge(destroyCards(state, ids, true)); return finish(source.name + " cumple su condición de invocación.");
    case "DESTROY_BOTH_FIELDS": case "DESTROY_LOW_DEFENSE": case "NEGATE_AND_DESTROY":
      merge(destroyCards(state, ids)); return finish(source.name + (ability.effect === "NEGATE_AND_DESTROY" ? " niega y destruye el objetivo." : " destruye el objetivo."));
    case "SUMMON_FROM_GRAVEYARD": case "SUMMON_LOW_COST_FROM_GRAVEYARD": {
      const card = own.graveyard.find(c => ids.includes(c.instanceId));
      if (card) merge(summonFromZone(state, controller, card, "graveyard"));
      return finish("");
    }
    case "BUFF_IF_3_FIRE":
      if (own.field.filter(c => isCreature(c) && c.attribute === "FUEGO").length >= 3) {
        state = setPlayer(state, controller, { ...own, field: own.field.map(c => ids.includes(c.instanceId) ? { ...c, attackBonusThisTurn: (c.attackBonusThisTurn ?? 0) + 3 } : c) });
        return finish("La criatura resucitada gana +3 ATQ este turno.");
      }
      return finish("Poder del Volcán requiere 3 criaturas de fuego.");
    case "PERMANENT_ATK_FIRE_SURVIVORS":
      for (const owner of ["PLAYER", "CPU"] as Turn[]) {
        const p = getPlayer(state, owner);
        state = setPlayer(state, owner, { ...p, field: p.field.map(c => isCreature(c) && c.attribute === "FUEGO" ? { ...c, permanentAttackBonus: (c.permanentAttackBonus ?? 0) + 1 } : c) });
      }
      return finish("Las criaturas de fuego supervivientes ganan +1 ATQ permanente.");
    case "REDUCE_ATK_DESTROY_ZERO": {
      for (const owner of ["PLAYER", "CPU"] as Turn[]) {
        const p = getPlayer(state, owner);
        state = setPlayer(state, owner, { ...p, field: p.field.map(c => isCreature(c) && !(source.cardType === "HECHIZO" && hasKeyword(c, p, "SPELL_IMMUNITY")) ? { ...c, attackBonusThisTurn: (c.attackBonusThisTurn ?? 0) - 2 } : c) });
      }
      const zero = [...state.player.field, ...state.cpu.field].filter(c => isCreature(c) && getEffectiveCardStats(c, getPlayer(state, getCardOwner(state, c.instanceId)!)).attack === 0 &&
        !hasKeyword(c, getPlayer(state, getCardOwner(state, c.instanceId)!), "SPELL_IMMUNITY"));
      merge(destroyCards(state, zero.map(c => c.instanceId)));
      return finish("Las criaturas pierden 2 ATQ este turno; se destruyen las que llegan a 0.");
    }
    case "BOTH_SACRIFICE_DAMAGE": {
      queue.push({ controller: opponentTurn, source, reactionChecked: true, ability: {
        ...ability, effect: "RITUAL_OTHER_CHOICE", selectedIds: ids, originalController: controller,
      } });
      return finish("Cada jugador elige una criatura para sacrificar.");
    }
    case "RITUAL_OTHER_CHOICE": {
      const selectedIds = [...(ability.selectedIds ?? []), ...ids];
      const sacrificed = [...own.field, ...enemy.field].filter(c => selectedIds.includes(c.instanceId));
      merge(destroyCards(state, sacrificed.map(c => c.instanceId), true));
      merge(applyDamageBatch(state, (["PLAYER", "CPU"] as Turn[]).map(player => ({
        source, controller: ability.originalController ?? controller,
        target: { type: "PLAYER", player }, amount: sacrificed.length * 2,
      }))));
      return finish("Cada jugador sacrifica una criatura y recibe " + sacrificed.length * 2 + " de daño.");
    }
    case "DESTROY_ALL_MONSTERS": case "DESTROY_ALL_BUFF_SELF": {
      const cards = [...own.field, ...enemy.field].filter(c => isCreature(c) && (ability.effect !== "DESTROY_ALL_BUFF_SELF" || c.instanceId !== source.instanceId));
      merge(destroyCards(state, cards.map(c => c.instanceId)));
      if (ability.effect === "DESTROY_ALL_BUFF_SELF") changeSource(c => ({ ...c, permanentAttackBonus: (c.permanentAttackBonus ?? 0) + cards.length }));
      return finish(source.name + " destruye " + cards.length + " criaturas.");
    }
    case "DESTROY_ALL_FIELD_ALTERERS": {
      const cards = [...own.field, ...enemy.field].filter(c => c.cardType === "ALTERADOR");
      merge(destroyCards(state, cards.map(c => c.instanceId)));
      return finish(source.name + " destruye todos los alteradores de campo.");
    }
    case "PLAY_FIELD_ALTERERS_FREE":
      for (const id of ids) {
        const card = getPlayer(state, controller).hand.find(c => c.instanceId === id);
        if (card?.cardType === "ALTERADOR") merge(summonFromZone(state, controller, card, "hand"));
      }
      return finish(source.name + " juega " + ids.length + " alterador(es) sin pagar maná.");
    case "FORCE_BLOCK":
      changeSource(c => ({ ...c, forcedBlockerIds: ids }));
      return finish(source.name + " obliga a bloquear a " + ids.length + " criatura(s).");
    case "UNBLOCKABLE_OPTION":
      changeSource(c => ({ ...c, unblockableThisTurn: true }));
      return finish(source.name + " no puede ser bloqueado este turno.");
    default:
      if (PASSIVE_EFFECTS.has(ability.effect) || ability.effect === "FIRST_DAMAGE_NEGATED" ||
        /^GENERATE_(FIRE|WATER|NATURE|LIGHTNING|VOID|COLORLESS|EARTH|METAL)(?:_OR_(?:LEGENDARY|CELESTIAL))?_MANA$/.test(ability.effect)) return finish(source.name + ": " + ability.description);
      return finish("Efecto no reconocido: " + ability.effect + ".", false);
  }
};
export const resolveTriggeredAbilities = (state: EffectState, controller: Turn, trigger: AbilityTrigger, source?: GameCard, cardPool: GameCard[] = [], rng: () => number = Math.random): EffectResult => {
  let current = effectResult(state);
  for (const request of collectTriggeredAbilities(state, controller, trigger, source)) {
    if (requiresTarget(request.ability)) { current.queue.push(request); continue; }
    const next = resolveGameAbility(request.ability, { ...request, player: current.player, cpu: current.cpu, cardPool, rng });
    current = effectResult(next, [...current.logs, ...next.logs], [...current.queue, ...next.queue], current.handled && next.handled);
  }
  return current;
};
