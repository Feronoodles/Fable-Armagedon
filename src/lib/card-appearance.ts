import type { CSSProperties } from "react";

type Identity = { color: string; icon: string; es: string; en: string };
export const ELEMENT_APPEARANCE: Record<string, Identity & { dark: string }> = {
  FUEGO: { color: "#fb923c", dark: "#351710", icon: "🔥", es: "Fuego", en: "Fire" },
  AGUA: { color: "#38bdf8", dark: "#0c2539", icon: "💧", es: "Agua", en: "Water" },
  NATURALEZA: { color: "#86d987", dark: "#142b22", icon: "🌿", es: "Naturaleza", en: "Nature" },
  RAYO: { color: "#facc15", dark: "#302b11", icon: "ϟ", es: "Rayo", en: "Lightning" },
  VACIO: { color: "#c084fc", dark: "#29173c", icon: "◐", es: "Vacío", en: "Void" },
  NORMAL: { color: "#cbd5e1", dark: "#222b38", icon: "◈", es: "Normal", en: "Normal" },
  TIERRA: { color: "#d6a86e", dark: "#30251b", icon: "⛰", es: "Tierra", en: "Earth" },
  METAL: { color: "#94c9d4", dark: "#172c34", icon: "⚙", es: "Metal", en: "Metal" },
  LEGENDARIO: { color: "#fbbf24", dark: "#302411", icon: "✧", es: "Legendario", en: "Legendary" },
  CELESTIAL: { color: "#f0abfc", dark: "#2c1b38", icon: "✶", es: "Celestial", en: "Celestial" },
};
export const RARITY_APPEARANCE: Record<string, Identity & { rank: number }> = {
  COMUN: { color: "#a8b4c5", icon: "◆", es: "Común", en: "Common", rank: 1 },
  INFRECUENTE: { color: "#86efac", icon: "◆", es: "Infrecuente", en: "Uncommon", rank: 2 },
  RARA: { color: "#7ab8ff", icon: "◆", es: "Rara", en: "Rare", rank: 3 },
  EPICA: { color: "#c4a0ff", icon: "✦", es: "Épica", en: "Epic", rank: 4 },
  LEGENDARIA: { color: "#fbd570", icon: "✧", es: "Legendaria", en: "Legendary", rank: 5 },
  CELESTIAL: { color: "#f5c6ff", icon: "✶", es: "Celestial", en: "Celestial", rank: 6 },
};
export const TYPE_APPEARANCE: Record<string, Identity & { hint: [string, string] }> = {
  CRIATURA: { color: "#fda4af", icon: "⚔", es: "Criatura", en: "Creature", hint: ["Ocupa una posición y combate con sus valores de ATQ y DEF.", "Occupies a slot and fights using its ATK and DEF."] },
  HECHIZO: { color: "#c4b5fd", icon: "✦", es: "Hechizo", en: "Spell", hint: ["Resuelve sus efectos y después va al cementerio.", "Resolves its effects, then goes to the graveyard."] },
  ALTERADOR: { color: "#5eead4", icon: "⌖", es: "Campo", en: "Field", hint: ["Permanece en la zona de campos y modifica la batalla.", "Stays in the field zone and changes the battle."] },
  MANA: { color: "#7dd3fc", icon: "◈", es: "Maná", en: "Mana", hint: ["Juega una fuente por turno. Cada fuente disponible paga una unidad de maná.", "Play one source per turn. Each available source pays one mana."] },
};
export type CardThemeStyle = CSSProperties & Record<"--card-element" | "--card-element-dark" | "--card-rarity" | "--card-type", string>;
export const getCardAppearance = (card: { attribute: string; rarity: string; cardType: string }) => {
  const element = ELEMENT_APPEARANCE[card.attribute] ?? ELEMENT_APPEARANCE.NORMAL;
  const rarity = RARITY_APPEARANCE[card.rarity] ?? RARITY_APPEARANCE.COMUN;
  const type = TYPE_APPEARANCE[card.cardType === "TIERRA" ? "MANA" : card.cardType] ?? TYPE_APPEARANCE.CRIATURA;
  const style: CardThemeStyle = {
    "--card-element": element.color, "--card-element-dark": element.dark,
    "--card-rarity": rarity.color, "--card-type": type.color,
  };
  return { element, rarity, type, style };
};
export const getShortAbilityTiming = (trigger: string, language = "es") => {
  const labels: Record<string, [string, string]> = {
    ACTIVATED: ["Activar · 1/turno", "Activate · 1/turn"], INSTANT: ["Al jugar", "On cast"],
    ON_ENTER: ["Al entrar", "On enter"], ON_ATTACK: ["Al atacar", "On attack"],
    ON_DAMAGE: ["Al recibir daño", "On damage"], ON_DEATH: ["Al morir", "On death"],
    ON_COMBAT_DAMAGE: ["Daño de combate", "Combat damage"], TURN_START: ["Inicio del turno", "Turn start"],
    TURN_END: ["Final del turno", "Turn end"], CONTINUO: ["Continuo", "Passive"], CONTINUOUS: ["Continuo", "Passive"],
    DAMAGE_PREVENTION: ["Prevención", "Prevention"], SUMMON_CONDITION: ["Para invocarla", "Summon condition"],
    ON_SACRIFICE: ["Al sacrificarla", "On sacrifice"], ON_SACRIFICE_FIRE: ["Sacrificio de Fuego", "Fire sacrifice"],
    ON_SACRIFICE_DRAGON: ["Sacrificio de dragón", "Dragon sacrifice"], ON_FIRE_DESTROYED: ["Al destruir Fuego", "Fire destroyed"],
    ON_DESTROY_ENEMY: ["Al vencer en combate", "On combat kill"],
  };
  return labels[trigger]?.[language === "en" ? 1 : 0] ?? (language === "en" ? "Effect" : "Efecto");
};
