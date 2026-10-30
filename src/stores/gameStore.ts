import { create } from "zustand";
import { spendManaFromZone } from "@/game-engine/mana";
import { createEmptyPlayer, createInitialPlayers } from "@/game-engine/setup";
import {
  collectTriggeredAbilities, createEffectLog, destroyCards, drawCards, effectResult,
  getEffectiveCost, getEffectSelectionGroups, getPlayer, getUnblockableAbility,
  hasAbility, hasValidSelection, isCreature, isMana, isValidEffectTarget, oppositeTurn,
  requiresTarget, resolveGameAbility, setPlayer, summonFromZone,
} from "@/game-engine/effects";
import type { EffectResult } from "@/game-engine/effects";
import { canAttackNow, determineBattleWinner, resolveAttackStep, selectBlockers } from "@/game-engine/battle-combat";
import { getPlayCondition, getPlayRestriction, getPlayTargetAbility } from "@/game-engine/battle-actions";
import { getNextTurnState, resetFieldForNewTurn, resetManaZoneForNewTurn, shouldSkipCombatPhase } from "@/game-engine/turns";
import { chooseAutomaticTarget } from "@/game-engine/rules";
import { createBattlePresentations, describeStatChanges } from "@/game-engine/battle-presentation";
import type { BattlePresentation } from "@/game-engine/battle-presentation";
import { COMBAT_CLASH_DURATION_MS, type CombatAnimation } from "@/game-engine/combat-animation";
import type { EffectLog, EffectRequest, EffectTarget, PendingEffect } from "@/game-engine/abilities";
import { CardDefinition, GameCard, GamePhase, MAX_HAND_SIZE, Player, Turn } from "@/game-engine/types";

