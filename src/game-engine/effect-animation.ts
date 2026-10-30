import type { EffectLog } from "./abilities";
import type { EffectState } from "./rules";
import { describeEffect } from "./effect-presentation";

export const STAT_ANIMATION = { activationMs: 400, countMs: 650, totalMs: 1800 } as const;

export const getAnimatedStatValue = (before: number, after: number, elapsedMs: number) => {
  const progress = Math.max(0, Math.min(1, (elapsedMs - STAT_ANIMATION.activationMs) / STAT_ANIMATION.countMs));
  const eased = progress * progress * (3 - 2 * progress);
  return Math.round(before + (after - before) * eased);
};

export const getEffectCue = (entry: EffectLog, language = "es") => {
  const info = describeEffect(entry, language), en = language === "en";
  const icons = { damage: "✹", heal: "✚", buff: "↑", protection: "◇", destroy: "✕", summon: "✦", draw: "▱", neutral: "✧" };
  const activation = entry.damageType === "COMBAT" ? (en ? "Attacks" : "Ataca") :
    entry.effect === "SUMMON" ? (en ? "Enters" : "Entra") :
      entry.effect === "CAST" ? (en ? "Casts" : "Lanza") :
        entry.outcome === "PREVENTED" ? (en ? "Protects" : "Protege") : (en ? "Activates" : "Activa");
  return { ...info, icon: icons[info.tone], activation };
};

export const findEffectSourceCard = (state: EffectState, entry: EffectLog) => {
  const id = describeEffect(entry).sourceInstanceId;
  if (!id) return undefined;
  return [state.player, state.cpu].flatMap(owner => [...owner.field, ...owner.graveyard, ...owner.hand, ...owner.manaZone])
    .find(card => card.instanceId === id);
};

export const getEffectLinks = (entries: EffectLog[]) => {
  const links = new Map<string, { id: string; sourceId: string; targetId?: string; targetPlayer?: string; tone: ReturnType<typeof describeEffect>["tone"] }>();
  for (const entry of entries) {
    const cue = describeEffect(entry), sourceId = cue.sourceInstanceId;
    const targetId = entry.targetInstanceId, targetPlayer = targetId ? undefined : entry.stat === "LIFE" ? entry.targetController : undefined;
    if (!sourceId || (!targetId && !targetPlayer) || targetId === sourceId) continue;
    const key = sourceId + ":" + (targetId ?? targetPlayer);
    if (!links.has(key)) links.set(key, { id: key, sourceId, targetId, targetPlayer, tone: cue.tone });
  }
  return [...links.values()];
};
