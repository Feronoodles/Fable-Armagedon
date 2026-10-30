import test from "node:test";
import assert from "node:assert/strict";
import { cardCatalog } from "../src/game-engine/catalog";
import { createEmptyPlayer, createGameCard, createInitialPlayers } from "../src/game-engine/setup";
import { STARTING_LIFE } from "../src/game-engine/types";
import {
  applyDamageBatch, chooseAutomaticTarget, destroyCards, getEffectiveCardStats, getEffectiveCost,
  getEffectSelectionGroups, hasKeyword, isValidEffectTarget, resolveGameAbility, requiresTarget, summonFromZone, subtypeOf, destroyDeckCards,
} from "../src/game-engine/effects";
import { canAffordCard, getAvailableMana, getManaOptions, getManaRequirements, planManaPayment, spendManaFromZone } from "../src/game-engine/mana";
import { canAttackNow, resolveAttackStep } from "../src/game-engine/battle-combat";
import { resetFieldForNewTurn, resetManaZoneForNewTurn } from "../src/game-engine/turns";
import { getPlayRestriction } from "../src/game-engine/battle-actions";
import { useGameStore } from "../src/stores/gameStore";
import { describeEffect, getLatestEffect, getAbilityTiming } from "../src/game-engine/effect-presentation";
import { CPU_DECK_PROFILE, generateCpuDeck } from "../src/game-engine/cpu/deck";
import { getCpuManaCardToPlay, getCpuSummonPlan } from "../src/game-engine/cpu/decision";
import { createBattlePresentations, describeStatChanges, getPresentedStat } from "../src/game-engine/battle-presentation";
import { findEffectSourceCard, getAnimatedStatValue, getEffectCue, getEffectLinks, STAT_ANIMATION } from "../src/game-engine/effect-animation";
import { getCardExpansionKey } from "../src/game-engine/expansions";
import { CREATURE_SUBTYPE_KEYS, getSubtypeLabel } from "../src/game-engine/subtypes";
import type { GameCard, Player } from "../src/game-engine/types";

const card = (name: string, extras: Partial<GameCard> = {}): GameCard => {
  const definition = cardCatalog.find(c => c.name === name);
  assert.ok(definition, "Missing catalog card: " + name);
  return { ...createGameCard({ ...definition, id: name }), ...extras };
};
const field = (...cards: GameCard[]) => cards.map((c, i) => ({ ...c, position: c.cardType === "CRIATURA" ? i + 1 : undefined, canAttack: true }));
const player = (changes: Partial<Player> = {}): Player => ({ ...createEmptyPlayer("player", "Jugador"), ...changes });
const ability = (source: GameCard, effect?: string) => source.abilities!.find(a => !effect || a.effect === effect)!;
const context = (source: GameCard, own: Partial<Player> = {}, enemy: Partial<Player> = {}) => ({
  source, controller: "PLAYER" as const, player: player(own), cpu: { ...player(enemy), id: "cpu", name: "CPU" }, rng: () => 0,
});
const mana = (count: number, name = "Mana de Fuego") => Array.from({ length: count }, () => card(name));

