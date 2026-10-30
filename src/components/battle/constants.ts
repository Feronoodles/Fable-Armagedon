export const elementIcons: Record<string, string> = {
  FUEGO: "🔥",
  AGUA: "💧",
  NATURALEZA: "🌿",
  RAYO: "⚡",
  VACIO: "🌑",
  NORMAL: "⬜",
  TIERRA: "🏔️",
  METAL: "⚙️",
  LEGENDARIO: "⭐",
  CELESTIAL: "✨",
};

export const cardTypeNames: Record<string, { es: string; en: string }> = {
  CRIATURA: { es: "Criatura", en: "Creature" },
  HECHIZO: { es: "Hechizo", en: "Spell" },
  ALTERADOR: { es: "Alterador", en: "Field Alterer" },
  MANA: { es: "Mana", en: "Mana" },
  TIERRA: { es: "Mana", en: "Mana" },
};

export const rarityColors: Record<string, string> = {
  COMUN: "border-gray-400 text-gray-300",
  INFRECUENTE: "border-green-400 text-green-300",
  RARA: "border-blue-400 text-blue-300",
  EPICA: "border-purple-400 text-purple-300",
  LEGENDARIA: "border-yellow-400 text-yellow-300",
  CELESTIAL: "border-pink-300 text-pink-200",
};