export type { CardDefinition, GameCard, Player, GamePhase, Turn } from "@/game-engine/types";
export type { EffectLog, EffectTarget, PendingEffect } from "@/game-engine/abilities";
export interface PendingCombatChoice {
  controller: Turn; card: GameCard; opponent?: GameCard; resolve: (value: boolean) => void;
}
export interface GameState {
  gameStarted: boolean; gameEnded: boolean; winner: Turn | "DRAW" | null;
  turn: Turn; turnNumber: number; phase: GamePhase;
  player: Player; cpu: Player; selectedCard: GameCard | null; selectedTarget: GameCard | null;
  attackingCards: string[]; playedManaThisTurn: Record<Turn, boolean>;
  combatPosition: number | null; isCombatAnimation: boolean; combatAnimation: CombatAnimation | null; destroyingCards: string[];
  pendingDiscard: Turn | null; pendingEffect: PendingEffect | null;
  pendingCombatChoice: PendingCombatChoice | null; effectLog: EffectLog[]; effectQueue: EffectRequest[];
  presentationEnabled: boolean; presentationQueue: BattlePresentation[];
  setPresentationEnabled: (enabled: boolean) => void; finishPresentation: (id: string) => void;
  startGame: (playerDeck: CardDefinition[], cpuDeck: CardDefinition[]) => void;
  drawCard: (player: Turn) => void;
  playCard: (player: Turn, cardId: string, position?: number) => void;
  playManaCard: (player: Turn, cardId: string) => void;
  activateAbility: (player: Turn, cardId: string) => void;
  resolvePendingEffect: (target: EffectTarget) => void; cancelPendingEffect: () => void;
  chooseCombatOption: (value: boolean) => void; executeAutoCombat: () => Promise<void>;
  nextPhase: () => void; endTurn: () => void;
  selectCard: (card: GameCard | null) => void; discardCard: (player: Turn, cardId: string) => void;
  tapCard: (player: Turn, cardId: string) => void; dealDamage: (player: Turn, amount: number) => void;
  destroyCard: (player: Turn, cardId: string) => void; resetGame: () => void;
}
const initialState = () => ({
  gameStarted: false, gameEnded: false, winner: null, turn: "PLAYER" as Turn, turnNumber: 1, phase: "DRAW" as GamePhase,
  player: createEmptyPlayer("player", "Jugador"), cpu: createEmptyPlayer("cpu", "CPU"),
  selectedCard: null, selectedTarget: null, attackingCards: [], playedManaThisTurn: { PLAYER: false, CPU: false },
  combatPosition: null, isCombatAnimation: false, combatAnimation: null, destroyingCards: [], pendingDiscard: null,
  pendingEffect: null, pendingCombatChoice: null, effectLog: [], effectQueue: [],
  presentationEnabled: false, presentationQueue: [] as BattlePresentation[],
});
export const useGameStore = create<GameState>((set, get) => {
  let session = 0, draining = false, combatSequence = 0;
  const wait = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
  const logsWithContext = (logs: EffectLog[]) => logs.map(log => ({
    ...log, batchId: log.batchId ?? logs[0]?.id,
    turn: log.turn ?? get().turnNumber, phase: log.phase ?? get().phase,
  }));
  const appendLogs = (logs: EffectLog[]) => [...get().effectLog, ...logsWithContext(logs)].slice(-300);
  const commit = (resolved: EffectResult) => {
    const previous = get();
    let cpu = resolved.cpu;
    if (cpu.hand.length > MAX_HAND_SIZE) {
      const removed = [...cpu.hand].sort((a, b) => b.cost - a.cost).slice(0, cpu.hand.length - MAX_HAND_SIZE);
      cpu = { ...cpu, hand: cpu.hand.filter(c => !removed.includes(c)), graveyard: [...cpu.graveyard, ...removed] };
    }
    const winner = determineBattleWinner(resolved.player.life, cpu.life);
    const next = { player: resolved.player, cpu };
    const logs = logsWithContext([...resolved.logs, ...describeStatChanges(previous, next, resolved.logs)]);
    set({
      player: resolved.player, cpu, winner, gameEnded: Boolean(winner),
      effectLog: [...previous.effectLog, ...logs].slice(-300), effectQueue: [...resolved.queue, ...previous.effectQueue],
      presentationQueue: previous.presentationEnabled ? [...previous.presentationQueue, ...createBattlePresentations(previous, next, logs)] : [],
      pendingDiscard: resolved.player.hand.length > MAX_HAND_SIZE ? "PLAYER" : null,
    });
  };
  const negate = (guardian: GameCard) => {
    const state = get(), request = state.effectQueue[0];
    if (!request) return;
    const owner = oppositeTurn(request.controller), own = getPlayer(state, owner);
    const updated = setPlayer(state, owner, { ...own, field: own.field.map(c => c.instanceId === guardian.instanceId ? { ...c, activatedThisTurn: true } : c) });
    set({ effectQueue: state.effectQueue.filter(r => r.source.instanceId !== request.source.instanceId || r.ability.trigger === "ON_DEATH"), pendingEffect: null });
    const removed = destroyCards(updated, [request.source.instanceId]);
    commit({ ...removed, logs: [createEffectLog(owner, guardian, "NEGATE_AND_DESTROY", guardian.name + " niega " + request.ability.name + " de " + request.source.name + " y destruye su fuente."), ...removed.logs] });
  };
  const drain = () => {
    if (draining) return;
    draining = true;
    try {
      let steps = 0;
      while (get().effectQueue.length && !get().pendingEffect && !get().pendingDiscard && !get().gameEnded && !get().presentationQueue.length) {
        if (++steps > 1000) throw new Error("La cadena de efectos excedió el límite de seguridad.");
        const state = get(), request = state.effectQueue[0];
        const { source, controller, ability } = request;
        if (!request.reactionChecked && !["CONTINUO", "CONTINUOUS", "SUMMON_CONDITION", "DAMAGE_PREVENTION"].includes(ability.trigger)) {
          const guardian = getPlayer(state, oppositeTurn(controller)).field.find(c => hasAbility(c, "NEGATE_AND_DESTROY") && !c.activatedThisTurn);
          if (guardian) {
            if (oppositeTurn(controller) === "CPU") { negate(guardian); continue; }
            set({ pendingEffect: {
              controller: "PLAYER", source: guardian, ability: guardian.abilities!.find(a => a.effect === "NEGATE_AND_DESTROY")!,
              kind: "REACTION", cancellable: false,
              options: [
                { target: { type: "CARD", instanceId: guardian.instanceId }, label: "Negar y destruir: " + source.name },
                { target: { type: "PLAYER", player: "PLAYER" }, label: "Dejar resolver " + ability.name },
              ],
            } });
            break;
          }
        }
        set({ effectQueue: state.effectQueue.slice(1) });
        let target = request.target;
        if (requiresTarget(ability) && !target) {
          const groups = getEffectSelectionGroups(ability, state, controller, source);
          if (!hasValidSelection(groups)) {
            commit(effectResult(state, [createEffectLog(controller, source, ability.effect, source.name + ": no hay objetivos válidos para " + ability.name + ".", {
              abilityName: ability.name, trigger: ability.trigger, outcome: "SKIPPED",
            })]));
            continue;
          }
          if (!groups.some(g => g.options.length)) target = { type: "CARDS", instanceIds: [] };
          else if (controller === "PLAYER") {
            set({ pendingEffect: { ...request, groups, options: groups.flatMap(g => g.options), kind: "TRIGGER", cancellable: false } });
            break;
          }
          else target = chooseAutomaticTarget(ability, state, controller, source);
        }
        commit(resolveGameAbility(ability, { source, controller, player: state.player, cpu: state.cpu, target }));
      }
    } finally { draining = false; }
  };
  const settled = async (token: number) => {
    drain();
    while (session === token && (get().presentationQueue.length || (!get().gameEnded && (get().pendingEffect || get().pendingDiscard || get().pendingCombatChoice || get().effectQueue.length)))) await wait(40);
    return session === token && !get().gameEnded;
  };
  const allowedMainAction = (controller: Turn) => {
    const s = get();
    return s.gameStarted && !s.gameEnded && s.turn === controller && s.phase === "MAIN" &&
      !s.pendingEffect && !s.pendingDiscard && !s.isCombatAnimation && !s.presentationQueue.length;
  };
  const playNow = (controller: Turn, id: string, position?: number, target?: EffectTarget) => {
    if (!allowedMainAction(controller)) return;
    const state = get(), own = getPlayer(state, controller), card = own.hand.find(c => c.instanceId === id);
    if (!card || getPlayRestriction(state, controller, card)) return;
    if (isMana(card)) { get().playManaCard(controller, id); return; }
    const targetAbility = getPlayTargetAbility(card);
    if (targetAbility && (!target || !isValidEffectTarget(targetAbility, state, controller, card, target))) return;
    let next = setPlayer(state, controller, { ...own, manaZone: spendManaFromZone(own.manaZone, card.manaTypes, getEffectiveCost(card, own.field), card.rarity) });
    const costQueue: EffectRequest[] = [], costLogs: EffectLog[] = [];
    const condition = getPlayCondition(card);
    if (condition) {
      const payment = resolveGameAbility(condition, { ...next, controller, source: card, target });
      if (!payment.handled) return;
      next = { player: payment.player, cpu: payment.cpu }; costQueue.push(...payment.queue); costLogs.push(...payment.logs);
    }
    const currentOwn = getPlayer(next, controller);
    if (card.cardType === "HECHIZO") {
      next = setPlayer(next, controller, {
        ...currentOwn, hand: currentOwn.hand.filter(c => c.instanceId !== id), graveyard: [...currentOwn.graveyard, card],
        usedCardsThisTurn: [...(currentOwn.usedCardsThisTurn ?? []), card.name],
      });
      const requests = (card.abilities ?? []).filter(a => a.trigger === "INSTANT").map(ability => ({
        controller, source: card, ability,
        target: ability === targetAbility || ability.effect === "BUFF_IF_3_FIRE" ? target : undefined,
      }));
      commit(effectResult(next, [...costLogs, createEffectLog(controller, card, "CAST", getPlayer(next, controller).name + " lanza " + card.name + ".")], [...costQueue, ...requests]));
    } else {
      const placed = summonFromZone(next, controller, card, "hand");
      if (position !== undefined && position >= 1 && position <= 6 && !currentOwn.field.some(c => isCreature(c) && c.position === position)) {
        const p = getPlayer(placed, controller);
        const updated = setPlayer(placed, controller, { ...p, field: p.field.map(c => c.instanceId === id ? { ...c, position } : c) });
        placed.player = updated.player; placed.cpu = updated.cpu;
      }
      commit({ ...placed, logs: [...costLogs, ...placed.logs], queue: [...costQueue, ...placed.queue] });
    }
    drain();
  };
  const activateNow = (controller: Turn, id: string, target?: EffectTarget) => {
    const state = get(), own = getPlayer(state, controller), source = own.field.find(c => c.instanceId === id);
    const ability = source?.abilities?.find(a => a.trigger === "ACTIVATED");
    if (!source || !ability || source.activatedThisTurn || source.abilitiesDisabled) return;
    if (requiresTarget(ability) && (!target || !isValidEffectTarget(ability, state, controller, source, target))) return;
    if (ability.effect === "CONVERT_MANA_RANDOM" && !own.manaZone.some(c => !c.isTapped)) return;
    const updated = setPlayer(state, controller, { ...own, field: own.field.map(c => c.instanceId === id ? { ...c, activatedThisTurn: true } : c) });
    commit(effectResult(updated, [], [{ controller, source, ability, target }]));
    drain();
  };
  return {
    ...initialState(),
    setPresentationEnabled: enabled => {
      set({ presentationEnabled: enabled, presentationQueue: enabled ? get().presentationQueue : [],
        combatAnimation: enabled ? get().combatAnimation : null });
      if (!enabled) drain();
    },
    finishPresentation: id => {
      if (get().presentationQueue[0]?.id !== id) return;
      set({ presentationQueue: get().presentationQueue.slice(1) });
      if (!get().presentationQueue.length) drain();
    },
    startGame: (playerDeck, cpuDeck) => {
      session++; get().pendingCombatChoice?.resolve(false);
      set({ ...initialState(), presentationEnabled: get().presentationEnabled, ...createInitialPlayers(playerDeck, cpuDeck), gameStarted: true, phase: "MAIN" });
      set({ effectLog: logsWithContext([createEffectLog("PLAYER", { name: "Batalla" }, "START", "Comienza la batalla. Juega un maná y prepara tu campo.")]) });
    },
    drawCard: controller => { if (!get().gameEnded) { commit(drawCards(get(), controller, 1)); drain(); } },
    playManaCard: (controller, id) => {
      if (!allowedMainAction(controller) || get().playedManaThisTurn[controller]) return;
      const state = get(), own = getPlayer(state, controller), card = own.hand.find(c => c.instanceId === id);
      if (!card || !isMana(card)) return;
      const next = setPlayer(state, controller, { ...own, hand: own.hand.filter(c => c.instanceId !== id), manaZone: [...own.manaZone, { ...card, isTapped: false }] });
      set({ player: next.player, cpu: next.cpu, playedManaThisTurn: { ...state.playedManaThisTurn, [controller]: true },
        effectLog: appendLogs([createEffectLog(controller, card, "MANA", own.name + " juega " + card.name + ".")]) });
    },
    playCard: (controller, id, position) => {
      if (!allowedMainAction(controller)) return;
      const state = get(), card = getPlayer(state, controller).hand.find(c => c.instanceId === id);
      if (!card || getPlayRestriction(state, controller, card)) return;
      const ability = getPlayTargetAbility(card);
      if (!ability) { playNow(controller, id, position); return; }
      const groups = getEffectSelectionGroups(ability, state, controller, card);
      if (controller === "PLAYER") set({ pendingEffect: { controller, source: card, ability, groups, options: groups.flatMap(g => g.options), kind: "PLAY", position, cancellable: true } });
      else playNow(controller, id, position, chooseAutomaticTarget(ability, state, controller, card));
    },
    activateAbility: (controller, id) => {
      if (!allowedMainAction(controller)) return;
      const state = get(), source = getPlayer(state, controller).field.find(c => c.instanceId === id);
      const ability = source?.abilities?.find(a => a.trigger === "ACTIVATED");
      if (!source || !ability || source.activatedThisTurn || source.abilitiesDisabled) return;
      if (!requiresTarget(ability)) { activateNow(controller, id); return; }
      const groups = getEffectSelectionGroups(ability, state, controller, source);
      if (!hasValidSelection(groups)) return;
      if (controller === "PLAYER") set({ pendingEffect: { controller, source, ability, groups, options: groups.flatMap(g => g.options), kind: "ACTIVATE", cancellable: true } });
      else activateNow(controller, id, chooseAutomaticTarget(ability, state, controller, source));
    },
    resolvePendingEffect: target => {
      const state = get(), pending = state.pendingEffect;
      if (!pending || state.presentationQueue.length) return;
      if (pending.kind === "REACTION") {
        if (target.type === "CARD" && target.instanceId === pending.source.instanceId) negate(pending.source);
        else if (target.type === "PLAYER") set({ pendingEffect: null, effectQueue: state.effectQueue.map((r, i) => i === 0 ? { ...r, reactionChecked: true } : r) });
        drain(); return;
      }
      if (!isValidEffectTarget(pending.ability, state, pending.controller, pending.source, target)) return;
      set({ pendingEffect: null });
      if (pending.kind === "PLAY") playNow(pending.controller, pending.source.instanceId, pending.position, target);
      else if (pending.kind === "ACTIVATE") activateNow(pending.controller, pending.source.instanceId, target);
      else { commit(resolveGameAbility(pending.ability, { ...get(), source: pending.source, controller: pending.controller, target })); drain(); }
    },
    cancelPendingEffect: () => { if (get().pendingEffect?.cancellable !== false) { set({ pendingEffect: null }); drain(); } },
    chooseCombatOption: value => { const pending = get().pendingCombatChoice; set({ pendingCombatChoice: null }); pending?.resolve(value); },
    executeAutoCombat: async () => {
      const state = get(), token = session, controller = state.turn;
      if (state.phase !== "COMBAT" || shouldSkipCombatPhase(controller, state.turnNumber)) return;
      const attackers = getPlayer(state, controller).field.filter(isCreature).sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).map(c => c.instanceId);
      const blocks = new Map<string, number>();
      const assignments = new Map<string, string[]>();
      try {
        for (const id of attackers) {
          for (let attack = 0; attack < 2; attack++) {
            if (session !== token || get().gameEnded) return;
            let own = getPlayer(get(), controller), card = own.field.find(c => c.instanceId === id);
            if (!card || !canAttackNow(card, own)) break;
            set({ combatPosition: card.position ?? null, isCombatAnimation: true });
            set({ effectQueue: [...collectTriggeredAbilities(get(), controller, "ON_ATTACK", card), ...get().effectQueue] });
            if (!await settled(token)) return;
            own = getPlayer(get(), controller); card = own.field.find(c => c.instanceId === id);
            if (!card) break;
            const enemy = getPlayer(get(), oppositeTurn(controller));
            const blocker = enemy.field.find(c => c.position === card!.position && isCreature(c));
            if (getUnblockableAbility(card) && blocker && !card.unblockableThisTurn) {
              const decision = controller === "CPU" ? true : await new Promise<boolean>(resolve =>
                set({ pendingCombatChoice: { controller, card: card!, opponent: blocker, resolve } }));
              if (session !== token) return;
              if (decision) {
                set({ effectQueue: [{ controller, source: card, ability: getUnblockableAbility(card)! }, ...get().effectQueue] });
                if (!await settled(token)) return;
                card = getPlayer(get(), controller).field.find(c => c.instanceId === id)!;
                if (!card) break;
              }
            }
            const previous = assignments.get(id) ?? [];
            const surviving = getPlayer(get(), oppositeTurn(controller)).field.filter(c => previous.includes(c.instanceId));
            const blockers = attack > 0 && surviving.length && !card.unblockableThisTurn ? surviving : selectBlockers(get(), controller, card, blocks);
            for (const b of blockers) if (!previous.includes(b.instanceId)) blocks.set(b.instanceId, (blocks.get(b.instanceId) ?? 0) + 1);
            assignments.set(id, [...new Set([...previous, ...blockers.map(c => c.instanceId)])]);
            set({ combatAnimation: { id: `combat-${token}-${++combatSequence}`, attackerId: id,
              blockerIds: blockers.map(c => c.instanceId), controller } });
            await wait(get().presentationEnabled ? COMBAT_CLASH_DURATION_MS : 650);
            if (session !== token) return;
            set({ combatAnimation: null });
            commit(resolveAttackStep(get(), controller, id, blockers.map(c => c.instanceId)));
            if (!await settled(token)) return;
            await wait(400);
          }
        }
      } finally {
        if (session === token) set({ combatPosition: null, isCombatAnimation: false, combatAnimation: null });
      }
    },
    nextPhase: async () => {
      const state = get(), token = session;
      if (state.gameEnded || state.pendingDiscard || state.pendingEffect || state.pendingCombatChoice || state.isCombatAnimation || state.presentationQueue.length) return;
      if (state.phase === "DRAW") { set({ phase: "MAIN" }); return; }
      if (state.phase === "END") { get().endTurn(); return; }
      if (state.phase !== "MAIN") return;
      if (shouldSkipCombatPhase(state.turn, state.turnNumber)) { set({ phase: "END" }); return; }
      set({ phase: "COMBAT", isCombatAnimation: true });
      try { await get().executeAutoCombat(); }
      finally { if (session === token) set({ phase: "END", isCombatAnimation: false, combatPosition: null, combatAnimation: null }); }
    },
    endTurn: async () => {
      const state = get(), token = session;
      if (state.phase !== "END" || state.gameEnded || state.pendingEffect || state.pendingDiscard || state.isCombatAnimation || state.presentationQueue.length) return;
      set({ effectQueue: [...get().effectQueue, ...collectTriggeredAbilities(state, state.turn, "TURN_END")] });
      if (!await settled(token)) return;
      const current = get(), { newTurn, newTurnNumber } = getNextTurnState(current.turn, current.turnNumber);
      const prepare = (p: Player) => ({ ...p, field: resetFieldForNewTurn(p.field), manaZone: resetManaZoneForNewTurn(p.manaZone), usedCardsThisTurn: [] });
      const prepared = { player: prepare(current.player), cpu: prepare(current.cpu) };
      set({ turn: newTurn, turnNumber: newTurnNumber, phase: "DRAW",
        playedManaThisTurn: { ...current.playedManaThisTurn, [newTurn]: false }, selectedCard: null, selectedTarget: null,
      });
      commit(effectResult(prepared, [{ ...createEffectLog(newTurn, { name: "Turno" }, "TURN_START", "Comienza el turno de " + getPlayer(current, newTurn).name + "."), turn: newTurnNumber, phase: "DRAW" }], collectTriggeredAbilities(prepared, newTurn, "TURN_START")));
      if (!await settled(token)) return;
      get().drawCard(newTurn);
      if (!await settled(token)) return;
      if (session === token) set({ phase: "MAIN" });
    },
    selectCard: card => set({ selectedCard: card }),
    discardCard: (controller, id) => {
      const state = get(), own = getPlayer(state, controller), card = own.hand.find(c => c.instanceId === id);
      if (state.pendingDiscard !== controller || !card) return;
      const next = setPlayer(state, controller, { ...own, hand: own.hand.filter(c => c.instanceId !== id), graveyard: [...own.graveyard, card] });
      commit(effectResult(next, [createEffectLog(controller, card, "DISCARD", own.name + " descarta " + card.name + " por el límite de mano.")]));
      drain();
    },
    tapCard: (controller, id) => {
      const state = get(), own = getPlayer(state, controller);
      const next = setPlayer(state, controller, { ...own, field: own.field.map(c => c.instanceId === id ? { ...c, isTapped: !c.isTapped } : c) });
      set({ player: next.player, cpu: next.cpu });
    },
    dealDamage: (controller, amount) => {
      const state = get(), own = getPlayer(state, controller);
      commit(effectResult(setPlayer(state, controller, { ...own, life: Math.max(0, own.life - Math.max(0, amount)) })));
    },
    destroyCard: (_controller, id) => { commit(destroyCards(get(), [id])); drain(); },
    resetGame: () => { session++; get().pendingCombatChoice?.resolve(false); set({ ...initialState(), presentationEnabled: get().presentationEnabled }); },
  };
});
