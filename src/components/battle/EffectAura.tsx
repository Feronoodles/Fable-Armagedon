import type { EffectLog } from "@/game-engine/abilities";
import { getEffectCue } from "@/game-engine/effect-animation";

export function EffectAura({ event, source = false, language = "es" }: { event: EffectLog; source?: boolean; language?: string }) {
  const cue = getEffectCue(event, language);
  return <span className={source ? "battle-activation-aura" : "battle-target-aura"} data-tone={cue.tone} data-kind={cue.tone} aria-hidden="true">
    <span className="battle-aura-ring" /><span className="battle-aura-ring battle-aura-ring-second" />
    <span className="battle-aura-glyph">{cue.icon}</span>
    {!source && <span className="battle-effect-motes"><i /><i /><i /><i /></span>}
  </span>;
}
