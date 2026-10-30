import type { GameCard } from "@/game-engine/types";
import type { CSSProperties } from "react";
import type { EffectLog } from "@/game-engine/abilities";
import { describeEffect } from "@/game-engine/effect-presentation";
import { AnimatedStatNumber } from "./AnimatedStatNumber";
import { EffectAura } from "./EffectAura";
export function PlayerInfo({ name, life, maxLife, deckCount, handCount, isOpponent = false, language = "es", events = [], paused = false }: {
  name: string; life: number; maxLife: number; deckCount: number; handCount?: number; manaZone?: GameCard[]; isOpponent?: boolean; language?: string; events?: EffectLog[]; paused?: boolean;
}) {
  const change = events.findLast(entry => entry.stat === "LIFE" && entry.targetController === (isOpponent ? "CPU" : "PLAYER"));
  const currentLife = Math.max(0, Math.min(maxLife, life));
  const fraction = (value: number) => maxLife > 0 ? Math.max(0, Math.min(1, value / maxLife)) * 100 : 0;
  const barStyle = { "--life-before": fraction(change?.before ?? currentLife) + "%", "--life-after": fraction(currentLife) + "%" } as CSSProperties;
  const healthLevel = currentLife <= maxLife * .25 ? "critical" : currentLife <= maxLife * .5 ? "low" : "healthy";
  return <div className="battle-player-info">
    <span className={"player-avatar grid h-7 w-7 shrink-0 place-items-center rounded-lg border text-xs " + (isOpponent ? "border-orange-300/20 bg-orange-500/10" : "border-cyan-300/20 bg-cyan-400/10")}>{isOpponent ? "⚙" : "✦"}</span>
    <div className="min-w-0"><p className="max-w-36 truncate text-[10px] font-bold text-white">{name}</p><p className="text-[8px] text-slate-500">{language === "en" ? "Deck" : "Mazo"} {deckCount} · {language === "en" ? "Hand" : "Mano"} {handCount ?? 0}</p></div>
    <span key={change?.id ?? "life"} data-battle-player-life={isOpponent ? "CPU" : "PLAYER"} className={"battle-life-total ml-1 rounded-lg border px-2 py-1 text-sm font-black " + (change ? "is-changing " : "") + (healthLevel === "critical" ? "border-red-400/30 text-red-300" : healthLevel === "low" ? "border-amber-300/25 text-amber-200" : "border-emerald-300/15 text-emerald-200")} data-tone={change ? describeEffect(change, language).tone : undefined}>
      <span>♥ <AnimatedStatNumber value={life} change={change} paused={paused} label={language === "en" ? "Life" : "Vida"} /><small className="battle-life-max">/{maxLife}</small></span>
      <span role="meter" aria-label={(language === "en" ? "Life of " : "Vida de ") + name} aria-valuemin={0} aria-valuemax={maxLife}
        aria-valuenow={currentLife} aria-valuetext={currentLife + (language === "en" ? " of " : " de ") + maxLife}
        className={"battle-life-bar " + (change && change.before !== change.after ? "is-changing" : "")}
        data-health={healthLevel} data-direction={change && change.after! < change.before! ? "loss" : "gain"} style={barStyle}>
        <span className="battle-life-bar-trail" /><span className="battle-life-bar-fill" />
      </span>
      {change && <small className="battle-life-change">{change.before} → {change.after} ({change.after! > change.before! ? "+" : "−"}{Math.abs(change.after! - change.before!)})</small>}
      {change && <EffectAura event={change} language={language} />}
    </span>
  </div>;
}