test("all catalog abilities have executable resolution paths and preserve input state", async t => {
  for (const definition of cardCatalog) {
    for (const a of definition.abilities ?? []) {
      await t.test(definition.name + " / " + a.effect, () => {
        const source = card(definition.name);
        const ctx = context(source, {
          field: field(source, card("Dragón de Guerra Volcánico"), card("Fanático de la Llama Solar"), card("Dron de Reparación")),
          hand: [card("Soldado de Ceniza"), card("Campo de Energía Primitiva")],
          deck: cardCatalog.map(c => createGameCard({ ...c, id: c.name })),
          graveyard: [card("Dragón Volcánico"), card("Fanático de la Llama Solar")],
          manaZone: mana(3),
        }, { field: field(card("Soldado de Ceniza"), card("Dron de Reparación"), card("Guerrero de la Aurora Roja")) });
        const snapshot = structuredClone({ player: ctx.player, cpu: ctx.cpu });
        const target = requiresTarget(a) ? chooseAutomaticTarget(a, ctx, "PLAYER", source) : undefined;
        if (requiresTarget(a)) assert.ok(target, "Fixture must supply a legal target for " + a.effect);
        const resolved = resolveGameAbility(a, { ...ctx, target });
        assert.equal(resolved.handled, true, JSON.stringify(resolved.logs));
        assert.ok(!resolved.logs.some(log => log.message.includes("no reconocido")), a.effect);
        assert.deepEqual({ player: ctx.player, cpu: ctx.cpu }, snapshot, "Effects must not mutate prior state");
      });
    }
  }
});
test("sanctuaries and thrones pay special mana once, within the printed total cost", () => {
  for (const [name, source] of [["Emperador Volcánico Ignathor", "Santuario de Fuego"], ["Dominus Volcánico Astravor", "Trono de Fuego"]]) {
    const spell = card(name), zone = [...mana(9), card(source)];
    assert.equal(canAffordCard(spell, zone), true);
    const payment = planManaPayment(zone, spell.manaTypes, spell.cost, spell.rarity)!;
    assert.equal(payment.length, 10); assert.equal(new Set(payment).size, 10);
    assert.equal(spendManaFromZone(zone, spell.manaTypes, spell.cost, spell.rarity).filter(c => c.isTapped).length, 10);
    assert.equal(canAffordCard(spell, mana(10)), false);
  }
});
test("untyped costs still require mana and insufficient payments tap nothing", () => {
  const spell = card("Flecha de Fuego Ancestral", { manaTypes: [], cost: 3 });
  assert.equal(canAffordCard(spell, mana(2)), false);
  const zone = mana(1);
  assert.deepEqual(spendManaFromZone(zone, ["FUEGO"], 3), zone);
});
test("special sources retain their identity after paying ordinary Fire or generic costs", () => {
  for (const [name, grade] of [["Santuario de Fuego", "LEGENDARIO"], ["Trono de Fuego", "CELESTIAL"]]) {
    for (const symbols of [["FUEGO"], []]) {
      const source = card(name), zone = spendManaFromZone([source], symbols, 1, "COMUN");
      assert.equal(zone[0].isTapped, true);
      assert.equal(zone[0].rarity, source.rarity);
      assert.deepEqual(getManaOptions(zone[0]), ["FUEGO", grade]);
      assert.equal(getAvailableMana(zone)[grade] ?? 0, 0);
      assert.equal(getAvailableMana(resetManaZoneForNewTurn(zone))[grade], 1);
      assert.equal(source.isTapped, false);
    }
  }
});
test("implicit special requirements are shown once and legendary/celestial mana are not interchangeable", () => {
  const architect = card("El Arquitecto del Armagedón Fable"), harmony = card("Armonía de los 8 Mundos");
  assert.deepEqual(getManaRequirements(architect.manaTypes, architect.rarity), ["FUEGO", "AGUA", "NATURALEZA", "RAYO", "LEGENDARIO"]);
  assert.deepEqual(getManaRequirements(harmony.manaTypes, harmony.rarity), ["FUEGO", "AGUA", "NATURALEZA", "CELESTIAL"]);
  for (const [name, right, wrong] of [["Emperador Volcánico Ignathor", "Santuario de Fuego", "Trono de Fuego"], ["Dominus Volcánico Astravor", "Trono de Fuego", "Santuario de Fuego"]]) {
    const target = card(name);
    assert.equal(getManaRequirements(target.manaTypes, target.rarity).length, 2);
    assert.equal(canAffordCard(target, [...mana(9), card(wrong)]), false);
    assert.equal(canAffordCard(target, [...mana(9), card(right)]), true);
  }
});
test("aura defense uses the printed +2 and subtype synergies disappear with their source", () => {
  const human = card("Guerrero Humano del Yermo");
  const owner = player({ field: field(human, card("Santuario de los Ancestros")) });
  assert.equal(getEffectiveCardStats(human, owner).defense, human.defense! + 2);
  assert.equal(getEffectiveCardStats(human, player({ field: [human] })).defense, human.defense);
  const support = card("Campo de Energía Primitiva");
  assert.equal(getEffectiveCost(human, [support]), human.cost - 1);
});
test("fire banner excludes itself when its text says other creatures", () => {
  const banner = card("Portador del Estandarte Carmesí"), ally = card("Soldado de Ceniza");
  const owner = player({ field: field(banner, ally) });
  assert.equal(getEffectiveCardStats(banner, owner).attack, banner.attack);
  assert.equal(getEffectiveCardStats(ally, owner).attack, ally.attack! + 1);
});
test("ancestor sanctuary heals once per human; counselor only once if another human exists", () => {
  const source = card("Santuario de los Ancestros"), humans = field(card("Soldado de Ceniza"), card("Guerrero Humano del Yermo"));
  const ctx = context(source, { life: 10, field: [...humans, source] });
  assert.equal(resolveGameAbility(ability(source, "LIFE_GAIN_PER_SUBTYPE"), ctx).player.life, 12);
  const counselor = card("Consejera del Bosque Partido");
  assert.equal(resolveGameAbility(ability(counselor), context(counselor, { life: 10, field: [...humans, counselor] })).player.life, 11);
});
test("mass damage destroys at equal defense, respects spell immunity and queues death triggers", () => {
  const source = card("Avatar del Sol Devastador"), victim = card("Larva del Vacío"), immune = card("Titán Colisionador de Eras");
  const spell = card("Flecha de Fuego Ancestral");
  const protectedResult = applyDamageBatch(context(spell, {}, { field: field(immune) }), [{ source: spell, controller: "PLAYER", target: { type: "CARD", instanceId: immune.instanceId }, amount: 99 }]);
  assert.equal(protectedResult.cpu.field.length, 1);
  const resolved = resolveGameAbility(ability(source, "DAMAGE_3_ALL"), context(source, { field: [source] }, { field: [victim] }));
  assert.equal(resolved.cpu.field.length, 0);
  assert.ok(resolved.queue.some(r => r.ability.effect === "DRAW_1" && r.source.instanceId === victim.instanceId));
});
test("obsidian armor prevents only the first damage event each turn", () => {
  const dragon = card("Dragón Mecánico de Obsidiana"), source = card("Soldado de Ceniza");
  const event = { source, controller: "PLAYER" as const, target: { type: "CARD" as const, instanceId: dragon.instanceId }, amount: 2, combat: true };
  const first = applyDamageBatch(context(source, {}, { field: [dragon] }), [event]);
  assert.equal(first.cpu.field[0].damageMarked ?? 0, 0);
  const second = applyDamageBatch(first, [event]);
  assert.equal(second.cpu.field[0].damageMarked, 2);
  assert.equal(resetFieldForNewTurn(second.cpu.field)[0].damagePreventionUsed, false);
});
test("haste works immediately; defenders block without being able to attack", () => {
  const hasty = card("Dragón Mecánico de Obsidiana", { canAttack: false });
  assert.equal(canAttackNow(hasty, player({ field: [hasty] })), true);
  const wall = card("Golem de Tierra Despertado", { canAttack: true }), attacker = card("Soldado de Ceniza", { canAttack: true });
  assert.equal(canAttackNow(wall, player({ field: [wall] })), false);
  const resolved = resolveAttackStep(context(attacker, { field: [attacker] }, { field: [wall] }), "PLAYER", attacker.instanceId, [wall.instanceId]);
  assert.equal(resolved.cpu.life, STARTING_LIFE);
});
test("combat deals simultaneous marked damage, including lethal ties", () => {
  const a = card("Soldado de Ceniza", { attack: 3, defense: 3, canAttack: true });
  const b = card("Soldado de Ceniza", { attack: 3, defense: 3 });
  const resolved = resolveAttackStep(context(a, { field: [a] }, { field: [b] }), "PLAYER", a.instanceId, [b.instanceId]);
  assert.equal(resolved.player.field.length, 0); assert.equal(resolved.cpu.field.length, 0);
  assert.equal(resolved.player.graveyard.length, 1); assert.equal(resolved.cpu.graveyard.length, 1);
});
test("double attack is capped at two attacks and damage survives between attacks", () => {
  const general = card("General Volcánico Kharzeth", { canAttack: true });
  const ctx = context(general, { field: [general, card("Dragón de Chispa")] });
  const first = resolveAttackStep(ctx, "PLAYER", general.instanceId, []);
  const second = resolveAttackStep(first, "PLAYER", general.instanceId, []);
  const third = resolveAttackStep(second, "PLAYER", general.instanceId, []);
  assert.equal(second.cpu.life, STARTING_LIFE - 10); assert.equal(third.cpu.life, STARTING_LIFE - 10);
});
test("Kharzeth cannot enable his own second attack or use dragons outside his field", () => {
  const general = card("General Volcánico Kharzeth", { canAttack: true });
  const own = player({ field: [general, card("Soldado de Ceniza")], hand: [card("Dragón de Chispa")], graveyard: [card("Dragón Volcánico")] });
  const state = context(general, own, { field: [card("Dragón de Chispa")] });
  assert.equal(getEffectiveCardStats(general, own).maxAttacks, 1);
  const first = resolveAttackStep(state, "PLAYER", general.instanceId, []);
  const second = resolveAttackStep(first, "PLAYER", general.instanceId, []);
  assert.equal(second.cpu.life, STARTING_LIFE - 5);
  assert.equal(canAttackNow(first.player.field.find(c => c.instanceId === general.instanceId)!, first.player), false);
});
test("another allied dragon, including a second copy of Kharzeth, enables Asalto Dragón", () => {
  const general = card("General Volcánico Kharzeth", { canAttack: true });
  for (const other of [card("Dragón de Chispa"), card("General Volcánico Kharzeth")]) {
    const own = player({ field: [general, other] });
    assert.notEqual(general.instanceId, other.instanceId);
    assert.equal(getEffectiveCardStats(general, own).maxAttacks, 2);
    const first = resolveAttackStep(context(general, own), "PLAYER", general.instanceId, []);
    assert.equal(canAttackNow(first.player.field.find(c => c.instanceId === general.instanceId)!, first.player), true);
  }
});
test("Kharzeth loses his remaining second attack if the other dragon leaves the field", () => {
  const general = card("General Volcánico Kharzeth", { canAttack: true }), other = card("Dragón de Chispa");
  const first = resolveAttackStep(context(general, { field: [general, other] }), "PLAYER", general.instanceId, []);
  const withoutAlly = destroyCards(first, [other.instanceId]);
  const attacker = withoutAlly.player.field.find(c => c.instanceId === general.instanceId)!;
  assert.equal(getEffectiveCardStats(attacker, withoutAlly.player).maxAttacks, 1);
  assert.equal(canAttackNow(attacker, withoutAlly.player), false);
  assert.equal(resolveAttackStep(withoutAlly, "PLAYER", general.instanceId, []).cpu.life, STARTING_LIFE - 5);
});
test("sacrifices trigger death, fanatic bonus and priest bonus without double-moving cards", () => {
  const source = card("Sacerdote del Núcleo Ardiente"), victim = card("Fanático de la Llama Solar");
  const ctx = context(source, { field: field(source, victim), deck: [card("Mana de Fuego")] });
  const resolved = resolveGameAbility(ability(source, "SACRIFICE_DRAW"), { ...ctx, target: { type: "CARD", instanceId: victim.instanceId } });
  assert.equal(resolved.player.graveyard.length, 1); assert.equal(resolved.player.hand.length, 1);
  assert.equal(resolved.queue.filter(r => r.ability.effect === "DAMAGE_2_PLAYER").length, 2);
});
test("summon conditions reject nonexistent or duplicate sacrifices without consuming anything", () => {
  const source = card("Sumo Hierofante Pyrothar"), fire = card("Soldado de Ceniza");
  const ctx = context(source, { field: [fire], manaZone: [...mana(9), card("Santuario de Fuego")] });
  assert.match(getPlayRestriction(ctx, "PLAYER", source)!, /sacrificios/);
  assert.equal(isValidEffectTarget(ability(source, "REQUIRES_2_FIRE_SACRIFICE"), ctx, "PLAYER", source, { type: "CARDS", instanceIds: [fire.instanceId, fire.instanceId] }), false);
});
test("chain eggs leave the deck and receive unique available creature slots", () => {
  const source = card("Huevo de Dragón Volcánico"), next = card(source.name);
  const resolved = resolveGameAbility(ability(source, "SUMMON_SAME_CARD_FROM_DECK"), context(source, { field: field(source), deck: [next] }));
  assert.equal(resolved.player.deck.length, 0);
  assert.deepEqual(resolved.player.field.map(c => c.position), [1, 2]);
  assert.ok(resolved.queue.some(r => r.source.instanceId === next.instanceId));
});
test("graveyard resurrection resets damage and permanent bonuses", () => {
  const spell = card("Ascensión Volcánica"), dragon = card("Dragón Volcánico", { damageMarked: 99, permanentAttackBonus: 7 });
  const ctx = context(spell, { graveyard: [dragon] });
  const resolved = resolveGameAbility(ability(spell, "SUMMON_FROM_GRAVEYARD"), { ...ctx, target: { type: "CARD", instanceId: dragon.instanceId } });
  assert.equal(resolved.player.graveyard.length, 0);
  assert.equal(resolved.player.field[0].damageMarked, 0);
  assert.equal(resolved.player.field[0].permanentAttackBonus, 0);
});
test("Astravor restricts targeted spells to himself but area effects retain their area", () => {
  const source = card("Flecha de Fuego Ancestral"), guardian = card("Dominus Volcánico Astravor"), ally = card("Soldado de Ceniza");
  const ctx = context(source, {}, { field: [guardian, ally] });
  const groups = getEffectSelectionGroups(ability(source), ctx, "PLAYER", source);
  assert.equal(groups[0].options.length, 1);
  assert.equal(groups[0].options[0].card?.instanceId, guardian.instanceId);
});
test("harmony requires three elements and grants its documented elemental keywords", () => {
  const harmony = card("Armonía de los 8 Mundos"), ally = card("Soldado de Ceniza");
  const owner = player({ field: [harmony, ally], manaZone: [card("Mana de Agua"), card("Mana de Metal")] });
  assert.equal(getEffectiveCardStats(ally, owner).attack, ally.attack! + 4);
  assert.equal(hasKeyword(ally, owner, "HASTE"), true);
  assert.equal(hasKeyword(ally, owner, "SPELL_IMMUNITY"), true);
});
test("the battle log records playing mana, summoning, and every spell effect", () => {
  useGameStore.getState().resetGame();
  const spell = card("Ascensión Volcánica"), dragon = card("Dragón Volcánico");
  const allies = field(card("Soldado de Ceniza"), card("Fanático de la Llama Solar"));
  useGameStore.setState({ gameStarted: true, phase: "MAIN", player: player({ hand: [spell], field: allies, graveyard: [dragon], manaZone: mana(5) }), cpu: player({ name: "CPU" }) });
  useGameStore.getState().playCard("PLAYER", spell.instanceId);
  assert.equal(useGameStore.getState().pendingEffect?.kind, "PLAY");
  useGameStore.getState().resolvePendingEffect({ type: "CARD", instanceId: dragon.instanceId });
  const state = useGameStore.getState(), revived = state.player.field.find(c => c.instanceId === dragon.instanceId)!;
  assert.ok(revived);
  assert.equal(revived.attackBonusThisTurn, 3, "second INSTANT effect must execute");
  assert.ok(state.effectLog.some(l => l.effect === "CAST"));
  assert.ok(state.effectLog.some(l => l.effect === "BUFF_IF_3_FIRE"));
  useGameStore.getState().resetGame();
});
test("mass death notifies fire watchers once per death and never duplicates graveyard cards", () => {
  const guardian = card("Guardián de la Caldera Eterna"), a = card("Soldado de Ceniza"), b = card("Cría de Brasa");
  const ctx = context(guardian, { field: [guardian, a, b] });
  const destroyed = destroyCards(ctx, [a.instanceId, b.instanceId, a.instanceId]);
  assert.equal(destroyed.player.graveyard.length, 2);
  assert.equal(destroyed.queue.filter(r => r.ability.trigger === "ON_FIRE_DESTROYED").length, 2);
});

