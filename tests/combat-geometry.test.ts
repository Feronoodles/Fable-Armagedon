import test from "node:test";
import assert from "node:assert/strict";
import { COMBAT_CARD_SCALE, getCombatGeometry } from "../src/game-engine/combat-geometry";
import type { CombatRect, CombatTrajectory } from "../src/game-engine/combat-geometry";

const board = { left: 160, top: 80, width: 720, height: 620 };
const rect = (left: number, top: number, width = 84, height = 118): CombatRect => ({
  left: board.left + left, top: board.top + top, width, height,
});
const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < .000001, `${actual} ≈ ${expected}`);
const finalBounds = (source: CombatRect, movement: CombatTrajectory) => {
  const cx = movement.x + source.width / 2 + movement.dx;
  const cy = movement.y + source.height / 2 + movement.dy;
  return {
    left: cx - source.width * COMBAT_CARD_SCALE / 2,
    right: cx + source.width * COMBAT_CARD_SCALE / 2,
    top: cy - source.height * COMBAT_CARD_SCALE / 2,
    bottom: cy + source.height * COMBAT_CARD_SCALE / 2,
    cx, cy,
  };
};

test("opposing cards meet edge to edge halfway between their starting centers", () => {
  const attacker = rect(220, 390), blocker = rect(220, 90);
  const result = getCombatGeometry({ board, attacker, blockers: [blocker], attackerIsOpponent: false });
  const attackEnd = finalBounds(attacker, result.attacker), blockEnd = finalBounds(blocker, result.blockers[0]);
  close(result.impact.y, 299);
  close(attackEnd.top, result.impact.y);
  close(blockEnd.bottom, result.impact.y);
  close(attackEnd.cx, blockEnd.cx);
  assert.ok(result.attacker.dy < 0);
  assert.ok(result.blockers[0].dy > 0);
  assert.deepEqual({ x: result.attacker.x, y: result.attacker.y }, { x: 220, y: 390 });
});

test("a protector from another lane travels diagonally to the same contact point", () => {
  const attacker = rect(50, 390), blocker = rect(560, 90, 76, 106);
  const result = getCombatGeometry({ board, attacker, blockers: [blocker], attackerIsOpponent: false });
  const attackEnd = finalBounds(attacker, result.attacker), blockEnd = finalBounds(blocker, result.blockers[0]);
  assert.ok(result.attacker.dx > 0);
  assert.ok(result.blockers[0].dx < 0);
  close(attackEnd.cx, blockEnd.cx);
  close(attackEnd.top, blockEnd.bottom);
});

test("three blockers form a centered row without overlapping each other", () => {
  const attacker = rect(315, 390);
  const blockers = [rect(60, 90), rect(315, 90), rect(570, 90)];
  const result = getCombatGeometry({ board, attacker, blockers, attackerIsOpponent: false });
  const attackEnd = finalBounds(attacker, result.attacker);
  const ends = blockers.map((source, index) => finalBounds(source, result.blockers[index]));
  ends.forEach(end => close(end.bottom, attackEnd.top));
  for (let index = 1; index < ends.length; index++) assert.ok(ends[index - 1].right <= ends[index].left);
  close((ends[0].left + ends[2].right) / 2, attackEnd.cx);
});

test("mobile and edge lanes keep the entire collision group inside the board", () => {
  const mobile = { left: 12, top: 30, width: 340, height: 560 };
  const attacker = { left: 310, top: 370, width: 34, height: 48 };
  const blockers = [0, 1, 2].map(index => ({ left: 305 - index * 40, top: 120, width: 34, height: 48 }));
  const result = getCombatGeometry({ board: mobile, attacker, blockers, attackerIsOpponent: false });
  const ends = [finalBounds(attacker, result.attacker), ...blockers.map((source, index) => finalBounds(source, result.blockers[index]))];
  ends.forEach(end => {
    assert.ok(end.left >= 0);
    assert.ok(end.right <= mobile.width + .000001);
    assert.ok(end.top >= 0);
    assert.ok(end.bottom <= mobile.height);
  });
});

test("CPU attacks mirror player movement and keep the same contact point", () => {
  const lower = rect(220, 390), upper = rect(220, 90);
  const player = getCombatGeometry({ board, attacker: lower, blockers: [upper], attackerIsOpponent: false });
  const cpu = getCombatGeometry({ board, attacker: upper, blockers: [lower], attackerIsOpponent: true });
  assert.deepEqual(cpu.impact, player.impact);
  close(cpu.attacker.dy, player.blockers[0].dy);
  close(cpu.blockers[0].dy, player.attacker.dy);
  const attackEnd = finalBounds(upper, cpu.attacker), blockEnd = finalBounds(lower, cpu.blockers[0]);
  close(attackEnd.bottom, blockEnd.top);
});

test("direct attacks advance only the attacker and put the impact at its front edge", () => {
  for (const attackerIsOpponent of [false, true]) {
    const attacker = rect(220, attackerIsOpponent ? 90 : 390);
    const result = getCombatGeometry({ board, attacker, blockers: [], attackerIsOpponent });
    const end = finalBounds(attacker, result.attacker);
    assert.deepEqual(result.blockers, []);
    close(result.attacker.dy, (attackerIsOpponent ? 1 : -1) * attacker.height * .65);
    close(result.impact.y, attackerIsOpponent ? end.bottom : end.top);
    close(result.impact.x, end.cx);
  }
});

test("moving the board and every card together leaves trajectories unchanged", () => {
  const attacker = rect(220, 390), blockers = [rect(560, 90)];
  const expected = getCombatGeometry({ board, attacker, blockers, attackerIsOpponent: false });
  const shift = (source: CombatRect) => ({ ...source, left: source.left + 73, top: source.top - 35 });
  const result = getCombatGeometry({ board: shift(board), attacker: shift(attacker), blockers: blockers.map(shift), attackerIsOpponent: false });
  assert.deepEqual(result, expected);
});
