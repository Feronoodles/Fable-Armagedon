import { useState } from "react";
import type { PendingEffect, EffectTarget } from "@/game-engine/abilities";
import { CardArt } from "@/components/cards/CardArt";
import { getAbilityTiming } from "@/game-engine/effect-presentation";
import { getAbilityDescription } from "@/game-engine/ability-text";

const keyOf = (target: EffectTarget) => target.type === "CARD" ? target.instanceId : target.type === "PLAYER" ? target.player : target.instanceIds.join(",");
export function EffectTargetModal({ pending, onSelect, onClose, language }: {
  pending: PendingEffect; onSelect: (target: EffectTarget) => void; onClose: () => void; language: string;
}) {
  const [selected, setSelected] = useState<Record<number, string[]>>({});
  const groups = pending.groups ?? [{ label: "", min: 1, max: 1, options: pending.options }];
  const simple = groups.length === 1 && groups[0].min === 1 && groups[0].max === 1;
  const optionalSingle = groups.length === 1 && groups[0].min === 0 && groups[0].max === 1;
  const valid = groups.every((g, i) => (selected[i]?.length ?? 0) >= g.min && (selected[i]?.length ?? 0) <= g.max);
  const choose = (group: number, key: string, max: number) => setSelected(previous => {
    const values = previous[group] ?? [];
    return { ...previous, [group]: values.includes(key) ? values.filter(v => v !== key) :
      max === 1 ? [key] : values.length < max ? [...values, key] : values };
  });
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <section role="dialog" aria-modal="true" aria-labelledby="effect-choice-title" className="flex max-h-[90dvh] w-full max-w-2xl flex-col rounded-2xl border border-amber-300/30 bg-slate-950 p-5 text-white shadow-2xl">
        <p className="era-kicker">{pending.kind === "REACTION" ? "Respuesta a un efecto" : language === "en" ? "Choose targets" : "Elige los objetivos"}</p>
        <h2 id="effect-choice-title" className="mt-2 text-xl font-bold">{pending.ability.name}</h2>
        <p className="mt-2 text-xs font-semibold text-cyan-200">{pending.source.name} · {getAbilityTiming(pending.ability.trigger, language)}</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{getAbilityDescription(pending.ability, language)}</p>
        <p className="mt-3 rounded-xl border border-amber-300/15 bg-amber-300/5 px-3 py-2 text-xs text-amber-200">
          {language === "en" ? "The game is waiting for your selection. Choose the highlighted targets to continue." : "La partida espera tu elección. Selecciona los objetivos indicados para continuar."}
        </p>
        <div className="mt-4 min-h-0 space-y-4 overflow-y-auto pr-1">
          {groups.map((group, i) => (
            <fieldset key={group.label + i}>
              {group.label && <legend className="mb-2 text-xs font-semibold text-amber-200">{group.label} · {group.min === group.max ? group.min : group.min + "–" + group.max}</legend>}
              <div className="grid gap-2 sm:grid-cols-2">
                {group.options.map(option => {
                  const key = keyOf(option.target), active = selected[i]?.includes(key);
                  return <button type="button" key={key} aria-pressed={Boolean(active)}
                    onClick={() => simple ? onSelect(option.target) : choose(i, key, group.max)}
                    className={"flex items-center gap-3 rounded-xl border p-2 text-left transition " + (active ? "border-amber-300 bg-amber-300/15" : "border-white/10 bg-white/5 hover:border-cyan-300/50")}>
                    {option.card && <div className="h-14 w-12 shrink-0 overflow-hidden rounded-lg"><CardArt card={option.card} /></div>}
                    <span className="min-w-0 flex-1 text-sm">{option.label}{option.card && <span className="mt-1 block text-xs text-slate-400">{option.card.cardType} · {option.card.cost} maná</span>}</span>
                    {!simple && <span className={"grid h-5 w-5 shrink-0 place-items-center rounded border text-xs " + (active ? "border-amber-300 text-amber-200" : "border-slate-600")}>{active ? "✓" : ""}</span>}
                  </button>;
                })}
              </div>
            </fieldset>
          ))}
        </div>
        <div className="mt-4 flex gap-2 border-t border-white/10 pt-4">
          {pending.cancellable !== false && <button type="button" onClick={onClose} className="rounded-xl bg-slate-800 px-5 py-3 text-sm">{language === "en" ? "Cancel" : "Cancelar"}</button>}
          {optionalSingle && <button type="button" onClick={() => onSelect({ type: "CARDS", instanceIds: [] })} className="rounded-xl bg-slate-800 px-4 py-3 text-sm">{language === "en" ? "Skip effect" : "No usar habilidad"}</button>}
          {!simple && <button type="button" disabled={!valid || (optionalSingle && !(selected[0]?.length))}
            onClick={() => onSelect({ type: "CARDS", instanceIds: Object.values(selected).flat() })}
            className="flex-1 rounded-xl bg-amber-400 px-5 py-3 text-sm font-bold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40">
            {language === "en" ? "Confirm selection" : "Confirmar selección"}
          </button>}
        </div>
      </section>
    </div>
  );
}