test("human on-enter targets remain pending until selected", () => {
  useGameStore.getState().resetGame();
  const source = card("General Volcánico Kharzeth", { cost: 0, manaTypes: [] }), victim = card("Soldado de Ceniza");
  useGameStore.setState({ gameStarted: true, phase: "MAIN", player: player({ hand: [source] }), cpu: player({ field: [victim] }) });
  useGameStore.getState().playCard("PLAYER", source.instanceId, 3);
  assert.equal(useGameStore.getState().pendingEffect?.kind, "TRIGGER");
  assert.equal(useGameStore.getState().player.field[0].position, 3);
  assert.equal(useGameStore.getState().cpu.field.length, 1);
  useGameStore.getState().resolvePendingEffect({ type: "CARD", instanceId: victim.instanceId });
  assert.equal(useGameStore.getState().cpu.graveyard[0].instanceId, victim.instanceId);
  useGameStore.getState().resetGame();
});
test("Astravor can negate a spell once, and the next spell resolves in the same turn", () => {
  useGameStore.getState().resetGame();
  const guardian = card("Dominus Volcánico Astravor"), first = card("Flecha de Fuego Ancestral"), second = card(first.name);
  useGameStore.setState({ gameStarted: true, phase: "MAIN", turn: "CPU", player: player({ field: [guardian] }), cpu: player({ hand: [first, second], manaZone: mana(6) }) });
  useGameStore.getState().playCard("CPU", first.instanceId);
  assert.equal(useGameStore.getState().pendingEffect?.kind, "REACTION");
  useGameStore.getState().resolvePendingEffect({ type: "CARD", instanceId: guardian.instanceId });
  assert.equal(useGameStore.getState().player.field[0].activatedThisTurn, true);
  assert.equal(useGameStore.getState().player.field[0].damageMarked ?? 0, 0);
  assert.ok(useGameStore.getState().effectLog.some(l => l.effect === "NEGATE_AND_DESTROY"));
  useGameStore.getState().playCard("CPU", second.instanceId);
  assert.equal(useGameStore.getState().pendingEffect, null);
  assert.equal(useGameStore.getState().player.field[0].damageMarked, 3);
  useGameStore.getState().resetGame();
});
test("negating an on-enter monster effect destroys the monster without drawing its card", () => {
  useGameStore.getState().resetGame();
  const guardian = card("Dominus Volcánico Astravor"), drone = card("Dron Explorador Elemental", { cost: 0, manaTypes: [] });
  useGameStore.setState({ gameStarted: true, phase: "MAIN", turn: "CPU", player: player({ field: [guardian] }), cpu: player({ hand: [drone], deck: [card("Mana de Agua")] }) });
  useGameStore.getState().playCard("CPU", drone.instanceId);
  useGameStore.getState().resolvePendingEffect({ type: "CARD", instanceId: guardian.instanceId });
  assert.equal(useGameStore.getState().cpu.field.length, 0);
  assert.equal(useGameStore.getState().cpu.graveyard[0].instanceId, drone.instanceId);
  assert.equal(useGameStore.getState().cpu.deck.length, 1);
  useGameStore.getState().resetGame();
});
test("a multi-draw effect retains every drawn card while asking for hand-limit discards", () => {
  const source = card("Ritual de la Erupción Imperial"), victim = card("Dragón de Chispa");
  const ctx = context(source, { field: [victim], hand: mana(7), deck: [card("Soldado de Ceniza"), card("Cría de Brasa")] });
  const resolved = resolveGameAbility(ability(source), { ...ctx, target: { type: "CARD", instanceId: victim.instanceId } });
  assert.equal(resolved.player.hand.length, 9);
  assert.equal(resolved.pendingDiscard, "PLAYER");
  assert.equal(resolved.player.deck.length, 0);
  assert.equal(resolved.cpu.life, STARTING_LIFE - 2);
});
test("each player chooses their own sacrifice for the shared ritual", () => {
  useGameStore.getState().resetGame();
  const ritual = card("Ritual de Incineración Total"), humanChoice = card("Soldado de Ceniza"), other = card("Cría de Brasa");
  const cpuChoice = card("Dron de Reparación");
  useGameStore.setState({ gameStarted: true, phase: "MAIN", turn: "CPU",
    player: player({ field: [other, humanChoice] }), cpu: player({ hand: [ritual], field: [cpuChoice], manaZone: mana(5) }) });
  useGameStore.getState().playCard("CPU", ritual.instanceId);
  assert.equal(useGameStore.getState().pendingEffect?.ability.effect, "RITUAL_OTHER_CHOICE");
  assert.equal(useGameStore.getState().player.graveyard.length, 0);
  useGameStore.getState().resolvePendingEffect({ type: "CARD", instanceId: humanChoice.instanceId });
  assert.equal(useGameStore.getState().player.field[0].instanceId, other.instanceId);
  assert.equal(useGameStore.getState().cpu.field.length, 0);
  assert.equal(useGameStore.getState().player.life, STARTING_LIFE - 4);
  assert.equal(useGameStore.getState().cpu.life, STARTING_LIFE - 4);
  useGameStore.getState().resetGame();
});
test("hard once-per-turn and missing celestial elements reject play before payment", () => {
  const oath = card("Juramento del Trono Ígneo"), harmony = card("Armonía de los 8 Mundos", { cost: 0, manaTypes: [] });
  assert.match(getPlayRestriction(context(oath, { manaZone: [...mana(9), card("Santuario de Fuego")], usedCardsThisTurn: [oath.name] }), "PLAYER", oath)!, /este turno/);
  assert.match(getPlayRestriction(context(harmony), "PLAYER", harmony)!, /3 elementos/);
});
test("removing a defense aura also destroys creatures with lethal marked damage", () => {
  const support = card("Santuario de los Ancestros"), human = card("Soldado de Ceniza", { damageMarked: 2 });
  const resolved = destroyCards(context(support, { field: [support, human] }), [support.instanceId]);
  assert.equal(resolved.player.field.length, 0);
  assert.equal(resolved.player.graveyard.length, 2);
});
test("turn-end and turn-start effects resolve before drawing and retain the correct log turn", async () => {
  useGameStore.getState().resetGame();
  const sanctuary = card("Santuario de los Ancestros"), harmony = card("Armonía de los 8 Mundos");
  useGameStore.setState({ gameStarted: true, phase: "END", turn: "CPU", turnNumber: 1,
    player: player({ life: 10, field: [sanctuary, card("Soldado de Ceniza"), card("Guerrero Humano del Yermo")], deck: [card("Mana de Fuego")] }),
    cpu: player({ life: 5, field: [harmony], manaZone: [card("Mana de Agua"), card("Mana de Fuego"), card("Mana de Metal")] }) });
  await useGameStore.getState().endTurn();
  const state = useGameStore.getState();
  assert.equal(state.cpu.life, 9);
  assert.equal(state.player.life, 12);
  assert.equal(state.turn, "PLAYER");
  assert.equal(state.phase, "MAIN");
  assert.equal(state.player.hand.length, 1);
  assert.equal(state.effectLog.find(l => l.effect === "TURN_START")?.turn, 2);
  useGameStore.getState().resetGame();
});
test("unknown effects are explicitly rejected rather than silently marked as implemented", () => {
  const source = card("Soldado de Ceniza");
  const unknown = { name: "Unknown", description: "Unknown", trigger: "CONTINUO", effect: "UNIMPLEMENTED_TEST_EFFECT" };
  source.abilities = [unknown];
  const resolved = resolveGameAbility(unknown, context(source, { field: [source] }));
  assert.equal(resolved.handled, false);
  assert.match(resolved.logs[0].message, /no reconocido/);
});
test("damage feedback identifies the source, target slot and actual remaining defense", () => {
  const source = card("Flecha de Fuego Ancestral"), victim = card("Guardián de la Caldera Eterna", { position: 4 });
  const ctx = context(source, {}, { field: [victim] });
  const resolved = resolveGameAbility(ability(source), { ...ctx, target: { type: "CARD", instanceId: victim.instanceId } });
  const entry = resolved.logs.find(e => e.effect === "DAMAGE")!;
  assert.equal(entry.originInstanceId, source.instanceId);
  assert.equal(entry.abilityName, "Impacto Ígneo");
  assert.equal(entry.targetInstanceId, victim.instanceId);
  assert.equal(entry.targetPosition, 4);
  assert.equal(entry.before, 5);
  assert.equal(entry.after, 2);
  assert.equal(describeEffect(entry).change, "DEF restante 5 → 2");
  assert.match(describeEffect(entry).target, /Posición 4/);
});
test("prevented damage is presented as protection with unchanged defense", () => {
  const source = card("Flecha de Fuego Ancestral"), victim = card("Dragón Mecánico de Obsidiana", { position: 2 });
  const resolved = resolveGameAbility(ability(source), { ...context(source, {}, { field: [victim] }), target: { type: "CARD", instanceId: victim.instanceId } });
  const entry = resolved.logs.find(e => e.effect === "FIRST_DAMAGE_NEGATED")!;
  assert.equal(entry.before, entry.after);
  assert.equal(entry.amount, 3);
  assert.equal(entry.outcome, "PREVENTED");
  assert.equal(describeEffect(entry).tone, "protection");
  assert.equal(describeEffect(entry).label, "Daño evitado");
  assert.equal(entry.abilityName, "Armadura de Obsidiana");
  assert.equal(describeEffect(entry).source, victim.name);
});
test("card-draw feedback preserves the card and ability that caused the draw", () => {
  const source = card("Dron Explorador Elemental");
  const resolved = resolveGameAbility(ability(source), context(source, { field: [source], deck: [card("Mana de Fuego")] }));
  const entry = getLatestEffect(resolved.logs)!;
  assert.equal(describeEffect(entry).source, source.name);
  assert.equal(entry.abilityName, "Escaneo Táctico");
  assert.equal(entry.amount, 1);
  assert.equal(getAbilityTiming(entry.trigger!), "Cuando entra al campo");
});
test("the central feedback chooses a concrete result over a generic area-effect summary", () => {
  const source = card("Avatar del Sol Devastador"), victim = card("Guardián de la Caldera Eterna", { position: 5 });
  const resolved = resolveGameAbility(ability(source, "DAMAGE_3_ALL"), context(source, { field: [source] }, { field: [victim] }));
  const entries = resolved.logs.map(e => ({ ...e, batchId: "area-event" }));
  const latest = getLatestEffect(entries)!;
  assert.ok(latest.targetName);
  assert.notEqual(latest.message, source.name + " resuelve su daño en área.");
});

