export const COMBAT_CARD_SCALE = 1.08;

export type CombatRect = { left: number; top: number; width: number; height: number };
export type CombatTrajectory = { x: number; y: number; dx: number; dy: number };
export type CombatGeometry = {
  impact: { x: number; y: number };
  attacker: CombatTrajectory;
  blockers: CombatTrajectory[];
};

const clamp = (value: number, min: number, max: number) =>
  min > max ? (min + max) / 2 : Math.max(min, Math.min(max, value));

/** Coordinates and translations are relative to the board; cards scale around their centers. */
export function getCombatGeometry({ board, attacker, blockers, attackerIsOpponent }: {
  board: CombatRect;
  attacker: CombatRect;
  blockers: CombatRect[];
  attackerIsOpponent: boolean;
}): CombatGeometry {
  const relative = (rect: CombatRect) => ({
    x: rect.left - board.left, y: rect.top - board.top,
    cx: rect.left - board.left + rect.width / 2,
    cy: rect.top - board.top + rect.height / 2,
  });
  const start = relative(attacker), targets = blockers.map(relative);
  const forward = attackerIsOpponent ? 1 : -1;
  const attackWidth = attacker.width * COMBAT_CARD_SCALE;
  const attackHeight = attacker.height * COMBAT_CARD_SCALE;
  const trajectory = (rect: CombatRect, cx: number, cy: number): CombatTrajectory => {
    const origin = relative(rect);
    return { x: origin.x, y: origin.y, dx: cx - origin.cx, dy: cy - origin.cy };
  };

  if (!blockers.length) {
    const cx = clamp(start.cx, attackWidth / 2, board.width - attackWidth / 2);
    const cy = clamp(start.cy + forward * attacker.height * .65,
      attackHeight / 2, board.height - attackHeight / 2);
    return {
      impact: { x: cx, y: cy + forward * attackHeight / 2 },
      attacker: trajectory(attacker, cx, cy), blockers: [],
    };
  }

  const widths = blockers.map(rect => rect.width * COMBAT_CARD_SCALE);
  const widthSum = widths.reduce((sum, width) => sum + width, 0);
  const gap = blockers.length > 1 ? Math.max(0, Math.min(8, (board.width - widthSum) / (blockers.length - 1))) : 0;
  const groupWidth = widthSum + gap * (blockers.length - 1);
  const halfWidth = Math.max(attackWidth, groupWidth) / 2;
  const targetX = targets.reduce((sum, target) => sum + target.cx, 0) / targets.length;
  const targetY = targets.reduce((sum, target) => sum + target.cy, 0) / targets.length;
  const maxBlockerHeight = Math.max(...blockers.map(rect => rect.height * COMBAT_CARD_SCALE));
  const impact = {
    x: clamp((start.cx + targetX) / 2, halfWidth, board.width - halfWidth),
    y: clamp((start.cy + targetY) / 2,
      attackerIsOpponent ? attackHeight : maxBlockerHeight,
      board.height - (attackerIsOpponent ? maxBlockerHeight : attackHeight)),
  };
  let cursor = -groupWidth / 2;
  return {
    impact,
    attacker: trajectory(attacker, impact.x, impact.y - forward * attackHeight / 2),
    blockers: blockers.map((rect, index) => {
      const cx = clamp(impact.x + cursor + widths[index] / 2,
        widths[index] / 2, board.width - widths[index] / 2);
      cursor += widths[index] + gap;
      return trajectory(rect, cx, impact.y + forward * rect.height * COMBAT_CARD_SCALE / 2);
    }),
  };
}
