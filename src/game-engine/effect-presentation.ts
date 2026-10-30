import type { AbilityTrigger, EffectLog } from "./abilities";
import { normalizeAbilityTrigger } from "./abilities";

export type EffectTone = "damage" | "heal" | "buff" | "protection" | "destroy" | "summon" | "draw" | "neutral";
export const getAbilityTiming = (trigger: AbilityTrigger, language = "es") => {
  const labels: Record<string, [string, string]> = {
    ACTIVATED: ["Al activarla · una vez por turno", "Activate · once per turn"],
    INSTANT: ["Al jugar el hechizo", "When you cast the spell"],
    ON_ENTER: ["Cuando entra al campo", "When it enters the field"],
    ON_ATTACK: ["Antes de hacer el daño de su ataque", "Before dealing attack damage"],
    ON_DAMAGE: ["Después de recibir daño", "After taking damage"],
    ON_DEATH: ["Cuando es destruida o sacrificada", "When destroyed or sacrificed"],
    ON_COMBAT_DAMAGE: ["Después de hacer daño de combate", "After dealing combat damage"],
    TURN_START: ["Al inicio de tu turno", "At the start of your turn"],
    TURN_END: ["Al final de tu turno", "At the end of your turn"],
    CONTINUO: ["Efecto continuo mientras está en el campo", "Continuous while on the field"],
    DAMAGE_PREVENTION: ["Antes de recibir daño", "Before taking damage"],
    SUMMON_CONDITION: ["Requisito para poder invocarla", "Required to summon this card"],
    ON_SACRIFICE: ["Cuando esta carta es sacrificada", "When this card is sacrificed"],
    ON_SACRIFICE_FIRE: ["Cuando sacrificas una criatura de fuego", "When you sacrifice a fire creature"],
    ON_SACRIFICE_DRAGON: ["Cuando sacrificas un dragón", "When you sacrifice a dragon"],
    ON_FIRE_DESTROYED: ["Cuando una criatura de fuego es destruida", "When a fire creature is destroyed"],
    ON_DESTROY_ENEMY: ["Después de destruir una criatura en combate", "After destroying a creature in combat"],
  };
  return labels[normalizeAbilityTrigger(trigger)]?.[language === "en" ? 1 : 0] ??
    (language === "en" ? "When this effect resolves" : "Al resolverse este efecto");
};
export const getPhaseLabel = (phase?: string, language = "es") => {
  const labels: Record<string, [string, string]> = { DRAW: ["Robo", "Draw"], MAIN: ["Preparación", "Main"], COMBAT: ["Combate", "Combat"], END: ["Final", "End"] };
  return labels[phase ?? ""]?.[language === "en" ? 1 : 0] ?? "";
};
export const describeEffect = (entry: EffectLog, language = "es") => {
  const en = language === "en", effect = entry.effect;
  let label = en ? "Effect" : "Efecto", tone: EffectTone = "neutral", symbol = "✦";
  if (entry.outcome === "SKIPPED" || effect === "NO_SPACE") { label = en ? "No change" : "Sin efecto"; symbol = "—"; }
  else if (effect === "FIRST_DAMAGE_NEGATED" || effect === "SPELL_IMMUNITY" || entry.outcome === "PREVENTED") {
    label = en ? "Damage prevented" : "Daño evitado"; tone = "protection"; symbol = "◇";
  } else if (effect === "NEGATE_AND_DESTROY") { label = en ? "Effect negated" : "Efecto negado"; tone = "protection"; symbol = "⊘"; }
  else if (effect === "DAMAGE" || effect.startsWith("DAMAGE_") || effect === "LIFE_LOSS_2") {
    label = entry.damageType === "COMBAT" ? (en ? "Combat damage" : "Daño de combate") : (en ? "Effect damage" : "Daño de efecto");
    tone = "damage"; symbol = "−";
  } else if (effect.startsWith("LIFE_GAIN")) { label = en ? "Life restored" : "Vida recuperada"; tone = "heal"; symbol = "+"; }
  else if (effect.includes("DESTROY") || effect === "SACRIFICE") { label = effect === "SACRIFICE" ? (en ? "Sacrifice" : "Sacrificio") : (en ? "Destroyed" : "Destrucción"); tone = "destroy"; symbol = "×"; }
  else if (effect.startsWith("SUMMON") || effect === "PLAY_FIELD_ALTERERS_FREE") { label = en ? "Enters the field" : "Entra al campo"; tone = "summon"; symbol = "↗"; }
  else if (effect.includes("DRAW")) { label = en ? "Card draw / search" : "Robo / búsqueda"; tone = "draw"; symbol = "▱"; }
  else if (effect === "ATTACK") { label = en ? "Attack" : "Ataque"; tone = "damage"; symbol = "⚔"; }
  else if (effect === "CAST") { label = en ? "Spell cast" : "Hechizo lanzado"; tone = "summon"; }
  else if (effect === "MANA" || effect.startsWith("GENERATE") || effect === "CONVERT_MANA_RANDOM") { label = en ? "Mana" : "Maná"; tone = "summon"; }
  else if (effect.startsWith("BOUNCE")) { label = en ? "Returned to hand" : "Vuelve a la mano"; tone = "draw"; symbol = "↶"; }
  else if (effect === "DISCARD") { label = en ? "Discard" : "Descarte"; tone = "destroy"; }
  else if (effect === "TURN_START" || effect === "START") { label = en ? "Turn begins" : "Comienza el turno"; symbol = "→"; }
  else if (effect === "REDUCE_ATK_DESTROY_ZERO") { label = en ? "Attack reduced" : "Ataque reducido"; tone = "damage"; }
  else if (effect.includes("BUFF") || effect.includes("ATK") || effect === "UPGRADE_COMMON_TO_UNCOMMON") { label = en ? "Stat change" : "Cambio de estadísticas"; tone = "buff"; symbol = "+"; }
  else if (entry.trigger && normalizeAbilityTrigger(entry.trigger) === "CONTINUO") { label = en ? "Passive effect" : "Efecto continuo"; tone = "buff"; symbol = "∞"; }
  if (entry.stat && entry.before !== undefined && entry.after !== undefined && entry.before !== entry.after && entry.outcome !== "PREVENTED") {
    const gain = entry.after > entry.before;
    if (entry.stat === "ATTACK") {
      label = gain ? (en ? "Attack increased" : "Aumenta el ataque") : (en ? "Attack reduced" : "Disminuye el ataque");
      tone = gain ? "buff" : "damage"; symbol = gain ? "+" : "−";
    } else if (entry.stat === "DEFENSE" && effect !== "DAMAGE") {
      const restored = effect === "DEFENSE_RESTORED";
      label = gain ? restored ? (en ? "Defense restored" : "Recupera defensa") : (en ? "Defense increased" : "Aumenta la defensa") : (en ? "Defense reduced" : "Disminuye la defensa");
      tone = gain ? restored ? "heal" : "buff" : "damage"; symbol = gain ? "+" : "−";
    } else if (entry.stat === "LIFE") {
      label = gain ? (en ? "Life restored" : "Vida recuperada") : (en ? "Life lost" : "Pierde vida");
      tone = gain ? "heal" : "damage"; symbol = gain ? "+" : "−";
    }
  }
  const stat = entry.stat === "LIFE" ? (en ? "Life" : "Vida") : entry.stat === "DEFENSE" ? (en ? "Remaining DEF" : "DEF restante") : entry.stat === "ATTACK" ? (en ? "Attack" : "ATQ") : "";
  const change = entry.before !== undefined && entry.after !== undefined ? stat + " " + entry.before + " → " + entry.after : "";
  const side = entry.targetZone === "DECK" ? (entry.targetController === "PLAYER" ? (en ? "Your deck" : "Tu mazo") : (en ? "CPU deck" : "Mazo CPU")) :
    entry.targetZone === "HAND" ? (entry.targetController === "PLAYER" ? (en ? "Your hand" : "Tu mano") : (en ? "CPU hand" : "Mano CPU")) :
    entry.targetController === "PLAYER" ? (en ? "Your field" : "Tu campo") : entry.targetController === "CPU" ? (en ? "CPU field" : "Campo CPU") : "";
  const target = entry.targetInstanceId
    ? [entry.targetName, side, entry.targetPosition ? (en ? "Slot " : "Posición ") + entry.targetPosition : ""].filter(Boolean).join(" · ")
    : entry.targetController ? (entry.targetController === "PLAYER" ? (en ? "You" : "Tú") : "CPU") : entry.targetName ?? "";
  return {
    label, tone, symbol, change, target,
    source: entry.outcome === "PREVENTED" ? entry.source : entry.originName ?? entry.source,
    sourceInstanceId: entry.outcome === "PREVENTED" ? entry.sourceInstanceId : entry.originInstanceId ?? entry.sourceInstanceId,
  };
};
export const getLatestEffect = (entries: EffectLog[]) => {
  const last = entries.at(-1);
  if (!last) return undefined;
  const batch = last.batchId ? entries.filter(e => e.batchId === last.batchId) : [last];
  return [...batch].reverse().find(e => e.targetName || e.stat) ?? last;
};