test("CPU deck has a legal Fire curve and real mana for every card", () => {
  const deck = generateCpuDeck(), main = deck.filter(c => c.cardType !== "MANA" && c.cardType !== "TIERRA");
  const lands = deck.filter(c => c.cardType === "MANA" || c.cardType === "TIERRA");
  assert.equal(main.length, CPU_DECK_PROFILE.mainCount);
  assert.equal(lands.length, CPU_DECK_PROFILE.manaCount);
  assert.equal(main.filter(c => c.cardType === "CRIATURA").length, 28);
  assert.equal(main.filter(c => c.cardType === "HECHIZO").length, 8);
  assert.equal(main.filter(c => c.cardType === "ALTERADOR").length, 4);
  assert.ok(main.filter(c => c.cardType === "CRIATURA" && c.cost <= 2).length >= 16);
  const limits: Record<string, number> = { COMUN: 4, INFRECUENTE: 4, RARA: 3, EPICA: 3, LEGENDARIA: 1, CELESTIAL: 1 };
  for (const definition of main) {
    assert.equal(definition.attribute, "FUEGO");
    assert.ok(definition.cost <= 6);
    assert.ok(main.filter(c => c.name === definition.name).length <= limits[definition.rarity]);
    assert.equal(canAffordCard(createGameCard(definition), lands.slice(0, definition.cost).map(createGameCard)), true, definition.name);
  }
  assert.ok(lands.every(c => c.name === "Mana de Fuego" && c.cost === 0 && c.cardType === "MANA"));
});

test("CPU deck fills incomplete API catalogs without altering definitions or inventing mana", () => {
  const supplied = { ...card("Dragón de Chispa"), id: "database-dragon", imageUrl: "/custom-dragon.webp" };
  const before = structuredClone(supplied), deck = generateCpuDeck([supplied]);
  assert.equal(deck.length, 62);
  assert.deepEqual(deck.map(c => c.name), generateCpuDeck().map(c => c.name));
  const copies = deck.filter(c => c.name === supplied.name);
  assert.ok(copies.every(c => c.id === supplied.id && c.imageUrl === supplied.imageUrl));
  copies[0].manaTypes.push("AGUA");
  copies[0].abilities![0].description = "Modified copy";
  assert.deepEqual(supplied, before);
  assert.deepEqual(copies[1].manaTypes, before.manaTypes);
  assert.deepEqual(copies[1].abilities, before.abilities);
});

test("CPU plays one real mana source at most once per turn", () => {
  const fake = card("Flecha de Fuego Ancestral", { cost: 0 }), source = card("Mana de Fuego");
  assert.equal(getCpuManaCardToPlay([fake], false), null);
  assert.equal(getCpuManaCardToPlay([fake, source], false), source);
  assert.equal(getCpuManaCardToPlay([source], true), null);
});

test("CPU plans account for payment and reserve separate creature positions", () => {
  const hand = [card("Dragón de Chispa"), card("Cría de Brasa")], zone = mana(3);
  const before = structuredClone({ hand, zone });
  const limited = getCpuSummonPlan(hand, zone, []);
  assert.equal(limited.length, 1);
  const enough = getCpuSummonPlan(hand, mana(4), []);
  assert.equal(enough.length, 2);
  assert.deepEqual(enough.map(c => c.position), [1, 2]);
  assert.deepEqual({ hand, zone }, before);
});

test("CPU continues looking for spells and fields when all creature positions are full", () => {
  const occupied = field(...Array.from({ length: 6 }, () => card("Dragón de Chispa")));
  const hand = [card("General Volcánico Kharzeth"), card("Orco Renacido por la Forja"), card("Estandarte de la Primera Llama"), card("Flecha de Fuego Ancestral")];
  const plan = getCpuSummonPlan(hand, mana(6), occupied, player());
  assert.deepEqual(new Set(plan.map(p => p.card.cardType)), new Set(["ALTERADOR", "HECHIZO"]));
  assert.ok(plan.every(p => p.position === undefined));
});

test("CPU casts lethal burn before developing another creature", () => {
  const burn = card("Flecha de Fuego Ancestral"), general = card("General Volcánico Kharzeth");
  assert.equal(getCpuSummonPlan([general, burn], mana(6), [], player({ life: 3 }))[0].card.instanceId, burn.instanceId);
});

test("CPU develops a Fire banner when several creatures benefit", () => {
  const allies = field(...Array.from({ length: 4 }, () => card("Dragón de Chispa")));
  const banner = card("Estandarte de la Primera Llama"), general = card("General Volcánico Kharzeth");
  assert.equal(getCpuSummonPlan([general, banner], mana(6), allies, player())[0].card.instanceId, banner.instanceId);
});

test("automatic damage targets close the game before removing a creature", () => {
  const source = card("Flecha de Fuego Ancestral"), victim = card("Soldado de Ceniza");
  assert.deepEqual(chooseAutomaticTarget(ability(source), context(source, {}, { life: 3, field: [victim] }), "PLAYER", source), { type: "PLAYER", player: "CPU" });
  const guardian = card("Dominus Volcánico Astravor");
  const protectedState = context(source, {}, { life: 3, field: [victim, guardian] });
  assert.deepEqual(chooseAutomaticTarget(ability(source), protectedState, "PLAYER", source), { type: "CARD", instanceId: guardian.instanceId });
});

test("automatic sacrifices use the fanatic and preserve the valuable dragon", () => {
  const source = card("Ofrenda al Sol Carmesí"), fanatic = card("Fanático de la Llama Solar"), dragon = card("General Volcánico Kharzeth");
  const ctx = context(source, { field: field(dragon, fanatic), deck: [card("Mana de Fuego")] });
  const target = chooseAutomaticTarget(ability(source), ctx, "PLAYER", source);
  assert.deepEqual(target, { type: "CARD", instanceId: fanatic.instanceId });
  const result = resolveGameAbility(ability(source), { ...ctx, target });
  assert.ok(result.player.field.some(c => c.instanceId === dragon.instanceId));
  assert.ok(result.queue.some(request => request.source.instanceId === fanatic.instanceId && request.ability.effect === "DAMAGE_2_PLAYER"));
});

test("presentation preserves a lethal target for damage, then destruction, without changing game state", () => {
  const source = card("Flecha de Fuego Ancestral"), victim = card("Soldado de Ceniza", { position: 3 });
  const ctx = context(source, {}, { field: [victim] });
  const result = resolveGameAbility(ability(source), { ...ctx, target: { type: "CARD", instanceId: victim.instanceId } });
  const frames = createBattlePresentations(ctx, result, result.logs);
  assert.deepEqual(frames.map(frame => frame.stage), ["CHANGE", "DESTRUCTION"]);
  assert.ok(frames[0].durationMs >= 2000);
  assert.ok(frames[1].durationMs >= 1500);
  assert.equal(frames[0].cpu.field[0].instanceId, victim.instanceId);
  assert.equal(frames[0].cpu.field[0].position, 3);
  assert.equal(getPresentedStat(frames[0], victim.instanceId, "DEFENSE"), 0);
  assert.equal(getEffectiveCardStats(frames[1].cpu.field[0], frames[1].cpu).remainingDefense, 0);
  assert.equal(result.cpu.field.length, 0);
  assert.equal(ctx.cpu.field[0].damageMarked ?? 0, 0);
});

test("simultaneous area damage highlights every target in one reading step", () => {
  const source = card("Avatar del Sol Devastador"), first = card("Guardián de la Caldera Eterna"), second = card("Orco Renacido por la Forja");
  const ctx = context(source, { field: [source] }, { field: field(first, second) });
  const result = resolveGameAbility(ability(source, "DAMAGE_3_ALL"), ctx);
  const frames = createBattlePresentations(ctx, result, result.logs);
  const damageFrame = frames.find(frame => frame.stage === "CHANGE")!;
  assert.ok(damageFrame.events.some(event => event.targetInstanceId === first.instanceId));
  assert.ok(damageFrame.events.some(event => event.targetInstanceId === second.instanceId));
  assert.equal(frames.filter(frame => frame.stage === "CHANGE").length, 1);
});

test("continuous buffs and their removal produce exact attack changes", () => {
  const creature = card("Soldado de Ceniza"), banner = card("Estandarte de la Primera Llama");
  const before = context(banner, { field: field(creature) });
  const after = context(banner, { field: field(creature, banner) });
  const added = describeStatChanges(before, after, []);
  assert.equal(added.length, 1);
  assert.equal(added[0].stat, "ATTACK");
  assert.equal(added[0].before, creature.attack);
  assert.equal(added[0].after, creature.attack! + 1);
  assert.equal(describeEffect(added[0]).tone, "buff");
  const removed = describeStatChanges(after, before, []);
  assert.equal(removed[0].after, creature.attack);
  assert.equal(describeEffect(removed[0]).tone, "damage");
});

test("turn cleanup shows healing marked damage and expiring attack bonuses", () => {
  const creature = card("Orco Renacido por la Forja", { damageMarked: 1, attackBonusThisTurn: 2 });
  const before = context(creature, { field: field(creature) });
  const after = { ...before, player: player({ field: resetFieldForNewTurn(before.player.field) }) };
  const changes = describeStatChanges(before, after, []);
  assert.equal(changes.find(event => event.stat === "ATTACK")!.after, creature.attack);
  const restored = changes.find(event => event.stat === "DEFENSE")!;
  assert.equal(restored.after! - restored.before!, 1);
  assert.equal(describeEffect(restored).tone, "heal");
});

test("existing damage and attack logs are not duplicated by change detection", () => {
  const source = card("Orco Renacido por la Forja");
  const ctx = context(source, { field: field(source) });
  const result = resolveGameAbility(ability(source, "BUFF_WHEN_DAMAGED"), ctx);
  assert.deepEqual(describeStatChanges(ctx, result, result.logs), []);
});

