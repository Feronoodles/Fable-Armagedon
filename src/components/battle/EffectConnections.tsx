import { useEffect, useState } from "react";
import type { RefObject } from "react";
import type { BattlePresentation } from "@/game-engine/battle-presentation";
import { getEffectLinks } from "@/game-engine/effect-animation";

type Path = { id: string; d: string; sourceX: number; sourceY: number; targetX: number; targetY: number; tone: string };

export function EffectConnections({ frame, boardRef }: { frame?: BattlePresentation; boardRef: RefObject<HTMLDivElement | null> }) {
  const [geometry, setGeometry] = useState<{ frameId: string; width: number; height: number; paths: Path[] }>();
  useEffect(() => {
    const board = boardRef.current;
    if (!frame || !board) return;
    let scheduled = 0;
    const measure = () => {
      cancelAnimationFrame(scheduled);
      scheduled = requestAnimationFrame(() => {
        const root = board.getBoundingClientRect();
        const cards = new Map([...board.querySelectorAll<HTMLElement>("[data-battle-card-id]")].map(element => [element.dataset.battleCardId, element]));
        const origins = new Map([...board.querySelectorAll<HTMLElement>("[data-battle-origin-id]")].map(element => [element.dataset.battleOriginId, element]));
        const players = new Map([...board.querySelectorAll<HTMLElement>("[data-battle-player-life]")].map(element => [element.dataset.battlePlayerLife, element]));
        const paths = getEffectLinks(frame.events).flatMap(link => {
          const source = cards.get(link.sourceId) ?? origins.get(link.sourceId);
          const target = link.targetId ? cards.get(link.targetId) : players.get(link.targetPlayer);
          if (!source || !target) return [];
          const start = source.getBoundingClientRect(), end = target.getBoundingClientRect();
          const sourceX = start.left + start.width / 2 - root.left, sourceY = start.top + start.height / 2 - root.top;
          const targetX = end.left + end.width / 2 - root.left, targetY = end.top + end.height / 2 - root.top;
          const bend = Math.min(65, Math.hypot(targetX - sourceX, targetY - sourceY) * .2);
          return [{ ...link, sourceX, sourceY, targetX, targetY,
            d: "M " + sourceX + " " + sourceY + " Q " + ((sourceX + targetX) / 2 + bend) + " " + ((sourceY + targetY) / 2 - bend) + " " + targetX + " " + targetY }];
        });
        setGeometry({ frameId: frame.id, width: root.width, height: root.height, paths });
      });
    };
    const observer = new ResizeObserver(measure);
    observer.observe(board);
    measure();
    return () => { observer.disconnect(); cancelAnimationFrame(scheduled); };
  }, [frame, boardRef]);
  if (!frame || geometry?.frameId !== frame.id) return null;
  return <svg key={frame.id} className="battle-effect-connections" width="100%" height="100%" viewBox={"0 0 " + geometry.width + " " + geometry.height} aria-hidden="true">
    {geometry.paths.map(path => <g key={path.id} data-tone={path.tone}>
      <path className="battle-effect-trail" d={path.d} />
      <path className="battle-effect-travel" d={path.d} pathLength="1" />
      <circle className="battle-effect-origin-ring" cx={path.sourceX} cy={path.sourceY} r="16" />
      <circle className="battle-effect-hit-ring" cx={path.targetX} cy={path.targetY} r="18" />
    </g>)}
  </svg>;
}
