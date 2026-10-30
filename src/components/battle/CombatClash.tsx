import { useEffect, useState } from "react";
import type { CSSProperties, RefObject } from "react";
import { COMBAT_CLASH_DURATION_MS } from "@/game-engine/combat-animation";
import type { CombatAnimation } from "@/game-engine/combat-animation";
import { COMBAT_CARD_SCALE, getCombatGeometry } from "@/game-engine/combat-geometry";
import type { CombatGeometry, CombatRect, CombatTrajectory } from "@/game-engine/combat-geometry";
import { getEffectiveCardStats } from "@/game-engine/effects";
import type { GameCard, Player } from "@/game-engine/types";
import { FieldCard } from "./FieldCard";

type MeasuredCombat = CombatGeometry & { attackerRect: CombatRect; blockerRects: CombatRect[] };

/** A board-level layer lets the cards cross the center strip without being clipped by their lanes. */
export function CombatClash({ combat, boardRef, player, cpu }: {
  combat: CombatAnimation; boardRef: RefObject<HTMLDivElement | null>; player: Player; cpu: Player;
}) {
  const [geometry, setGeometry] = useState<MeasuredCombat>();
  useEffect(() => {
    const board = boardRef.current;
    if (!board) return;
    let scheduled = 0;
    const measure = () => {
      cancelAnimationFrame(scheduled);
      scheduled = requestAnimationFrame(() => {
        const cards = new Map([...board.querySelectorAll<HTMLElement>("[data-battle-card-id]")]
          .map(element => [element.dataset.battleCardId, element]));
        const attacker = cards.get(combat.attackerId), blockers = combat.blockerIds.map(id => cards.get(id));
        if (!attacker || blockers.some(card => !card)) return;
        const root = board.getBoundingClientRect(), attackerRect = attacker.getBoundingClientRect();
        const blockerRects = blockers.map(card => card!.getBoundingClientRect());
        const boardRect = { left: root.left + board.clientLeft, top: root.top + board.clientTop,
          width: board.clientWidth, height: board.clientHeight };
        setGeometry({ ...getCombatGeometry({ board: boardRect, attacker: attackerRect, blockers: blockerRects,
          attackerIsOpponent: combat.controller === "CPU" }), attackerRect, blockerRects });
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(board);
    measure();
    return () => { observer.disconnect(); cancelAnimationFrame(scheduled); };
  }, [combat, boardRef]);

  if (!geometry) return null;
  const own = combat.controller === "PLAYER" ? player : cpu, enemy = combat.controller === "PLAYER" ? cpu : player;
  const attacker = own.field.find(card => card.instanceId === combat.attackerId);
  if (!attacker) return null;
  const renderCard = (card: GameCard, owner: Player, trajectory: CombatTrajectory, rect: CombatRect, attacking: boolean) => {
    const stats = getEffectiveCardStats(card, owner), opponent = owner === cpu;
    return <div key={card.instanceId} className="battle-clash-card" data-combat-role={attacking ? "attacker" : "blocker"} style={{
      left: trajectory.x, top: trajectory.y, width: rect.width, height: rect.height,
      "--combat-x": `${trajectory.dx}px`, "--combat-y": `${trajectory.dy}px`,
      "--combat-pull-x": `${-trajectory.dx * .04}px`, "--combat-pull-y": `${opponent ? -9 : 9}px`,
      "--combat-tilt": `${opponent ? 5 : -5}deg`, "--combat-rebound": `${opponent ? -3 : 3}px`,
    } as CSSProperties}>
      <FieldCard card={card} presentationClone displayAttack={stats.attack} displayDefense={stats.remainingDefense} />
    </div>;
  };
  return <div className="battle-combat-overlay" aria-hidden="true" style={{
    "--combat-duration": `${COMBAT_CLASH_DURATION_MS}ms`, "--combat-scale": COMBAT_CARD_SCALE,
  } as CSSProperties}>
    {renderCard(attacker, own, geometry.attacker, geometry.attackerRect, true)}
    {combat.blockerIds.map((id, index) => {
      const card = enemy.field.find(card => card.instanceId === id);
      return card ? renderCard(card, enemy, geometry.blockers[index], geometry.blockerRects[index], false) : null;
    })}
    <div className="battle-clash-impact" style={{ left: geometry.impact.x, top: geometry.impact.y,
      "--impact-size": `${Math.max(46, Math.min(110, geometry.attackerRect.width))}px` } as CSSProperties}>
      <span className="battle-clash-core" />
      <span className="battle-clash-wave" />
      <span className="battle-clash-cut" /><span className="battle-clash-cut is-crossed" />
      {Array.from({ length: 8 }, (_, index) => <i key={index} style={{ "--spark-angle": `${index * 45}deg` } as CSSProperties} />)}
    </div>
  </div>;
}