test("effect chains wait for damage feedback before applying on-damage attack bonuses", () => {
  const store = useGameStore;
  store.getState().resetGame();
  const spell = card("Flecha de Fuego Ancestral"), orc = card("Orco Renacido por la Forja", { defense: 5 });
  store.setState({ gameStarted: true, turn: "PLAYER", phase: "MAIN", player: player({ hand: [spell], manaZone: mana(1) }), cpu: player({ field: field(orc) }) });
  store.getState().setPresentationEnabled(true);
  try {
    store.getState().playCard("PLAYER", spell.instanceId);
    store.getState().resolvePendingEffect({ type: "CARD", instanceId: orc.instanceId });
    let state = store.getState();
    assert.equal(state.presentationQueue[0].stage, "ACTIVATION");
    assert.equal(state.cpu.field[0].damageMarked ?? 0, 0, "The source activates before the damage is shown");
    state.finishPresentation(state.presentationQueue[0].id);
    state = store.getState();
    const damage = state.presentationQueue[0];
    assert.ok(damage.events.some(event => event.stat === "DEFENSE"));
    assert.ok(state.effectQueue.some(request => request.ability.effect === "BUFF_WHEN_DAMAGED"));
    assert.equal(state.cpu.field[0].attackBonusThisTurn ?? 0, 0);
    state.finishPresentation("stale-event-id");
    assert.equal(store.getState().presentationQueue[0].id, damage.id);
    state.nextPhase();
    assert.equal(store.getState().phase, "MAIN", "Cannot skip the reading pause by advancing phase");
    state.finishPresentation(damage.id);
    state = store.getState();
    assert.equal(state.cpu.field[0].attackBonusThisTurn, 2);
    assert.equal(state.presentationQueue[0].events[0].stat, "ATTACK");
    state.finishPresentation(state.presentationQueue[0].id);
    assert.equal(store.getState().presentationQueue.length, 0);
    assert.equal(store.getState().effectQueue.length, 0);
  } finally {
    store.getState().resetGame();
    store.getState().setPresentationEnabled(false);
  }
});

test("lethal player damage is presented before the battle result and resets clear stale feedback", () => {
  const store = useGameStore;
  store.getState().resetGame();
  store.setState({ gameStarted: true, phase: "MAIN", player: player({ life: 2 }) });
  store.getState().setPresentationEnabled(true);
  try {
    store.getState().dealDamage("PLAYER", 3);
    const state = store.getState(), frame = state.presentationQueue[0];
    assert.equal(state.gameEnded, true);
    assert.equal(frame.events[0].stat, "LIFE");
    assert.equal(frame.events[0].before, 2);
    assert.equal(frame.events[0].after, 0);
    state.resetGame();
    assert.equal(store.getState().presentationQueue.length, 0);
    store.getState().finishPresentation(frame.id);
    assert.equal(store.getState().player.life, STARTING_LIFE);
  } finally {
    store.getState().resetGame();
    store.getState().setPresentationEnabled(false);
  }
});

test("the next combat attack waits until the current damage has been read", async () => {
  const store = useGameStore;
  store.getState().resetGame();
  store.setState({ gameStarted: true, phase: "COMBAT", turnNumber: 2,
    player: player({ field: field(card("Soldado de Ceniza", { attack: 4 }), card("Soldado de Ceniza", { attack: 4 })) }), cpu: player(),
  });
  store.getState().setPresentationEnabled(true);
  const combat = store.getState().executeAutoCombat();
  const waitForFrame = async () => {
    for (let i = 0; i < 80 && !store.getState().presentationQueue.length; i++) await new Promise(resolve => setTimeout(resolve, 25));
    assert.ok(store.getState().presentationQueue.length, "Combat should reach a damage reading step");
    return store.getState().presentationQueue[0];
  };
  try {
    const first = await waitForFrame();
    assert.equal(store.getState().cpu.life, STARTING_LIFE - 4);
    await new Promise(resolve => setTimeout(resolve, 300));
    assert.equal(store.getState().cpu.life, STARTING_LIFE - 4, "Second attacker must not race the damage notice");
    store.getState().finishPresentation(first.id);
    const second = await waitForFrame();
    assert.notEqual(second.id, first.id);
    assert.equal(store.getState().cpu.life, STARTING_LIFE - 8);
    store.getState().finishPresentation(second.id);
    await combat;
    assert.equal(store.getState().isCombatAnimation, false);
  } finally {
    store.getState().resetGame();
    store.getState().setPresentationEnabled(false);
    await combat;
  }
});

test("combat animation follows the actual blocker across lanes and reset cancels stale clashes", async () => {
  const store = useGameStore;
  store.getState().resetGame();
  const attacker = card("Soldado de Ceniza", { position: 1, canAttack: true });
  const blocker = card("Dominus Volcánico Astravor", { position: 6 });
  store.setState({ gameStarted: true, phase: "COMBAT", turnNumber: 2,
    player: player({ field: [attacker] }), cpu: player({ field: [blocker] }),
  });
  store.getState().setPresentationEnabled(true);
  const combat = store.getState().executeAutoCombat();
  try {
    for (let i = 0; i < 80 && !store.getState().combatAnimation; i++) await new Promise(resolve => setTimeout(resolve, 20));
    const animation = store.getState().combatAnimation;
    assert.ok(animation);
    assert.equal(animation.attackerId, attacker.instanceId);
    assert.deepEqual(animation.blockerIds, [blocker.instanceId]);
    assert.equal(animation.controller, "PLAYER");
    assert.equal(store.getState().player.field[0].damageMarked ?? 0, 0, "Damage waits for the clash to finish");
    store.getState().resetGame();
    assert.equal(store.getState().combatAnimation, null);
    await combat;
    assert.equal(store.getState().combatAnimation, null);
    assert.equal(store.getState().player.life, STARTING_LIFE);
    assert.equal(store.getState().effectLog.length, 0, "A cancelled clash cannot commit damage into the next session");
  } finally {
    store.getState().resetGame();
    store.getState().setPresentationEnabled(false);
    await combat;
  }
});

test("double attacks receive distinct clashes and never replay during damage presentation", async () => {
  const store = useGameStore;
  store.getState().resetGame();
  const attacker = card("General Volcánico Kharzeth", { position: 1, canAttack: true });
  const ally = card("Dragón de Chispa", { position: 2, attacksMade: 2 });
  store.setState({ gameStarted: true, phase: "COMBAT", turnNumber: 2,
    player: player({ field: [attacker, ally] }), cpu: player(),
  });
  store.getState().setPresentationEnabled(true);
  const combat = store.getState().executeAutoCombat();
  const waitUntil = async (predicate: () => boolean) => {
    for (let i = 0; i < 100 && !predicate(); i++) await new Promise(resolve => setTimeout(resolve, 20));
    assert.ok(predicate(), "Combat should reach the expected animation step");
  };
  try {
    await waitUntil(() => Boolean(store.getState().combatAnimation));
    const first = store.getState().combatAnimation!;
    assert.deepEqual(first.blockerIds, []);
    assert.equal(store.getState().cpu.life, STARTING_LIFE);
    await waitUntil(() => Boolean(store.getState().presentationQueue.length));
    assert.equal(store.getState().combatAnimation, null);
    assert.equal(store.getState().cpu.life, STARTING_LIFE - 5);
    store.getState().finishPresentation(store.getState().presentationQueue[0].id);
    await waitUntil(() => Boolean(store.getState().combatAnimation));
    const second = store.getState().combatAnimation!;
    assert.notEqual(second.id, first.id, "The same card must animate again for its second attack");
    assert.equal(second.attackerId, attacker.instanceId);
    await waitUntil(() => Boolean(store.getState().presentationQueue.length));
    assert.equal(store.getState().combatAnimation, null);
    assert.equal(store.getState().cpu.life, STARTING_LIFE - 10);
    store.getState().finishPresentation(store.getState().presentationQueue[0].id);
    await combat;
    assert.equal(store.getState().combatAnimation, null);
    assert.equal(store.getState().isCombatAnimation, false);
  } finally {
    store.getState().resetGame();
    store.getState().setPresentationEnabled(false);
    await combat;
  }
});

test("animated stats keep the old value for activation, then count to the exact final value", () => {
  assert.equal(getAnimatedStatValue(4, 5, 0), 4);
  assert.equal(getAnimatedStatValue(4, 5, STAT_ANIMATION.activationMs), 4);
  assert.equal(getAnimatedStatValue(4, 5, STAT_ANIMATION.totalMs), 5);
  const falling = Array.from({ length: 101 }, (_, step) => getAnimatedStatValue(20, 0, step * 20));
  assert.equal(falling[0], 20);
  assert.equal(falling.at(-1), 0);
  assert.ok(falling.every((value, index) => Number.isInteger(value) && value >= 0 && value <= 20 && (!index || value <= falling[index - 1])));
});

test("spell animation can identify the source after it moves to the graveyard", () => {
  const source = card("Flecha de Fuego Ancestral"), victim = card("Guardián de la Caldera Eterna");
  const ctx = context(source, { graveyard: [source] }, { field: field(victim) });
  const result = resolveGameAbility(ability(source), { ...ctx, target: { type: "CARD", instanceId: victim.instanceId } });
  const frame = createBattlePresentations(ctx, result, result.logs)[0], event = frame.events[0];
  assert.equal(findEffectSourceCard(frame, event)?.instanceId, source.instanceId);
  assert.deepEqual(getEffectLinks(frame.events).map(link => [link.sourceId, link.targetId]), [[source.instanceId, victim.instanceId]]);
  assert.equal(getEffectCue(event).tone, "damage");
});

test("field buffs connect their actual source to every affected creature, without duplicate beams", () => {
  const source = card("Estandarte de la Primera Llama"), first = card("Soldado de Ceniza"), second = card("Cría de Brasa");
  const before = context(source, { field: field(first, second), hand: [source] });
  const after = context(source, { field: field(first, second, source) });
  const logs = [{ id: "field-entry", controller: "PLAYER" as const, source: source.name, sourceInstanceId: source.instanceId, effect: "SUMMON", message: "Entra al campo" }];
  const changes = describeStatChanges(before, after, logs), links = getEffectLinks([...changes, ...changes]);
  assert.equal(links.length, 2);
  assert.ok(links.every(link => link.sourceId === source.instanceId && link.tone === "buff"));
  assert.deepEqual(new Set(links.map(link => link.targetId)), new Set([first.instanceId, second.instanceId]));
});

