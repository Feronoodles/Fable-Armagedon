export const volcanicExpansionCardNames = new Set([
  "Huevo de Dragón Volcánico", "Dragón Volcánico", "Fanático de la Llama Solar",
  "Berserker de la Fisura Ardiente", "Portador del Estandarte Carmesí", "Dragón Volcánico Ancestral",
  "Guardián de la Caldera Eterna", "Tormenta de Cenizas", "Sacerdote del Núcleo Ardiente",
  "Ofrenda al Sol Carmesí", "Ritual de la Erupción Imperial", "Dragón de Guerra Volcánico",
  "General Volcánico Kharzeth", "Forjador del Núcleo Ígneo", "Ascensión Volcánica",
  "Avatar del Sol Devastador", "Ritual de Incineración Total", "Emperador Volcánico Ignathor",
  "Sumo Hierofante Pyrothar", "Juramento del Trono Ígneo", "Dominus Volcánico Astravor", "Volcán del fin", "Caracol Volcánico",
]);

export const getCardExpansionKey = (cardName: string) => volcanicExpansionCardNames.has(cardName) ? "VOLCAN_DORMIDO" : "CORE";
