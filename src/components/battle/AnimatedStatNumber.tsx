import { useEffect, useRef, useState } from "react";
import type { EffectLog } from "@/game-engine/abilities";
import { getAnimatedStatValue, STAT_ANIMATION } from "@/game-engine/effect-animation";

type Change = Pick<EffectLog, "id" | "before" | "after">;
interface Props { value: number; change?: Change; paused?: boolean; label?: string; className?: string }

function ChangingNumber({ before, after, paused, label, className = "" }: {
  before: number; after: number; paused: boolean; label?: string; className?: string;
}) {
  const [current, setCurrent] = useState(before);
  const elapsed = useRef(0);
  useEffect(() => {
    if (paused) return;
    let frame = 0, started: number | undefined;
    const resumedAt = elapsed.current;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const tick = (time: number) => {
      started ??= time;
      elapsed.current = reducedMotion ? STAT_ANIMATION.totalMs : resumedAt + time - started;
      setCurrent(getAnimatedStatValue(before, after, elapsed.current));
      if (elapsed.current < STAT_ANIMATION.totalMs) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [before, after, paused]);
  return <span className={"battle-animated-number " + className} data-direction={after > before ? "up" : "down"}
    role="img" aria-label={(label ? label + ": " : "") + before + " → " + after}>
    <span className="battle-number-measure" aria-hidden="true">{after}</span>
    <span className="battle-number-old" aria-hidden="true">{before}</span>
    <span className="battle-number-current" aria-hidden="true">{current}</span>
  </span>;
}

export function AnimatedStatNumber({ value, change, paused = false, label, className }: Props) {
  if (!change || change.before === undefined || change.after === undefined || change.before === change.after) {
    return <span className={className}>{value}</span>;
  }
  return <ChangingNumber key={change.id + ":" + change.before + ":" + change.after} before={change.before} after={change.after} paused={paused} label={label} className={className} />;
}