test("player damage connects to the life counter, and self-buffs do not draw a false connection", () => {
  const source = card("Cazador de Chispas");
  const ctx = context(source, { field: field(source) });
  const damage = resolveGameAbility(ability(source), ctx);
  const link = getEffectLinks(damage.logs)[0];
  assert.equal(link.sourceId, source.instanceId);
  assert.equal(link.targetPlayer, "CPU");
  const orc = card("Orco Renacido por la Forja"), own = context(orc, { field: field(orc) });
  const buff = resolveGameAbility(ability(orc), own);
  assert.equal(getEffectLinks(buff.logs).length, 0);
});

test("healing and defensive bonuses use different animation cues", () => {
  const source = card("Santuario de los Ancestros"), human = card("Soldado de Ceniza");
  const before = context(source, { field: field(human) });
  const after = context(source, { field: field(human, source) });
  const bonus = describeStatChanges(before, after, []).find(event => event.stat === "DEFENSE")!;
  assert.equal(getEffectCue(bonus).tone, "buff");
  const damaged = { ...human, damageMarked: 1 };
  const hurt = context(source, { field: field(damaged) });
  const restored = describeStatChanges(hurt, before, []).find(event => event.stat === "DEFENSE")!;
  assert.equal(getEffectCue(restored).tone, "heal");
});

test("non-numeric abilities get an activation step, while skipped effects do not", () => {
  const source = card("Dron Explorador Elemental");
  const ctx = context(source, { field: field(source), deck: [card("Mana de Fuego")] });
  const result = resolveGameAbility(ability(source), ctx);
  const frames = createBattlePresentations(ctx, result, result.logs);
  assert.equal(frames[0].stage, "ACTIVATION");
  assert.equal(findEffectSourceCard(frames[0], frames[0].events[0])?.instanceId, source.instanceId);
  assert.equal(getEffectCue(frames[0].events[0]).tone, "draw");
  assert.deepEqual(createBattlePresentations(ctx, ctx, result.logs.map(log => ({ ...log, outcome: "SKIPPED" as const }))), []);
});

test("both sides start with 25 life and a maximum of 25", () => {
  const initial = createInitialPlayers([], []);
  for (const owner of [initial.player, initial.cpu]) {
    assert.equal(owner.life, 25);
    assert.equal(owner.maxLife, 25);
  }
});

test("healing cannot exceed 25 life and logs only the life actually restored", () => {
  const source = card("Santuario de los Ancestros"), humans = field(card("Soldado de Ceniza"), card("Guerrero Humano del Yermo"));
  for (const controller of ["PLAYER", "CPU"] as const) {
    const own = player({ life: 24, field: [...humans, source] });
    const state = { player: controller === "PLAYER" ? own : player(), cpu: controller === "CPU" ? own : player() };
    const result = resolveGameAbility(ability(source, "LIFE_GAIN_PER_SUBTYPE"), { ...state, controller, source });
    const healed = controller === "PLAYER" ? result.player : result.cpu;
    assert.equal(healed.life, 25);
    assert.equal(result.logs.find(event => event.stat === "LIFE")?.amount, 1);
    const full = resolveGameAbility(ability(source, "LIFE_GAIN_PER_SUBTYPE"), { ...result, controller, source });
    assert.equal((controller === "PLAYER" ? full.player : full.cpu).life, 25);
    assert.equal(full.logs.find(event => event.stat === "LIFE")?.amount, 0);
  }
});

test("Volcán del fin is an Epic Fire field in Volcán Dormido and requires two Fire payments", () => {
  const volcano = card("Volcán del fin");
  assert.equal(volcano.cardType, "ALTERADOR");
  assert.equal(volcano.rarity, "EPICA");
  assert.equal(volcano.attribute, "FUEGO");
  assert.equal(getCardExpansionKey(volcano.name), "VOLCAN_DORMIDO");
  assert.equal(volcano.cost, 2);
  assert.equal(canAffordCard(volcano, mana(1)), false);
  assert.equal(canAffordCard(volcano, [...mana(1), ...mana(1, "Mana de Agua")]), false);
  const sources = [...mana(1, "Santuario de Fuego"), ...mana(1)];
  assert.equal(canAffordCard(volcano, sources), true);
  const payment = planManaPayment(sources, volcano.manaTypes, volcano.cost, volcano.rarity)!;
  assert.equal(payment.length, 2);
  assert.equal(new Set(payment).size, 2);
});

test("the volcano can sacrifice any creature and puts one basic Fire mana in hand", () => {
  const source = card("Volcán del fin"), victim = card("Dron de Reparación"), fire = card("Mana de Fuego"), shrine = card("Santuario de Fuego");
  const ctx = context(source, { field: field(source, victim), deck: [shrine, card("Mana de Agua"), fire], manaZone: mana(2) });
  const result = resolveGameAbility(ability(source, "SACRIFICE_SEARCH_FIRE_MANA"), { ...ctx, target: { type: "CARD", instanceId: victim.instanceId } });
  assert.equal(result.player.hand[0].instanceId, fire.instanceId);
  assert.ok(result.player.deck.some(c => c.instanceId === shrine.instanceId));
  assert.ok(!result.player.deck.some(c => c.instanceId === fire.instanceId));
  assert.equal(result.player.manaZone.length, 2);
  assert.ok(result.player.field.some(c => c.instanceId === source.instanceId));
  assert.ok(result.player.graveyard.some(c => c.instanceId === victim.instanceId));
});

test("volcano activation rejects enemy creatures and fields as sacrifices", () => {
  const source = card("Volcán del fin"), enemy = card("Soldado de Ceniza"), support = card("Estandarte de la Primera Llama");
  const ctx = context(source, { field: [source, support] }, { field: field(enemy) });
  const activation = ability(source, "SACRIFICE_SEARCH_FIRE_MANA");
  assert.equal(getEffectSelectionGroups(activation, ctx, "PLAYER", source)[0].options.length, 0);
  assert.equal(isValidEffectTarget(activation, ctx, "PLAYER", source, { type: "CARD", instanceId: enemy.instanceId }), false);
  assert.equal(isValidEffectTarget(activation, ctx, "PLAYER", source, { type: "CARD", instanceId: support.instanceId }), false);
});

test("a missing Fire mana does not turn the volcano search into an empty-deck draw loss", () => {
  const source = card("Volcán del fin"), victim = card("Fanático de la Llama Solar");
  const ctx = context(source, { field: field(source, victim), deck: [] });
  const result = resolveGameAbility(ability(source), { ...ctx, target: { type: "CARD", instanceId: victim.instanceId } });
  assert.equal(result.player.life, STARTING_LIFE);
  assert.equal(result.player.hand.length, 0);
  assert.ok(result.queue.some(request => request.ability.effect === "DAMAGE_2_PLAYER"));
});

test("volcano activation can be used only once per turn and becomes available next turn", () => {
  const store = useGameStore;
  store.getState().resetGame();
  const source = card("Volcán del fin"), first = card("Soldado de Ceniza"), second = card("Dron de Reparación");
  store.setState({ gameStarted: true, phase: "MAIN", player: player({ field: field(source, first, second), deck: mana(2) }) });
  try {
    store.getState().activateAbility("PLAYER", source.instanceId);
    store.getState().resolvePendingEffect({ type: "CARD", instanceId: first.instanceId });
    assert.equal(store.getState().player.hand.length, 1);
    assert.equal(store.getState().player.field.find(c => c.instanceId === source.instanceId)?.activatedThisTurn, true);
    store.getState().activateAbility("PLAYER", source.instanceId);
    assert.equal(store.getState().pendingEffect, null);
    assert.equal(store.getState().player.hand.length, 1);
    store.setState({ player: { ...store.getState().player, field: resetFieldForNewTurn(store.getState().player.field) } });
    store.getState().activateAbility("PLAYER", source.instanceId);
    store.getState().resolvePendingEffect({ type: "CARD", instanceId: second.instanceId });
    assert.equal(store.getState().player.hand.length, 2);
  } finally { store.getState().resetGame(); }
});

test("a destroyed volcano clears all friendly creatures and fields before the dragon choice, keeping mana and enemy cards", () => {
  const store = useGameStore;
  store.getState().resetGame();
  const source = card("Volcán del fin"), creature = card("Soldado de Ceniza"), support = card("Estandarte de la Primera Llama");
  const first = card("Dragón Volcánico"), chosen = card("Dragón Mecánico de Obsidiana"), lands = mana(3);
  const opponent = player({ field: field(card("Soldado de Ceniza"), card("Forja de la Brasa")), manaZone: mana(2) });
  store.setState({ gameStarted: true, phase: "MAIN", player: player({ field: field(source, creature, support), manaZone: lands, deck: [first, chosen] }), cpu: opponent });
  try {
    store.getState().destroyCard("PLAYER", source.instanceId);
    let state = store.getState();
    assert.equal(state.player.field.length, 0);
    assert.equal(state.player.graveyard.length, 3);
    assert.deepEqual(state.player.manaZone, lands);
    assert.deepEqual(state.cpu, opponent);
    assert.equal(state.pendingEffect?.ability.effect, "SEARCH_DRAGON_FROM_DECK");
    assert.deepEqual(new Set(state.pendingEffect?.options.map(option => option.card?.instanceId)), new Set([first.instanceId, chosen.instanceId]));
    state.resolvePendingEffect({ type: "CARD", instanceId: chosen.instanceId });
    state = store.getState();
    assert.equal(state.player.hand[0].instanceId, chosen.instanceId);
    assert.equal(state.player.deck[0].instanceId, first.instanceId);
    assert.equal(state.pendingEffect, null);
  } finally { store.getState().resetGame(); }
});

test("volcano destruction still clears its field when no dragon remains", () => {
  const store = useGameStore;
  store.getState().resetGame();
  const source = card("Volcán del fin");
  store.setState({ gameStarted: true, phase: "MAIN", player: player({ field: field(source, card("Soldado de Ceniza"), card("Estandarte de la Primera Llama")), manaZone: mana(2), deck: [] }) });
  try {
    store.getState().destroyCard("PLAYER", source.instanceId);
    assert.equal(store.getState().player.field.length, 0);
    assert.equal(store.getState().player.manaZone.length, 2);
    assert.equal(store.getState().player.life, STARTING_LIFE);
    assert.equal(store.getState().pendingEffect, null);
    assert.equal(store.getState().effectQueue.length, 0);
  } finally { store.getState().resetGame(); }
});

