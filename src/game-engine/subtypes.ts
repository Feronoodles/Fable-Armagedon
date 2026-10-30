export const CREATURE_SUBTYPES: Record<string, { es: string; en: string }> = {
  DINOSAURIO: { es: "Dinosaurio", en: "Dinosaur" },
  DRAGON: { es: "Dragón", en: "Dragon" },
  MECHA: { es: "Mecha", en: "Mecha" },
  HUMANO: { es: "Humano", en: "Human" },
  ELFO: { es: "Elfo", en: "Elf" },
  ORCO: { es: "Orco", en: "Orc" },
  RENACIDO: { es: "Renacido", en: "Reborn" },
  VEILBORN: { es: "Veilborn", en: "Veilborn" },
  TITAN: { es: "Titán", en: "Titan" },
  ALIMANA: { es: "Alimaña", en: "Vermin" },
};

export const CREATURE_SUBTYPE_KEYS = Object.keys(CREATURE_SUBTYPES);
export const getSubtypeLabel = (subtype: string, language = "es") => CREATURE_SUBTYPES[subtype]?.[language === "en" ? "en" : "es"] ?? subtype;
