import type { EffectLog, PendingEffect, Turn } from "@/stores/gameStore";
import { describeEffect, getLatestEffect } from "@/game-engine/effect-presentation";
import type { BattlePresentation } from "@/game-engine/battle-presentation";
import { findEffectSourceCard, getEffectCue } from "@/game-engine/effect-animation";
import { CardArt } from "@/components/cards/CardArt";
import { EffectAura } from "./EffectAura";
import { AnimatedStatNumber } from "./AnimatedStatNumber";

export function BattleFeedback({ effectLog, pendingEffect, turn, combatPosition, language, frame, paused = false, onTogglePause }: {
  effectLog: EffectLog[]; pendingEffect: PendingEffect | null; turn: Turn; combatPosition: number | null; language: string;
  frame?: BattlePresentation; paused?: boolean; onTogglePause?: () => void;
}) {
  const en = language === "en", entry = getLatestEffect(frame?.events ?? effectLog);
  const targets = new Set(frame?.events.map(event => event.targetInstanceId ?? event.targetController).filter(Boolean)).size;
  const info = entry ? describeEffect(entry, language) : undefined;
  const source = frame && entry ? findEffectSourceCard(frame, entry) : undefined;
  return <div className="battle-feedback" data-tone={pendingEffect ? "protection" : info?.tone ?? "neutral"} role="status" aria-live="polite" aria-atomic="true">
    {source && entry ? <span key={frame!.id} data-battle-origin-id={source.instanceId} className="battle-effect-origin" title={source.name}>
      <CardArt card={source} /><EffectAura event={entry} source language={language} />
    </span> : <span className="battle-feedback-symbol" aria-hidden="true">{pendingEffect ? "?" : info?.symbol ?? "✦"}</span>}
    <div className="min-w-0 flex-1">
      <div className="battle-feedback-heading"><strong>{pendingEffect ? (en ? "Waiting for your choice" : "Esperando tu elección") :
        (info?.label ?? (en ? "Prepare your field" : "Prepara tu campo")) + (entry?.abilityName ? " · " + entry.abilityName : "")}</strong>
        <span>{paused && frame ? (en ? "Paused" : "En pausa") : frame ? (en ? "Resolving effect" : "Resolviendo efecto") : combatPosition ? (en ? "Combat · slot " : "Combate · posición ") + combatPosition : turn === "PLAYER" ? (en ? "Your turn" : "Tu turno") : (en ? "CPU turn" : "Turno CPU")}</span></div>
      <p className="battle-feedback-message" title={entry?.message}>{pendingEffect ? pendingEffect.source.name + " · " + pendingEffect.ability.name :
        entry ? entry.message : en ? "Play cards, then advance to combat." : "Juega tus cartas y después pasa al combate."}</p>
      {info && !pendingEffect && <p className="battle-feedback-target">{entry && frame ? getEffectCue(entry, language).activation + " · " : ""}{info.source} {info.target && <><span aria-hidden="true">→</span> {targets > 1 ? targets + (en ? " affected targets · see highlighted values" : " objetivos afectados · mira los valores resaltados") : info.target}</>}</p>}
    </div>
    {info?.change && entry && !pendingEffect && <span className="battle-feedback-value"><small>{entry.stat === "ATTACK" ? (en ? "ATK" : "ATQ") : entry.stat === "LIFE" ? (en ? "Life" : "Vida") : "DEF"} {entry.before} → </small><AnimatedStatNumber value={entry.after!} change={frame ? entry : undefined} paused={paused} /></span>}
    {frame && onTogglePause && <button type="button" className="battle-reading-toggle" aria-pressed={paused} onClick={onTogglePause}>{paused ? (en ? "▶ Resume" : "▶ Seguir") : (en ? "Ⅱ Pause" : "Ⅱ Pausar")}</button>}
  </div>;
}