test("only one volcano per controller can enter, including through free field effects", () => {
  const first = card("Volcán del fin"), second = card("Volcán del fin");
  const ctx = context(second, { field: [first], hand: [second], manaZone: mana(4) });
  assert.match(getPlayRestriction(ctx, "PLAYER", second)!, /activo/);
  const rejected = summonFromZone(ctx, "PLAYER", second, "hand");
  assert.equal(rejected.player.field.length, 1);
  assert.equal(rejected.player.hand[0].instanceId, second.instanceId);
  assert.equal(rejected.logs[0].outcome, "SKIPPED");
  const architect = card("El Arquitecto del Armagedón Fable");
  const free = ability(architect, "PLAY_FIELD_ALTERERS_FREE");
  assert.equal(getEffectSelectionGroups(free, ctx, "PLAYER", architect)[0].options.length, 0);
  const independent = context(second, { hand: [second], manaZone: mana(2) }, { field: [first] });
  assert.equal(getPlayRestriction(independent, "PLAYER", second), null);
  assert.equal(summonFromZone(independent, "PLAYER", second, "hand").player.field.length, 1);
});

test("CPU plans never include a second active volcano and can resolve its death search", () => {
  const first = card("Volcán del fin"), second = card("Volcán del fin");
  assert.equal(getCpuSummonPlan([first, second], mana(4), []).length, 1);
  assert.equal(getCpuSummonPlan([second], mana(4), [first]).length, 0);
  const store = useGameStore;
  store.getState().resetGame();
  const dragon = card("General Volcánico Kharzeth");
  store.setState({ gameStarted: true, turn: "CPU", phase: "MAIN", cpu: player({ field: field(first, card("Soldado de Ceniza")), deck: [dragon], manaZone: mana(2) }) });
  try {
    store.getState().destroyCard("CPU", first.instanceId);
    assert.equal(store.getState().cpu.field.length, 0);
    assert.equal(store.getState().cpu.hand[0].instanceId, dragon.instanceId);
    assert.equal(store.getState().cpu.manaZone.length, 2);
    assert.equal(store.getState().pendingEffect, null);
  } finally { store.getState().resetGame(); }
});

test("Caracol Volcánico has its printed stats and the new Alimaña subtype", () => {
  const snail = card("Caracol Volcánico");
  assert.equal(snail.cardType, "CRIATURA");
  assert.equal(snail.rarity, "RARA");
  assert.equal(snail.attribute, "FUEGO");
  assert.equal(snail.cost, 1);
  assert.equal(snail.attack, 1);
  assert.equal(snail.defense, 4);
  assert.deepEqual(snail.manaTypes, ["FUEGO"]);
  assert.deepEqual(snail.subtypes, ["ALIMANA"]);
  assert.equal(getCardExpansionKey(snail.name), "VOLCAN_DORMIDO");
  assert.ok(CREATURE_SUBTYPE_KEYS.includes("ALIMANA"));
  assert.equal(getSubtypeLabel("ALIMANA"), "Alimaña");
  assert.equal(getSubtypeLabel("ALIMANA", "en"), "Vermin");
  assert.equal(subtypeOf({ name: "Alimañas", description: "Tus alimañas ganan +1 DEF", trigger: "CONTINUO", effect: "BUFF_SUBTYPE_DEFENSE" }), "ALIMANA");
});

test("the snail offers zero or one creature of printed cost two or less, of any element", () => {
  const snail = card("Caracol Volcánico"), basic = card("Mana de Fuego"), spell = card("Flecha de Fuego Ancestral");
  const creature = card("Dragón de Chispa"), support = card("Estandarte de la Primera Llama");
  const free = card("Soldado de Ceniza", { cost: 0 }), earth = card("Golem de Tierra Despertado", { cost: 1 });
  const expensive = card("Guerrero Humano del Yermo", { cost: 3 });
  const ctx = context(snail, { deck: [basic, spell, creature, support, expensive, free, earth], field: [card("Campo de Energía Primitiva")] });
  assert.equal(getEffectiveCost(expensive, ctx.player.field), 2);
  const group = getEffectSelectionGroups(ability(snail), ctx, "PLAYER", snail)[0];
  assert.equal(group.min, 0);
  assert.equal(group.max, 1);
  assert.deepEqual(new Set(group.options.map(option => option.card?.instanceId)), new Set([creature.instanceId, free.instanceId, earth.instanceId]));
});

test("the snail moves only the chosen deck card to the graveyard without drawing or sacrificing it", () => {
  const snail = card("Caracol Volcánico"), selected = card("Soldado de Ceniza"), retained = card("Mana de Fuego");
  const ctx = context(snail, { deck: [retained, selected], graveyard: [snail], hand: [card("Mana de Agua")] });
  const snapshot = structuredClone({ player: ctx.player, cpu: ctx.cpu });
  const result = resolveGameAbility(ability(snail), { ...ctx, target: { type: "CARD", instanceId: selected.instanceId } });
  assert.deepEqual(result.player.deck, [retained]);
  assert.deepEqual(result.player.graveyard, [snail, selected]);
  assert.deepEqual(result.player.hand, ctx.player.hand);
  assert.equal(result.player.life, STARTING_LIFE);
  assert.equal(result.queue.length, 0);
  assert.equal(result.logs[0].targetZone, "DECK");
  assert.match(describeEffect(result.logs[0]).target, /Tu mazo/);
  assert.ok(!result.logs.some(log => log.effect === "SACRIFICE"));
  assert.deepEqual({ player: ctx.player, cpu: ctx.cpu }, snapshot);
});

test("the snail can decline its effect and cannot target other zones, costly cards or multiple cards", () => {
  const snail = card("Caracol Volcánico"), low = card("Dragón de Chispa"), high = card("General Volcánico Kharzeth");
  const basic = card("Mana de Fuego"), spell = card("Flecha de Fuego Ancestral"), support = card("Volcán del fin");
  const fieldCard = card("Soldado de Ceniza"), handCard = card("Dragón de Chispa"), enemy = card("Mana de Agua");
  const ctx = context(snail, { deck: [low, high, basic, spell, support], field: field(fieldCard), hand: [handCard] }, { deck: [enemy] });
  for (const id of [high.instanceId, fieldCard.instanceId, handCard.instanceId, enemy.instanceId, basic.instanceId, spell.instanceId, support.instanceId]) {
    const result = resolveGameAbility(ability(snail), { ...ctx, target: { type: "CARD", instanceId: id } });
    assert.equal(result.handled, false);
    assert.deepEqual(result.player, ctx.player);
    assert.deepEqual(result.cpu, ctx.cpu);
  }
  assert.equal(isValidEffectTarget(ability(snail), ctx, "PLAYER", snail, { type: "CARDS", instanceIds: [low.instanceId, high.instanceId] }), false);
  const skip = resolveGameAbility(ability(snail), { ...ctx, target: { type: "CARDS", instanceIds: [] } });
  assert.equal(skip.handled, true);
  assert.equal(skip.logs[0].outcome, "SKIPPED");
  assert.deepEqual(skip.player, ctx.player);
});

test("snail death waits for an optional choice and empty decks do not block or cause a draw loss", () => {
  const store = useGameStore;
  store.getState().resetGame();
  const snail = card("Caracol Volcánico"), target = card("Dragón de Chispa");
  store.setState({ gameStarted: true, phase: "MAIN", player: player({ field: field(snail), deck: [target] }) });
  try {
    store.getState().destroyCard("PLAYER", snail.instanceId);
    assert.equal(store.getState().pendingEffect?.ability.effect, "DESTROY_LOW_COST_CREATURE_FROM_DECK");
    assert.equal(store.getState().pendingEffect?.groups?.[0].min, 0);
    store.getState().resolvePendingEffect({ type: "CARD", instanceId: target.instanceId });
    assert.equal(store.getState().player.deck.length, 0);
    assert.equal(store.getState().player.graveyard.length, 2);
    assert.equal(store.getState().pendingEffect, null);
    assert.equal(store.getState().gameEnded, false);
    store.getState().resetGame();
    const second = card("Caracol Volcánico");
    store.setState({ gameStarted: true, phase: "MAIN", player: player({ field: [second], deck: [] }) });
    store.getState().destroyCard("PLAYER", second.instanceId);
    assert.equal(store.getState().pendingEffect, null);
    assert.equal(store.getState().effectQueue.length, 0);
    assert.equal(store.getState().player.life, STARTING_LIFE);
  } finally { store.getState().resetGame(); }
});

test("CPU uses the snail to prepare a revival and otherwise preserves its deck", () => {
  const snail = card("Caracol Volcánico"), basic = card("Mana de Fuego"), creature = card("Dragón de Chispa");
  const ctx = context(snail, {}, { deck: [basic, creature] });
  assert.deepEqual(chooseAutomaticTarget(ability(snail), ctx, "CPU", snail), { type: "CARDS", instanceIds: [] });
  ctx.cpu.hand.push(card("Sumo Hierofante Pyrothar"));
  assert.deepEqual(chooseAutomaticTarget(ability(snail), ctx, "CPU", snail), { type: "CARD", instanceId: creature.instanceId });
});

test("destroying another snail from the deck queues exactly its own death ability", () => {
  const source = card("Caracol Volcánico"), other = card("Caracol Volcánico");
  const ctx = context(source, { graveyard: [source], deck: [other] });
  const result = resolveGameAbility(ability(source), { ...ctx, target: { type: "CARD", instanceId: other.instanceId } });
  assert.equal(result.player.deck.length, 0);
  assert.equal(result.player.graveyard.length, 2);
  assert.equal(result.queue.length, 1);
  assert.equal(result.queue[0].source.instanceId, other.instanceId);
  assert.equal(result.queue[0].ability.effect, "DESTROY_LOW_COST_CREATURE_FROM_DECK");
  assert.equal(result.logs[0].originInstanceId, source.instanceId);
});

