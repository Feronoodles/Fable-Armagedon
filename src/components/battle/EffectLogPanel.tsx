import { useState } from "react";
import type { EffectLog } from "@/game-engine/abilities";
import { describeEffect, getAbilityTiming, getPhaseLabel } from "@/game-engine/effect-presentation";

export function EffectLogPanel({ effectLog, language }: { effectLog: EffectLog[]; language: string }) {
  const [filter, setFilter] = useState("ALL"), [expanded, setExpanded] = useState(false);
  const entries = effectLog.filter(entry => filter === "ALL" || entry.controller === filter);
  const en = language === "en";
  return <aside className={"battle-log-rail battle-ornate-panel " + (expanded ? "is-expanded" : "")}>
    <button type="button" onClick={() => setExpanded(v => !v)} aria-expanded={expanded} className="battle-rail-heading flex w-full items-center justify-between gap-2">
      <span>{en ? "What happened?" : "¿Qué ha pasado?"}</span>
      <span className="rounded-full bg-cyan-300/10 px-2 py-1 text-[10px] text-cyan-200">{effectLog.length}</span>
    </button>
    <div className="battle-log-content">
      <div className="flex gap-1 border-b border-white/10 p-2">
        {[["ALL", en ? "All" : "Todos"], ["PLAYER", en ? "You" : "Tú"], ["CPU", "CPU"]].map(([value, label]) =>
          <button key={value} type="button" onClick={() => setFilter(value)} aria-pressed={filter === value} className={"rounded-lg px-2 py-1 text-[10px] " + (filter === value ? "bg-cyan-300/15 text-cyan-200" : "text-slate-400 hover:text-white")}>{label}</button>)}
      </div>
      <p className="px-3 pb-1 pt-2 text-[9px] text-slate-500">{en ? "Newest first · source → target → result" : "Lo más reciente arriba · origen → objetivo → resultado"}</p>
      <div role="log" aria-live="polite" aria-relevant="additions" className="battle-log-scroll">
        {[...entries].reverse().map(entry => {
          const info = describeEffect(entry, language);
          return <article key={entry.id} data-tone={info.tone} className="battle-readable-event">
            <div className="battle-event-meta"><span>{entry.controller === "PLAYER" ? (en ? "You" : "Tú") : "CPU"} · {en ? "Turn" : "Turno"} {entry.turn ?? 1}</span><span>{getPhaseLabel(entry.phase, language)}</span></div>
            <div className="battle-event-title"><span aria-hidden="true">{info.symbol}</span><strong>{info.label}</strong>{entry.amount !== undefined && <b>{entry.amount}</b>}</div>
            <p className="battle-event-source">{info.source}</p>
            {entry.abilityName && <p className="battle-event-ability">{entry.abilityName}</p>}
            {info.target && <p className="battle-event-target"><span>→</span> {info.target}</p>}
            {info.change && <p className="battle-event-change">{info.change}</p>}
            <p className="battle-event-description">{entry.message}</p>
            {entry.trigger && <p className="battle-event-timing">{getAbilityTiming(entry.trigger, language)}</p>}
          </article>;
        })}
        {!entries.length && <p className="p-4 text-center text-xs leading-5 text-slate-500">{en ? "Actions and effects will appear here." : "Aquí verás quién activa cada efecto, su objetivo y el resultado."}</p>}
      </div>
    </div>
  </aside>;
}