test("a rejected field target leaves the snail choice pending until a creature is chosen", () => {
  const store = useGameStore;
  store.getState().resetGame();
  const snail = card("Caracol Volcánico"), volcano = card("Volcán del fin"), dragon = card("Dragón de Chispa");
  store.setState({ gameStarted: true, phase: "MAIN", player: player({ field: [snail], deck: [volcano, dragon] }) });
  try {
    store.getState().destroyCard("PLAYER", snail.instanceId);
    store.getState().resolvePendingEffect({ type: "CARD", instanceId: volcano.instanceId });
    assert.equal(store.getState().pendingEffect?.ability.effect, "DESTROY_LOW_COST_CREATURE_FROM_DECK");
    assert.equal(store.getState().player.deck.length, 2);
    store.getState().resolvePendingEffect({ type: "CARD", instanceId: dragon.instanceId });
    assert.equal(store.getState().player.deck[0].instanceId, volcano.instanceId);
    assert.ok(store.getState().player.graveyard.some(card => card.instanceId === dragon.instanceId));
    assert.equal(store.getState().pendingEffect, null);
  } finally { store.getState().resetGame(); }
});

test("sacrificing the snail to Volcán del fin searches mana then offers only the low-cost creature for destruction", () => {
  const store = useGameStore;
  store.getState().resetGame();
  const volcano = card("Volcán del fin"), snail = card("Caracol Volcánico"), dragon = card("Dragón de Chispa"), lands = mana(2);
  store.setState({ gameStarted: true, phase: "MAIN", player: player({ field: field(volcano, snail), deck: [...lands, dragon] }) });
  try {
    store.getState().activateAbility("PLAYER", volcano.instanceId);
    store.getState().resolvePendingEffect({ type: "CARD", instanceId: snail.instanceId });
    assert.equal(store.getState().player.hand[0].instanceId, lands[0].instanceId);
    assert.equal(store.getState().pendingEffect?.ability.effect, "DESTROY_LOW_COST_CREATURE_FROM_DECK");
    assert.deepEqual(store.getState().pendingEffect?.options.map(option => option.card?.instanceId), [dragon.instanceId]);
    store.getState().resolvePendingEffect({ type: "CARD", instanceId: dragon.instanceId });
    assert.equal(store.getState().player.deck[0].instanceId, lands[1].instanceId);
    assert.deepEqual(store.getState().player.field.map(card => card.instanceId), [volcano.instanceId]);
    assert.equal(store.getState().player.graveyard.length, 2);
    assert.equal(store.getState().pendingEffect, null);
  } finally { store.getState().resetGame(); }
});

test("destroying the volcanic egg from the deck queues inheritance without hatching or sacrifice", () => {
  const source = card("Caracol Volcánico"), egg = card("Huevo de Dragón Volcánico"), dragon = card("Dragón Volcánico");
  const ctx = context(source, { deck: [egg, dragon], graveyard: [source] });
  const snapshot = structuredClone({ player: ctx.player, cpu: ctx.cpu });
  const result = resolveGameAbility(ability(source), { ...ctx, target: { type: "CARD", instanceId: egg.instanceId } });
  assert.deepEqual(result.player.deck, [dragon]);
  assert.deepEqual(result.player.graveyard, [source, egg]);
  assert.equal(result.queue.length, 1);
  assert.equal(result.queue[0].source.instanceId, egg.instanceId);
  assert.equal(result.queue[0].ability.name, "Herencia Ígnea");
  assert.equal(result.queue[0].ability.effect, "DRAW_SPECIFIC_CARD_FROM_DECK");
  assert.equal(result.queue[0].controller, "PLAYER");
  assert.deepEqual({ player: ctx.player, cpu: ctx.cpu }, snapshot);
});

test("the full snail-to-egg chain adds the volcanic dragon to the player's hand exactly once", () => {
  const store = useGameStore;
  store.getState().resetGame();
  const source = card("Caracol Volcánico"), egg = card("Huevo de Dragón Volcánico"), secondEgg = card("Huevo de Dragón Volcánico"), dragon = card("Dragón Volcánico");
  store.setState({ gameStarted: true, phase: "MAIN", player: player({ field: [source], deck: [egg, secondEgg, dragon] }) });
  try {
    store.getState().destroyCard("PLAYER", source.instanceId);
    store.getState().resolvePendingEffect({ type: "CARD", instanceId: egg.instanceId });
    const state = store.getState();
    assert.deepEqual(state.player.hand.map(card => card.instanceId), [dragon.instanceId]);
    assert.deepEqual(state.player.deck.map(card => card.instanceId), [secondEgg.instanceId]);
    assert.deepEqual(state.player.graveyard.map(card => card.instanceId), [source.instanceId, egg.instanceId]);
    assert.equal(state.player.field.length, 0, "Destroying an egg is not summoning it");
    assert.equal(state.pendingEffect, null);
    assert.equal(state.effectQueue.length, 0);
    assert.equal(state.effectLog.filter(entry => entry.effect === "DRAW_SPECIFIC_CARD_FROM_DECK").length, 1);
    assert.ok(state.effectLog.some(entry => entry.abilityName === "Herencia Ígnea" && entry.targetInstanceId === dragon.instanceId));
    const inheritance = state.effectLog.find(entry => entry.abilityName === "Herencia Ígnea" && entry.targetInstanceId === dragon.instanceId)!;
    assert.equal(inheritance.targetZone, "HAND");
    assert.match(describeEffect(inheritance).target, /Tu mano/);
  } finally { store.getState().resetGame(); }
});

test("egg destruction with no volcanic dragon left completes without drawing another card or causing a deck loss", () => {
  const store = useGameStore;
  store.getState().resetGame();
  const source = card("Caracol Volcánico"), egg = card("Huevo de Dragón Volcánico");
  store.setState({ gameStarted: true, phase: "MAIN", player: player({ field: [source], deck: [egg] }) });
  try {
    store.getState().destroyCard("PLAYER", source.instanceId);
    store.getState().resolvePendingEffect({ type: "CARD", instanceId: egg.instanceId });
    assert.equal(store.getState().player.hand.length, 0);
    assert.equal(store.getState().player.life, STARTING_LIFE);
    assert.equal(store.getState().gameEnded, false);
    assert.equal(store.getState().pendingEffect, null);
    assert.equal(store.getState().effectQueue.length, 0);
    assert.ok(store.getState().effectLog.some(entry => entry.abilityName === "Herencia Ígnea" && entry.message.includes("No queda")));
  } finally { store.getState().resetGame(); }
});

test("CPU recognizes the egg inheritance combo when deciding the snail target", () => {
  const store = useGameStore;
  store.getState().resetGame();
  const source = card("Caracol Volcánico"), egg = card("Huevo de Dragón Volcánico"), dragon = card("Dragón Volcánico");
  store.setState({ gameStarted: true, turn: "CPU", phase: "MAIN", cpu: player({ field: [source], deck: [egg, dragon] }) });
  try {
    store.getState().destroyCard("CPU", source.instanceId);
    assert.deepEqual(store.getState().cpu.hand.map(card => card.instanceId), [dragon.instanceId]);
    assert.equal(store.getState().cpu.graveyard.length, 2);
    assert.equal(store.getState().pendingEffect, null);
    assert.equal(store.getState().effectQueue.length, 0);
  } finally { store.getState().resetGame(); }
});

test("snail chains consume distinct deck copies and stop after the last egg resolves", () => {
  const store = useGameStore;
  store.getState().resetGame();
  const source = card("Caracol Volcánico"), second = card("Caracol Volcánico"), third = card("Caracol Volcánico");
  const egg = card("Huevo de Dragón Volcánico"), dragon = card("Dragón Volcánico");
  store.setState({ gameStarted: true, phase: "MAIN", player: player({ field: [source], deck: [second, third, egg, dragon] }) });
  try {
    store.getState().destroyCard("PLAYER", source.instanceId);
    for (const [current, target] of [[source, second], [second, third], [third, egg]]) {
      assert.equal(store.getState().pendingEffect?.source.instanceId, current.instanceId);
      store.getState().resolvePendingEffect({ type: "CARD", instanceId: target.instanceId });
    }
    assert.equal(store.getState().player.deck.length, 0);
    assert.equal(new Set(store.getState().player.graveyard.map(card => card.instanceId)).size, 4);
    assert.deepEqual(store.getState().player.hand.map(card => card.instanceId), [dragon.instanceId]);
    assert.equal(store.getState().pendingEffect, null);
    assert.equal(store.getState().effectQueue.length, 0);
    assert.equal(store.getState().gameEnded, false);
  } finally { store.getState().resetGame(); }
});

test("a snail chain can be declined and an already destroyed egg cannot trigger twice", () => {
  const source = card("Caracol Volcánico"), second = card("Caracol Volcánico"), egg = card("Huevo de Dragón Volcánico");
  const store = useGameStore;
  store.getState().resetGame();
  store.setState({ gameStarted: true, phase: "MAIN", player: player({ field: [source], deck: [second, egg] }) });
  try {
    store.getState().destroyCard("PLAYER", source.instanceId);
    store.getState().resolvePendingEffect({ type: "CARD", instanceId: second.instanceId });
    store.getState().resolvePendingEffect({ type: "CARDS", instanceIds: [] });
    assert.equal(store.getState().player.deck[0].instanceId, egg.instanceId);
    assert.equal(store.getState().pendingEffect, null);
  } finally { store.getState().resetGame(); }
  const ctx = context(source, { deck: [egg] });
  const first = destroyDeckCards(ctx, "PLAYER", [egg.instanceId, egg.instanceId]);
  assert.equal(first.queue.length, 1);
  const repeated = destroyDeckCards(first, "PLAYER", [egg.instanceId]);
  assert.equal(repeated.queue.length, 0);
  assert.equal(repeated.player.graveyard.length, 1);
});

test("destroying a Fire creature from the deck notifies each field watcher without sacrifice events", () => {
  const egg = card("Huevo de Dragón Volcánico"), first = card("Guardián de la Caldera Eterna"), second = card("Guardián de la Caldera Eterna");
  const ctx = context(egg, { deck: [egg], field: [first] }, { field: [second] });
  const result = destroyDeckCards(ctx, "PLAYER", [egg.instanceId]);
  assert.equal(result.queue.filter(request => request.ability.trigger === "ON_DEATH").length, 1);
  assert.equal(result.queue.filter(request => request.ability.trigger === "ON_FIRE_DESTROYED").length, 2);
  assert.ok(!result.queue.some(request => request.ability.trigger.startsWith("ON_SACRIFICE")));
});
