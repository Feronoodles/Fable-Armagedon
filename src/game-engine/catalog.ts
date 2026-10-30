import type { CardDefinition } from "./types";

export const cardCatalog = [
  // ==================== MANA BÁSICO (GRATIS) ====================
  {
    name: "Mana de Fuego",
    description: "Un mana ardiente que canaliza el poder del fuego.",
    cost: 0,
    cardType: "MANA",
    rarity: "COMUN",
    manaTypes: ["FUEGO"],
    attribute: "FUEGO",
    subtypes: ["MANA"],
    abilities: [
      {
        name: "Generar Fuego",
        description: "Gasta esta carta para generar 1 mana de Fuego",
        trigger: "ACTIVATED",
        effect: "GENERATE_FIRE_MANA"
      }
    ],
    flavorText: "El calor del núcleo del mundo fluye a través de este mana."
  },
  {
    name: "Mana de Agua",
    description: "Un mana acuático que canaliza el poder del agua.",
    cost: 0,
    cardType: "MANA",
    rarity: "COMUN",
    manaTypes: ["AGUA"],
    attribute: "AGUA",
    subtypes: ["MANA"],
    abilities: [
      {
        name: "Generar Agua",
        description: "Gasta esta carta para generar 1 mana de Agua",
        trigger: "ACTIVATED",
        effect: "GENERATE_WATER_MANA"
      }
    ],
    flavorText: "Las corrientes subterráneas nunca dejan de fluir."
  },
  {
    name: "Mana de Naturaleza",
    description: "Un mana fértil que canaliza el poder de la naturaleza.",
    cost: 0,
    cardType: "MANA",
    rarity: "COMUN",
    manaTypes: ["NATURALEZA"],
    attribute: "NATURALEZA",
    subtypes: ["MANA"],
    abilities: [
      {
        name: "Generar Naturaleza",
        description: "Gasta esta carta para generar 1 mana de Naturaleza",
        trigger: "ACTIVATED",
        effect: "GENERATE_NATURE_MANA"
      }
    ],
    flavorText: "La vida brota de cada grano de este mana sagrado."
  },
  {
    name: "Mana de Rayo",
    description: "Un mana eléctrico que canaliza el poder del rayo.",
    cost: 0,
    cardType: "MANA",
    rarity: "COMUN",
    manaTypes: ["RAYO"],
    attribute: "RAYO",
    subtypes: ["MANA"],
    abilities: [
      {
        name: "Generar Rayo",
        description: "Gasta esta carta para generar 1 mana de Rayo",
        trigger: "ACTIVATED",
        effect: "GENERATE_LIGHTNING_MANA"
      }
    ],
    flavorText: "La electricidad estática nunca desaparece de este mana."
  },
  {
    name: "Mana de Vacío",
    description: "Un mana oscuro que canaliza el poder del vacío.",
    cost: 0,
    cardType: "MANA",
    rarity: "COMUN",
    manaTypes: ["VACIO"],
    attribute: "VACIO",
    subtypes: ["MANA"],
    abilities: [
      {
        name: "Generar Vacío",
        description: "Gasta esta carta para generar 1 mana de Vacío",
        trigger: "ACTIVATED",
        effect: "GENERATE_VOID_MANA"
      }
    ],
    flavorText: "La ausencia misma tiene poder en este mana maldito."
  },
  {
    name: "Mana Normal",
    description: "Un mana común que canaliza mana sin elemento.",
    cost: 0,
    cardType: "MANA",
    rarity: "COMUN",
    manaTypes: ["NORMAL"],
    attribute: "NORMAL",
    subtypes: ["MANA"],
    abilities: [
      {
        name: "Generar Mana",
        description: "Gasta esta carta para generar 1 mana incoloro",
        trigger: "ACTIVATED",
        effect: "GENERATE_COLORLESS_MANA"
      }
    ],
    flavorText: "La simplicidad misma es una forma de poder."
  },
  {
    name: "Mana de Tierra",
    description: "Un mana sólido que canaliza el poder de la tierra.",
    cost: 0,
    cardType: "MANA",
    rarity: "COMUN",
    manaTypes: ["TIERRA"],
    attribute: "TIERRA",
    subtypes: ["MANA"],
    abilities: [
      {
        name: "Generar Tierra",
        description: "Gasta esta carta para generar 1 mana de Tierra",
        trigger: "ACTIVATED",
        effect: "GENERATE_EARTH_MANA"
      }
    ],
    flavorText: "La roca madre es la base de todo."
  },
  {
    name: "Mana de Metal",
    description: "Un mana metálico que canaliza el poder del metal.",
    cost: 0,
    cardType: "MANA",
    rarity: "COMUN",
    manaTypes: ["METAL"],
    attribute: "METAL",
    subtypes: ["MANA"],
    abilities: [
      {
        name: "Generar Metal",
        description: "Gasta esta carta para generar 1 mana de Metal",
        trigger: "ACTIVATED",
        effect: "GENERATE_METAL_MANA"
      }
    ],
    flavorText: "Los minerales raros brillan bajo la superficie."
  },

  // ==================== SANTUARIOS (MANA LEGENDARIO) ====================
  {
    name: "Santuario de Fuego",
    description: "Un mana sagrado que arde con poder ancestral. Puede generar mana para cartas legendarias.",
    cost: 0,
    cardType: "MANA",
    rarity: "LEGENDARIA",
    manaTypes: ["FUEGO", "LEGENDARIO"],
    attribute: "FUEGO",
    subtypes: ["MANA"],
    abilities: [
      {
        name: "Generar Fuego Legendario",
        description: "Gasta esta carta para generar 1 mana de Fuego o para invocar cartas legendarias",
        trigger: "ACTIVATED",
        effect: "GENERATE_FIRE_OR_LEGENDARY_MANA"
      }
    ],
    flavorText: "Las llamas eternas guardan secretos de héroes olvidados."
  },
  {
    name: "Santuario de Agua",
    description: "Un mana sagrado que fluye con poder ancestral. Puede generar mana para cartas legendarias.",
    cost: 0,
    cardType: "MANA",
    rarity: "LEGENDARIA",
    manaTypes: ["AGUA", "LEGENDARIO"],
    attribute: "AGUA",
    subtypes: ["MANA"],
    abilities: [
      {
        name: "Generar Agua Legendaria",
        description: "Gasta esta carta para generar 1 mana de Agua o para invocar cartas legendarias",
        trigger: "ACTIVATED",
        effect: "GENERATE_WATER_OR_LEGENDARY_MANA"
      }
    ],
    flavorText: "Las profundidades ocultan tesoros de eras pasadas."
  },
  {
    name: "Santuario de Naturaleza",
    description: "Una tierra sagrada que florece con poder ancestral. Puede generar mana para cartas legendarias.",
    cost: 0,
    cardType: "MANA",
    rarity: "LEGENDARIA",
    manaTypes: ["NATURALEZA", "LEGENDARIO"],
    attribute: "NATURALEZA",
    subtypes: ["MANA"],
    abilities: [
      {
        name: "Generar Naturaleza Legendaria",
        description: "Gasta esta carta para generar 1 mana de Naturaleza o para invocar cartas legendarias",
        trigger: "ACTIVATED",
        effect: "GENERATE_NATURE_OR_LEGENDARY_MANA"
      }
    ],
    flavorText: "Los árboles milenarios susurran nombres de leyendas."
  },
  {
    name: "Santuario de Rayo",
    description: "Una tierra sagrada que crepita con poder ancestral. Puede generar mana para cartas legendarias.",
    cost: 0,
    cardType: "MANA",
    rarity: "LEGENDARIA",
    manaTypes: ["RAYO", "LEGENDARIO"],
    attribute: "RAYO",
    subtypes: ["MANA"],
    abilities: [
      {
        name: "Generar Rayo Legendario",
        description: "Gasta esta carta para generar 1 mana de Rayo o para invocar cartas legendarias",
        trigger: "ACTIVATED",
        effect: "GENERATE_LIGHTNING_OR_LEGENDARY_MANA"
      }
    ],
    flavorText: "La tormenta eterna recuerda a cada campeón caído."
  },
  {
    name: "Santuario de Vacío",
    description: "Una tierra sagrada que absorbe con poder ancestral. Puede generar mana para cartas legendarias.",
    cost: 0,
    cardType: "MANA",
    rarity: "LEGENDARIA",
    manaTypes: ["VACIO", "LEGENDARIO"],
    attribute: "VACIO",
    subtypes: ["MANA"],
    abilities: [
      {
        name: "Generar Vacío Legendario",
        description: "Gasta esta carta para generar 1 mana de Vacío o para invocar cartas legendarias",
        trigger: "ACTIVATED",
        effect: "GENERATE_VOID_OR_LEGENDARY_MANA"
      }
    ],
    flavorText: "El abismo guarda la memoria de los inmortales."
  },
  {
    name: "Santuario Normal",
    description: "Una tierra sagrada sin elemento que irradia poder ancestral. Puede generar mana para cartas legendarias.",
    cost: 0,
    cardType: "MANA",
    rarity: "LEGENDARIA",
    manaTypes: ["NORMAL", "LEGENDARIO"],
    attribute: "NORMAL",
    subtypes: ["MANA"],
    abilities: [
      {
        name: "Generar Mana Legendario",
        description: "Gasta esta carta para generar 1 mana incoloro o para invocar cartas legendarias",
        trigger: "ACTIVATED",
        effect: "GENERATE_COLORLESS_OR_LEGENDARY_MANA"
      }
    ],
    flavorText: "En la simplicidad residen las leyendas más grandes."
  },
  {
    name: "Santuario de Tierra",
    description: "Una tierra sagrada que perdura con poder ancestral. Puede generar mana para cartas legendarias.",
    cost: 0,
    cardType: "MANA",
    rarity: "LEGENDARIA",
    manaTypes: ["TIERRA", "LEGENDARIO"],
    attribute: "TIERRA",
    subtypes: ["MANA"],
    abilities: [
      {
        name: "Generar Tierra Legendaria",
        description: "Gasta esta carta para generar 1 mana de Tierra o para invocar cartas legendarias",
        trigger: "ACTIVATED",
        effect: "GENERATE_EARTH_OR_LEGENDARY_MANA"
      }
    ],
    flavorText: "La roca eterna fue testigo del nacimiento de héroes."
  },
  {
    name: "Santuario de Metal",
    description: "Una tierra sagrada que resuena con poder ancestral. Puede generar mana para cartas legendarias.",
    cost: 0,
    cardType: "MANA",
    rarity: "LEGENDARIA",
    manaTypes: ["METAL", "LEGENDARIO"],
    attribute: "METAL",
    subtypes: ["MANA"],
    abilities: [
      {
        name: "Generar Metal Legendario",
        description: "Gasta esta carta para generar 1 mana de Metal o para invocar cartas legendarias",
        trigger: "ACTIVATED",
        effect: "GENERATE_METAL_OR_LEGENDARY_MANA"
      }
    ],
    flavorText: "Las forjas antiguas crearon armas de leyenda."
  },

  // ==================== TRONOS (TIERRAS CELESTIALES) ====================
  {
    name: "Trono de Fuego",
    description: "El asiento de los dioses del fuego. Puede generar mana para cartas celestiales.",
    cost: 0,
    cardType: "MANA",
    rarity: "CELESTIAL",
    manaTypes: ["FUEGO", "CELESTIAL"],
    attribute: "FUEGO",
    subtypes: ["MANA"],
    abilities: [
      {
        name: "Generar Fuego Celestial",
        description: "Gasta esta carta para generar 1 mana de Fuego o para invocar cartas celestiales",
        trigger: "ACTIVATED",
        effect: "GENERATE_FIRE_OR_CELESTIAL_MANA"
      }
    ],
    flavorText: "Donde el sol toca la tierra, nace el poder divino."
  },
  {
    name: "Trono de Agua",
    description: "El asiento de los dioses del agua. Puede generar mana para cartas celestiales.",
    cost: 0,
    cardType: "MANA",
    rarity: "CELESTIAL",
    manaTypes: ["AGUA", "CELESTIAL"],
    attribute: "AGUA",
    subtypes: ["MANA"],
    abilities: [
      {
        name: "Generar Agua Celestial",
        description: "Gasta esta carta para generar 1 mana de Agua o para invocar cartas celestiales",
        trigger: "ACTIVATED",
        effect: "GENERATE_WATER_OR_CELESTIAL_MANA"
      }
    ],
    flavorText: "Los mares infinitos guardan tronos olvidados."
  },
  {
    name: "Trono de Naturaleza",
    description: "El asiento de los dioses de la naturaleza. Puede generar mana para cartas celestiales.",
    cost: 0,
    cardType: "MANA",
    rarity: "CELESTIAL",
    manaTypes: ["NATURALEZA", "CELESTIAL"],
    attribute: "NATURALEZA",
    subtypes: ["MANA"],
    abilities: [
      {
        name: "Generar Naturaleza Celestial",
        description: "Gasta esta carta para generar 1 mana de Naturaleza o para invocar cartas celestiales",
        trigger: "ACTIVATED",
        effect: "GENERATE_NATURE_OR_CELESTIAL_MANA"
      }
    ],
    flavorText: "El primer bosque fue plantado por manos divinas."
  },
  {
    name: "Trono de Rayo",
    description: "El asiento de los dioses del rayo. Puede generar mana para cartas celestiales.",
    cost: 0,
    cardType: "MANA",
    rarity: "CELESTIAL",
    manaTypes: ["RAYO", "CELESTIAL"],
    attribute: "RAYO",
    subtypes: ["MANA"],
    abilities: [
      {
        name: "Generar Rayo Celestial",
        description: "Gasta esta carta para generar 1 mana de Rayo o para invocar cartas celestiales",
        trigger: "ACTIVATED",
        effect: "GENERATE_LIGHTNING_OR_CELESTIAL_MANA"
      }
    ],
    flavorText: "El cielo mismo se partió para revelar este trono."
  },
  {
    name: "Trono de Vacío",
    description: "El asiento de los dioses del vacío. Puede generar mana para cartas celestiales.",
    cost: 0,
    cardType: "MANA",
    rarity: "CELESTIAL",
    manaTypes: ["VACIO", "CELESTIAL"],
    attribute: "VACIO",
    subtypes: ["MANA"],
    abilities: [
      {
        name: "Generar Vacío Celestial",
        description: "Gasta esta carta para generar 1 mana de Vacío o para invocar cartas celestiales",
        trigger: "ACTIVATED",
        effect: "GENERATE_VOID_OR_CELESTIAL_MANA"
      }
    ],
    flavorText: "Entre las estrellas vacías, los dioses encontraron su hogar."
  },
  {
    name: "Trono Normal",
    description: "El asiento de los dioses primordiales. Puede generar mana para cartas celestiales.",
    cost: 0,
    cardType: "MANA",
    rarity: "CELESTIAL",
    manaTypes: ["NORMAL", "CELESTIAL"],
    attribute: "NORMAL",
    subtypes: ["MANA"],
    abilities: [
      {
        name: "Generar Mana Celestial",
        description: "Gasta esta carta para generar 1 mana incoloro o para invocar cartas celestiales",
        trigger: "ACTIVATED",
        effect: "GENERATE_COLORLESS_OR_CELESTIAL_MANA"
      }
    ],
    flavorText: "Antes de los elementos, existía el trono eterno."
  },
  {
    name: "Trono de Tierra",
    description: "El asiento de los dioses de la tierra. Puede generar mana para cartas celestiales.",
    cost: 0,
    cardType: "MANA",
    rarity: "CELESTIAL",
    manaTypes: ["TIERRA", "CELESTIAL"],
    attribute: "TIERRA",
    subtypes: ["MANA"],
    abilities: [
      {
        name: "Generar Tierra Celestial",
        description: "Gasta esta carta para generar 1 mana de Tierra o para invocar cartas celestiales",
        trigger: "ACTIVATED",
        effect: "GENERATE_EARTH_OR_CELESTIAL_MANA"
      }
    ],
    flavorText: "El núcleo del mundo es el primer trono de los dioses."
  },
  {
    name: "Trono de Metal",
    description: "El asiento de los dioses del metal. Puede generar mana para cartas celestiales.",
    cost: 0,
    cardType: "MANA",
    rarity: "CELESTIAL",
    manaTypes: ["METAL", "CELESTIAL"],
    attribute: "METAL",
    subtypes: ["MANA"],
    abilities: [
      {
        name: "Generar Metal Celestial",
        description: "Gasta esta carta para generar 1 mana de Metal o para invocar cartas celestiales",
        trigger: "ACTIVATED",
        effect: "GENERATE_METAL_OR_CELESTIAL_MANA"
      }
    ],
    flavorText: "El metal más puro fue forjado por manos celestiales."
  },

  // ==================== COMUNES ====================
  {
    name: "Guerrero Neandertal Cibernético",
    description: "Un guerrero prehistórico mejorado con tecnología futurista.",
    cost: 2,
    attack: 3,
    defense: 3,
    cardType: "CRIATURA",
    rarity: "COMUN",
    manaTypes: ["NATURALEZA"],
    attribute: "NATURALEZA",
    subtypes: ["HUMANO", "MECHA"],
    abilities: [
      {
        name: "Sinergia Prehistórica",
        description: "Si hay otra criatura HUMANO en campo, +1/+1",
        trigger: "CONTINUO",
        effect: "BUFF_IF_SUBTYPE_PRESENT"
      }
    ],
    flavorText: "La evolución no tiene límites cuando la tecnología se une con la naturaleza."
  },
  {
    name: "Dron Explorador Elemental",
    description: "Un dron que analiza el campo de batalla en busca de oportunidades.",
    cost: 1,
    attack: 1,
    defense: 2,
    cardType: "CRIATURA",
    rarity: "COMUN",
    manaTypes: ["RAYO"],
    attribute: "RAYO",
    subtypes: ["MECHA"],
    abilities: [
      {
        name: "Escaneo Táctico",
        description: "Al entrar: Roba 1 carta",
        trigger: "ON_ENTER",
        effect: "DRAW_1"
      }
    ],
    flavorText: "Los ojos mecánicos ven lo que los mortales ignoran."
  },
  {
    name: "Flecha de Fuego Ancestral",
    description: "Un hechizo de fuego pasado de generación en generación.",
    cost: 1,
    cardType: "HECHIZO",
    rarity: "COMUN",
    manaTypes: ["FUEGO"],
    attribute: "FUEGO",
    subtypes: [],
    abilities: [
      {
        name: "Impacto Ígneo",
        description: "Inflige 3 de daño a una criatura o jugador",
        trigger: "INSTANT",
        effect: "DAMAGE_3_TARGET"
      }
    ],
    flavorText: "El fuego que quemó a los antiguos aún arde en nuestras manos."
  },
  {
    name: "Campo de Energía Primitiva",
    description: "Un alterador que potencia las criaturas humanas.",
    cost: 2,
    cardType: "ALTERADOR",
    rarity: "COMUN",
    manaTypes: ["NATURALEZA"],
    attribute: "NATURALEZA",
    subtypes: [],
    abilities: [
      {
        name: "Energía Ancestral",
        description: "Las criaturas HUMANAS cuestan 1 menos de mana",
        trigger: "CONTINUO",
        effect: "REDUCE_COST_SUBTYPE"
      }
    ],
    flavorText: "La tierra recuerda a sus antiguos habitantes."
  },
  {
    name: "Escarabajo de Metal Ancestral",
    description: "Un insecto mecánico rescatado de ruinas olvidadas.",
    cost: 1,
    attack: 1,
    defense: 3,
    cardType: "CRIATURA",
    rarity: "COMUN",
    manaTypes: ["METAL"],
    attribute: "METAL",
    subtypes: ["MECHA"],
    abilities: [],
    flavorText: "Incluso los pequeños pueden ser resistentes."
  },
  {
    name: "Guerrero Humano del Yermo",
    description: "Un sobreviviente endurecido por las tierras devastadas.",
    cost: 2,
    attack: 2,
    defense: 2,
    cardType: "CRIATURA",
    rarity: "COMUN",
    manaTypes: ["NORMAL"],
    attribute: "NORMAL",
    subtypes: ["HUMANO"],
    abilities: [
      {
        name: "Resistencia",
        description: "Esta criatura puede bloquear a una criatura adicional",
        trigger: "CONTINUO",
        effect: "BLOCK_ADDITIONAL"
      }
    ],
    flavorText: "El yermo no perdona, pero tampoco deja de forjar guerreros."
  },
  {
    name: "Golem de Tierra Despertado",
    description: "Un constructo elemental que protege las tierras antiguas.",
    cost: 3,
    attack: 2,
    defense: 4,
    cardType: "CRIATURA",
    rarity: "COMUN",
    manaTypes: ["TIERRA"],
    attribute: "TIERRA",
    subtypes: ["MECHA"],
    abilities: [
      {
        name: "Defensor",
        description: "Esta criatura no puede atacar",
        trigger: "CONTINUO",
        effect: "CANT_ATTACK"
      }
    ],
    flavorText: "La tierra se alza para proteger lo suyo."
  },

  // ==================== INFRECUENTES ====================
  {
    name: "Caballero Dragón Mecha",
    description: "Un caballero que domina la tecnología dragónica.",
    cost: 4,
    attack: 5,
    defense: 4,
    cardType: "CRIATURA",
    rarity: "INFRECUENTE",
    manaTypes: ["FUEGO", "RAYO"],
    attribute: "FUEGO",
    subtypes: ["HUMANO", "DRAGON", "MECHA"],
    abilities: [
      {
        name: "Aliento de Fuego Cibernético",
        description: "Al entrar: Inflige 2 de daño a todas las criaturas enemigas",
        trigger: "ON_ENTER",
        effect: "DAMAGE_2_ALL_ENEMIES"
      }
    ],
    flavorText: "El fuego del pasado se encuentra con la tecnología del futuro."
  },
  {
    name: "Hechizo de Evolución Temporal",
    description: "Manipula el tiempo para mejorar tus criaturas.",
    cost: 3,
    cardType: "HECHIZO",
    rarity: "INFRECUENTE",
    manaTypes: ["NATURALEZA"],
    attribute: "NATURALEZA",
    subtypes: [],
    abilities: [
      {
        name: "Evolución Acelerada",
        description: "Transforma una criatura Común en tu mano en una versión Infrecuente aleatoria del mismo atributo",
        trigger: "INSTANT",
        effect: "UPGRADE_COMMON_TO_UNCOMMON"
      }
    ],
    flavorText: "El tiempo es un recurso... si sabes cómo usarlo."
  },
  {
    name: "Portal Elemental Caótico",
    description: "Un portal inestable que transforma la energía.",
    cost: 3,
    cardType: "ALTERADOR",
    rarity: "INFRECUENTE",
    manaTypes: ["VACIO"],
    attribute: "VACIO",
    subtypes: [],
    abilities: [
      {
        name: "Transmutación Caótica",
        description: "Una vez por turno, puedes pagar 1 mana de cualquier elemento para generar 1 mana de un elemento diferente al azar",
        trigger: "ACTIVATED",
        effect: "CONVERT_MANA_RANDOM"
      }
    ],
    flavorText: "El caos es solo orden que no entendemos... todavía."
  },
  {
    name: "Elfo Ingeniero Temporal",
    description: "Un maestro elfo que comprende el flujo del tiempo.",
    cost: 2,
    attack: 2,
    defense: 3,
    cardType: "CRIATURA",
    rarity: "INFRECUENTE",
    manaTypes: ["RAYO"],
    attribute: "RAYO",
    subtypes: ["ELFO", "MECHA"],
    abilities: [
      {
        name: "Manipulación Temporal",
        description: "Al atacar: Puedes hacer que esta criatura no sea bloqueable este turno",
        trigger: "ON_ATTACK",
        effect: "UNBLOCKABLE_OPTION"
      }
    ],
    flavorText: "Los elfos siempre han sido longevos; ahora también son puntuales."
  },
  {
    name: "Orco Renacido por la Forja",
    description: "Un orco resucitado y mejorado con magia de fuego.",
    cost: 3,
    attack: 4,
    defense: 3,
    cardType: "CRIATURA",
    rarity: "INFRECUENTE",
    manaTypes: ["FUEGO"],
    attribute: "FUEGO",
    subtypes: ["ORCO", "RENACIDO"],
    abilities: [
      {
        name: "Ira Ardiente",
        description: "Cuando esta criatura recibe daño, gana +2/+0 hasta el final del turno",
        trigger: "ON_DAMAGE",
        effect: "BUFF_WHEN_DAMAGED"
      }
    ],
    flavorText: "La forja no solo crea armas; también crea guerreros."
  },

  // ==================== RARAS ====================
  {
    name: "Rex Volcánico Biomecánico",
    description: "Un tiranosaurio fusionado con magma y tecnología.",
    cost: 6,
    attack: 7,
    defense: 6,
    cardType: "CRIATURA",
    rarity: "RARA",
    manaTypes: ["FUEGO", "NATURALEZA"],
    attribute: "FUEGO",
    subtypes: ["DINOSAURIO", "MECHA"],
    abilities: [
      {
        name: "Intimidar",
        description: "Las criaturas enemigas con menos ataque no pueden bloquear",
        trigger: "CONTINUO",
        effect: "INTIMIDATE"
      },
      {
        name: "Erupción Final",
        description: "Al morir: Inflige 3 de daño a todos",
        trigger: "ON_DEATH",
        effect: "DAMAGE_3_ALL"
      }
    ],
    flavorText: "El rey de los dinosaurios ha evolucionado... y está furioso."
  },
  {
    name: "Tormenta de Éter Arcano",
    description: "Un hechizo que desgarra la realidad misma.",
    cost: 5,
    cardType: "HECHIZO",
    rarity: "RARA",
    manaTypes: ["RAYO", "AGUA"],
    attribute: "RAYO",
    subtypes: [],
    abilities: [
      {
        name: "Desgarre Dimensional",
        description: "Devuelve todas las criaturas enemigas con 3 o menos de ataque a la mano. Roba 1 carta por cada criatura devuelta",
        trigger: "INSTANT",
        effect: "BOUNCE_DRAW"
      }
    ],
    flavorText: "El éter no distingue entre aliado y enemigo; solo obedece al poder."
  },
  {
    name: "Santuario de los Ancestros",
    description: "Un lugar sagrado donde los antiguos otorgan sus bendiciones.",
    cost: 4,
    cardType: "ALTERADOR",
    rarity: "RARA",
    manaTypes: ["NATURALEZA"],
    attribute: "NATURALEZA",
    subtypes: [],
    abilities: [
      {
        name: "Bendición Ancestral",
        description: "Al inicio de tu turno, ganas 1 vida por cada criatura HUMANA que controles",
        trigger: "TURN_START",
        effect: "LIFE_GAIN_PER_SUBTYPE"
      },
      {
        name: "Protección Antigua",
        description: "Tus criaturas HUMANAS tienen +0/+2",
        trigger: "CONTINUO",
        effect: "BUFF_SUBTYPE_DEFENSE"
      }
    ],
    flavorText: "Los ancestros nunca abandonan a los suyos."
  },
  {
    name: "Dragón Mecánico de Obsidiana",
    description: "Un dragón forjado en los volcanes y mejorado con tecnología.",
    cost: 5,
    attack: 5,
    defense: 5,
    cardType: "CRIATURA",
    rarity: "RARA",
    manaTypes: ["METAL", "FUEGO"],
    attribute: "METAL",
    subtypes: ["DRAGON", "MECHA"],
    abilities: [
      {
        name: "Alas de Acero Fundido",
        description: "Puede atacar en el turno que entra",
        trigger: "CONTINUO",
        effect: "HASTE"
      },
      {
        name: "Armadura de Obsidiana",
        description: "La primera vez que recibiría daño cada turno, niega ese daño",
        trigger: "DAMAGE_PREVENTION",
        effect: "FIRST_DAMAGE_NEGATED"
      }
    ],
    flavorText: "El metal más negro contiene el fuego más brillante."
  },
  {
    name: "Dinosaurio Alfa del Vacío",
    description: "Un depredador prehistórico consumido por el vacío.",
    cost: 5,
    attack: 6,
    defense: 5,
    cardType: "CRIATURA",
    rarity: "RARA",
    manaTypes: ["VACIO"],
    attribute: "VACIO",
    subtypes: ["DINOSAURIO", "VEILBORN"],
    abilities: [
      {
        name: "Toque del Vacío",
        description: "Cuando hace daño de combate, el controlador pierde 2 vidas",
        trigger: "ON_COMBAT_DAMAGE",
        effect: "LIFE_LOSS_2"
      }
    ],
    flavorText: "El vacío reclama todo, incluso a los reyes prehistóricos."
  },

  // ==================== ÉPICAS ====================
  {
    name: "Titán Colisionador de Eras",
    description: "Una fusión de tecnología, magia y evolución prehistórica.",
    cost: 8,
    attack: 10,
    defense: 10,
    cardType: "CRIATURA",
    rarity: "EPICA",
    manaTypes: ["FUEGO", "NATURALEZA", "VACIO"],
    attribute: "VACIO",
    subtypes: ["TITAN", "MECHA"],
    abilities: [
      {
        name: "Inmunidad Arcana",
        description: "Inmune a hechizos",
        trigger: "CONTINUO",
        effect: "SPELL_IMMUNITY"
      },
      {
        name: "Desafío de Eras",
        description: "Cuando ataca, elige hasta 3 criaturas enemigas; deben bloquear a este Titán si pueden",
        trigger: "ON_ATTACK",
        effect: "FORCE_BLOCK"
      },
      {
        name: "Sinergia Triple",
        description: "Si hay criaturas DINOSAURIO, MECHA y HUMANO en tu campo, tiene 'Ataque Doble'",
        trigger: "CONTINUO",
        effect: "DOUBLE_ATTACK_IF_SYNERGY"
      }
    ],
    flavorText: "Donde pasado, presente y futuro colisionan, nace la destrucción absoluta."
  },

  // ==================== LEGENDARIAS ====================
  {
    name: "El Arquitecto del Armagedón Fable",
    description: "El creador de la colisión de mundos.",
    cost: 8,
    attack: 8,
    defense: 8,
    cardType: "CRIATURA",
    rarity: "LEGENDARIA",
    manaTypes: ["FUEGO", "AGUA", "NATURALEZA", "RAYO"],
    attribute: "NORMAL",
    subtypes: ["TITAN"],
    abilities: [
      {
        name: "Colisión de Mundos",
        description: "Cuando entra al campo, destruye todos los Alteradores de Campo en juego",
        trigger: "ON_ENTER",
        effect: "DESTROY_ALL_FIELD_ALTERERS"
      },
      {
        name: "Reconstrucción Absoluta",
        description: "Luego, juega cualquier número de Alteradores de Campo desde tu mano sin pagar su costo",
        trigger: "ON_ENTER",
        effect: "PLAY_FIELD_ALTERERS_FREE"
      },
      {
        name: "Maestría de la Diversidad",
        description: "Tus criaturas ganan +2/+2 por cada subtipo diferente de criatura que controles",
        trigger: "CONTINUO",
        effect: "BUFF_PER_SUBTYPE"
      }
    ],
    flavorText: "Yo vi el final de todas las eras y decidí que necesitaban unirse."
  },

  // ==================== CELESTIALES ====================
  {
    name: "Armonía de los 8 Mundos",
    description: "La manifestación perfecta del equilibrio elemental.",
    cost: 6,
    cardType: "ALTERADOR",
    rarity: "CELESTIAL",
    manaTypes: ["FUEGO", "AGUA", "NATURALEZA"],
    attribute: "NORMAL",
    subtypes: [],
    abilities: [
      {
        name: "Restricción Celestial",
        description: "Solo funciona si tienes 3+ elementos diferentes en tu campo",
        trigger: "CONTINUOUS",
        effect: "REQUIRES_3_ELEMENTS"
      },
      {
        name: "Equilibrio Perfecto",
        description: "Todas tus criaturas ganan +3/+3 y habilidades de cada elemento presente",
        trigger: "CONTINUOUS",
        effect: "MASS_BUFF_AND_ABILITIES"
      },
      {
        name: "Resonancia Elemental",
        description: "Al final de cada turno, ganas 1 vida por cada elemento diferente que controles",
        trigger: "TURN_END",
        effect: "LIFE_GAIN_PER_ELEMENT"
      }
    ],
    flavorText: "Cuando los ocho elementos cantan en armonía, los dioses escuchan."
  },

  // ==================== CARTAS CORE PARA MAZOS INICIALES ====================
  {
    name: "Aprendiz de la Primera Llama",
    description: "Un aprendiz que aprende a pelear junto a otras criaturas de fuego.",
    cost: 1,
    attack: 1,
    defense: 2,
    cardType: "CRIATURA",
    rarity: "COMUN",
    manaTypes: ["FUEGO"],
    attribute: "FUEGO",
    subtypes: ["HUMANO"],
    abilities: [
      {
        name: "Chispa Compartida",
        description: "Al entrar: Si controlas otra criatura de fuego, gana +1 ATQ este turno",
        trigger: "ON_ENTER",
        effect: "BUFF_IF_ATTRIBUTE_PRESENT"
      }
    ],
    flavorText: "Toda gran llama empieza con una chispa pequeña."
  },
  {
    name: "Dragón de Chispa",
    description: "Un dragón joven que crece cuando la camada permanece unida.",
    cost: 2,
    attack: 2,
    defense: 2,
    cardType: "CRIATURA",
    rarity: "COMUN",
    manaTypes: ["FUEGO"],
    attribute: "FUEGO",
    subtypes: ["DRAGON"],
    abilities: [
      {
        name: "Camada Ardiente",
        description: "Mientras controles otra criatura DRAGON, gana +1 ATQ",
        trigger: "CONTINUO",
        effect: "BUFF_IF_SUBTYPE_PRESENT"
      }
    ],
    flavorText: "El primer vuelo siempre se hace acompañado."
  },
  {
    name: "Estandarte de la Primera Llama",
    description: "Un estandarte sencillo que reúne a los combatientes de fuego.",
    cost: 2,
    cardType: "ALTERADOR",
    rarity: "COMUN",
    manaTypes: ["FUEGO"],
    attribute: "FUEGO",
    subtypes: [],
    abilities: [
      {
        name: "Formación Ígnea",
        description: "Tus criaturas de fuego ganan +1 ATQ",
        trigger: "CONTINUO",
        effect: "BUFF_FIRE_ATK"
      }
    ],
    flavorText: "Un símbolo pequeño puede convertir una retirada en una carga."
  },
  {
    name: "Mecánico de la Fractura",
    description: "Un técnico que recupera piezas útiles de las ruinas temporales.",
    cost: 2,
    attack: 2,
    defense: 2,
    cardType: "CRIATURA",
    rarity: "COMUN",
    manaTypes: ["METAL"],
    attribute: "METAL",
    subtypes: ["MECHA"],
    abilities: [
      {
        name: "Pieza Recuperada",
        description: "Al entrar: Roba 1 carta",
        trigger: "ON_ENTER",
        effect: "DRAW_1"
      }
    ],
    flavorText: "Nada está perdido si todavía puede volver a ensamblarse."
  },
  {
    name: "Dron de Reparación",
    description: "Un pequeño dron que mantiene en pie a la formación mecánica.",
    cost: 2,
    attack: 1,
    defense: 3,
    cardType: "CRIATURA",
    rarity: "COMUN",
    manaTypes: ["METAL"],
    attribute: "METAL",
    subtypes: ["MECHA"],
    abilities: [
      {
        name: "Mantenimiento de Campo",
        description: "Mientras controles otra criatura MECHA, gana +0 DEF",
        trigger: "CONTINUO",
        effect: "BUFF_IF_SUBTYPE_PRESENT"
      }
    ],
    flavorText: "Las grandes máquinas también dependen de manos diminutas."
  },
  {
    name: "Núcleo de Sobrecarga",
    description: "Un núcleo inestable que acelera la construcción de máquinas.",
    cost: 3,
    cardType: "ALTERADOR",
    rarity: "INFRECUENTE",
    manaTypes: ["METAL"],
    attribute: "METAL",
    subtypes: [],
    abilities: [
      {
        name: "Producción Acelerada",
        description: "Tus criaturas MECHA cuestan 1 menos de mana",
        trigger: "CONTINUO",
        effect: "REDUCE_COST_SUBTYPE"
      }
    ],
    flavorText: "La máquina no necesita dormir, pero sí necesita energía."
  },
  {
    name: "Guardián de la Raíz Temporal",
    description: "Un protector que ancla el campo cuando las eras comienzan a separarse.",
    cost: 2,
    attack: 2,
    defense: 3,
    cardType: "CRIATURA",
    rarity: "COMUN",
    manaTypes: ["NATURALEZA"],
    attribute: "NATURALEZA",
    subtypes: ["HUMANO"],
    abilities: [
      {
        name: "Raíces Firmes",
        description: "Esta criatura puede bloquear a una criatura adicional",
        trigger: "CONTINUO",
        effect: "BLOCK_ADDITIONAL"
      }
    ],
    flavorText: "El tiempo puede doblarse, pero una raíz bien plantada resiste."
  },
  {
    name: "Consejera del Bosque Partido",
    description: "Una guía que convierte la paciencia en resistencia.",
    cost: 3,
    attack: 2,
    defense: 4,
    cardType: "CRIATURA",
    rarity: "INFRECUENTE",
    manaTypes: ["NATURALEZA"],
    attribute: "NATURALEZA",
    subtypes: ["HUMANO"],
    abilities: [
      {
        name: "Consejo Ancestral",
        description: "Al inicio de tu turno, ganas 1 vida si controlas otra criatura HUMANO",
        trigger: "TURN_START",
        effect: "LIFE_GAIN_PER_SUBTYPE"
      }
    ],
    flavorText: "Cada era deja una lección para quien sabe escuchar."
  },
  {
    name: "Muro de Raíces Temporales",
    description: "Un campo de raíces que protege a los defensores humanos.",
    cost: 2,
    cardType: "ALTERADOR",
    rarity: "COMUN",
    manaTypes: ["NATURALEZA"],
    attribute: "NATURALEZA",
    subtypes: [],
    abilities: [
      {
        name: "Defensa Compartida",
        description: "Tus criaturas HUMANAS tienen +0/+1",
        trigger: "CONTINUO",
        effect: "BUFF_SUBTYPE_DEFENSE"
      }
    ],
    flavorText: "El bosque no avanza; permanece y hace imposible el paso."
  },
  {
    name: "Larva del Vacío",
    description: "Una criatura pequeña que deja un eco cuando es destruida.",
    cost: 2,
    attack: 2,
    defense: 1,
    cardType: "CRIATURA",
    rarity: "COMUN",
    manaTypes: ["VACIO"],
    attribute: "VACIO",
    subtypes: ["DINOSAURIO", "VEILBORN"],
    abilities: [
      {
        name: "Eco de Supervivencia",
        description: "Al morir: Roba 1 carta",
        trigger: "ON_DEATH",
        effect: "DRAW_1"
      }
    ],
    flavorText: "El vacío no da vida, pero siempre conserva un recuerdo."
  },
  {
    name: "Oráculo de la Fisura",
    description: "Una vidente que observa los caminos posibles entre dos eras.",
    cost: 3,
    attack: 2,
    defense: 3,
    cardType: "CRIATURA",
    rarity: "INFRECUENTE",
    manaTypes: ["VACIO"],
    attribute: "VACIO",
    subtypes: ["VEILBORN"],
    abilities: [
      {
        name: "Visión Fracturada",
        description: "Al entrar: Roba 1 carta",
        trigger: "ON_ENTER",
        effect: "DRAW_1"
      }
    ],
    flavorText: "El futuro no está escrito; solo está esperando ser elegido."
  },
  {
    name: "Eco del Abismo",
    description: "Una descarga de vacío que devuelve una amenaza menor a su origen.",
    cost: 2,
    cardType: "HECHIZO",
    rarity: "COMUN",
    manaTypes: ["VACIO"],
    attribute: "VACIO",
    subtypes: [],
    abilities: [
      {
        name: "Retorno al Abismo",
        description: "Devuelve una criatura enemiga de 2 o menos ATQ a la mano",
        trigger: "INSTANT",
        effect: "BOUNCE_TARGET"
      }
    ],
    flavorText: "Toda criatura que cruza la fisura puede ser llamada de vuelta."
  },

  // ==================== APOYO CORE DE CONSISTENCIA ====================
  {
    name: "Soldado de Ceniza",
    description: "Un soldado de fuego sencillo que mantiene la primera línea.",
    cost: 2,
    attack: 2,
    defense: 2,
    cardType: "CRIATURA",
    rarity: "COMUN",
    manaTypes: ["FUEGO"],
    attribute: "FUEGO",
    subtypes: ["HUMANO"],
    abilities: [],
    flavorText: "La ceniza es el uniforme de quienes sobreviven al incendio."
  },
  {
    name: "Cría de Brasa",
    description: "Un dragón pequeño que aprende observando a su camada.",
    cost: 2,
    attack: 2,
    defense: 2,
    cardType: "CRIATURA",
    rarity: "COMUN",
    manaTypes: ["FUEGO"],
    attribute: "FUEGO",
    subtypes: ["DRAGON"],
    abilities: [
      {
        name: "Instinto de Camada",
        description: "Mientras controles otra criatura DRAGON, gana +1 ATQ",
        trigger: "CONTINUO",
        effect: "BUFF_IF_SUBTYPE_PRESENT"
      }
    ],
    flavorText: "La primera escama siempre recuerda el calor de su nido."
  },
  {
    name: "Cazador de Chispas",
    description: "Un cazador que convierte una apertura pequeña en daño directo.",
    cost: 3,
    attack: 3,
    defense: 2,
    cardType: "CRIATURA",
    rarity: "COMUN",
    manaTypes: ["FUEGO"],
    attribute: "FUEGO",
    subtypes: ["HUMANO"],
    abilities: [
      {
        name: "Golpe de Ascua",
        description: "Al atacar: Inflige 1 de daño al adversario",
        trigger: "ON_ATTACK",
        effect: "DAMAGE_1_PLAYER"
      }
    ],
    flavorText: "No necesita una gran llama; solo saber dónde prenderla."
  },
  {
    name: "Guerrero de la Aurora Roja",
    description: "Un guerrero de fuego equilibrado para las primeras batallas.",
    cost: 3,
    attack: 3,
    defense: 3,
    cardType: "CRIATURA",
    rarity: "COMUN",
    manaTypes: ["FUEGO"],
    attribute: "FUEGO",
    subtypes: ["HUMANO"],
    abilities: [],
    flavorText: "La aurora anuncia que la batalla apenas comienza."
  },
  {
    name: "Forja de la Brasa",
    description: "Un campo de entrenamiento que fortalece a las criaturas de fuego.",
    cost: 3,
    cardType: "ALTERADOR",
    rarity: "COMUN",
    manaTypes: ["FUEGO"],
    attribute: "FUEGO",
    subtypes: [],
    abilities: [
      {
        name: "Calor de la Forja",
        description: "Tus criaturas de fuego ganan +1 ATQ",
        trigger: "CONTINUO",
        effect: "BUFF_FIRE_ATK"
      }
    ],
    flavorText: "Una forja constante convierte tropas comunes en una legión."
  },
  {
    name: "Autómata de Cobre",
    description: "Una máquina ligera diseñada para ocupar el campo rápidamente.",
    cost: 2,
    attack: 2,
    defense: 2,
    cardType: "CRIATURA",
    rarity: "COMUN",
    manaTypes: ["METAL"],
    attribute: "METAL",
    subtypes: ["MECHA"],
    abilities: [],
    flavorText: "El cobre no es el metal más fuerte, pero sí el primero en llegar."
  },
  {
    name: "Guardia de Titanio",
    description: "Un guardia pesado que protege las piezas importantes de la formación.",
    cost: 3,
    attack: 2,
    defense: 4,
    cardType: "CRIATURA",
    rarity: "COMUN",
    manaTypes: ["METAL"],
    attribute: "METAL",
    subtypes: ["MECHA"],
    abilities: [
      {
        name: "Blindaje Compartido",
        description: "Esta criatura puede bloquear a una criatura adicional",
        trigger: "CONTINUO",
        effect: "BLOCK_ADDITIONAL"
      }
    ],
    flavorText: "El titanio no gana la guerra solo; gana tiempo para ganarla."
  },
  {
    name: "Piloto de la Fisura",
    description: "Un piloto de rayo que conecta máquinas de distintas épocas.",
    cost: 3,
    attack: 3,
    defense: 2,
    cardType: "CRIATURA",
    rarity: "COMUN",
    manaTypes: ["RAYO"],
    attribute: "RAYO",
    subtypes: ["HUMANO", "MECHA"],
    abilities: [
      {
        name: "Lectura de Sistemas",
        description: "Al entrar: Roba 1 carta",
        trigger: "ON_ENTER",
        effect: "DRAW_1"
      }
    ],
    flavorText: "El piloto no controla la máquina; interpreta su voluntad."
  },
  {
    name: "Batería de la Fisura",
    description: "Una batería de rayo que mantiene activa la red mecánica.",
    cost: 2,
    cardType: "ALTERADOR",
    rarity: "COMUN",
    manaTypes: ["RAYO"],
    attribute: "RAYO",
    subtypes: [],
    abilities: [
      {
        name: "Carga Compartida",
        description: "Tus criaturas MECHA ganan +0/+1",
        trigger: "CONTINUO",
        effect: "BUFF_SUBTYPE_DEFENSE"
      }
    ],
    flavorText: "Una chispa bien guardada puede alimentar una ciudad entera."
  },
  {
    name: "Recolector de Raíces",
    description: "Un explorador que encuentra recursos donde otros solo ven tierra.",
    cost: 1,
    attack: 1,
    defense: 2,
    cardType: "CRIATURA",
    rarity: "COMUN",
    manaTypes: ["NATURALEZA"],
    attribute: "NATURALEZA",
    subtypes: ["HUMANO"],
    abilities: [],
    flavorText: "La paciencia también es una forma de abundancia."
  },
  {
    name: "Vigía del Bosque Partido",
    description: "Un vigilante que hace más firmes a los defensores cercanos.",
    cost: 3,
    attack: 3,
    defense: 3,
    cardType: "CRIATURA",
    rarity: "COMUN",
    manaTypes: ["NATURALEZA"],
    attribute: "NATURALEZA",
    subtypes: ["HUMANO"],
    abilities: [
      {
        name: "Vigilia Compartida",
        description: "Mientras controles otra criatura HUMANO, gana +0/+1",
        trigger: "CONTINUO",
        effect: "BUFF_IF_SUBTYPE_PRESENT"
      }
    ],
    flavorText: "Dos ojos vigilan el camino; cuatro ojos vigilan la era."
  },
  {
    name: "Muro de Arcilla",
    description: "Una defensa de tierra que protege a los humanos del frente.",
    cost: 2,
    cardType: "ALTERADOR",
    rarity: "COMUN",
    manaTypes: ["TIERRA"],
    attribute: "TIERRA",
    subtypes: [],
    abilities: [
      {
        name: "Defensa de Arcilla",
        description: "Tus criaturas HUMANAS tienen +0/+1",
        trigger: "CONTINUO",
        effect: "BUFF_SUBTYPE_DEFENSE"
      }
    ],
    flavorText: "La muralla más humilde puede detener al ejército más orgulloso."
  },
  {
    name: "Sombra de la Fisura",
    description: "Una presencia ligera que se esconde entre los pliegues del vacío.",
    cost: 1,
    attack: 1,
    defense: 1,
    cardType: "CRIATURA",
    rarity: "COMUN",
    manaTypes: ["VACIO"],
    attribute: "VACIO",
    subtypes: ["VEILBORN"],
    abilities: [
      {
        name: "Último Susurro",
        description: "Al morir: Roba 1 carta",
        trigger: "ON_DEATH",
        effect: "DRAW_1"
      }
    ],
    flavorText: "La sombra desaparece, pero su mensaje permanece."
  },
  {
    name: "Depredador del Umbral",
    description: "Un cazador del vacío que obliga al enemigo a respetar su espacio.",
    cost: 3,
    attack: 3,
    defense: 2,
    cardType: "CRIATURA",
    rarity: "COMUN",
    manaTypes: ["VACIO"],
    attribute: "VACIO",
    subtypes: ["DINOSAURIO", "VEILBORN"],
    abilities: [
      {
        name: "Acecho del Umbral",
        description: "Las criaturas enemigas con menos ATQ no pueden bloquear",
        trigger: "CONTINUO",
        effect: "INTIMIDATE"
      }
    ],
    flavorText: "No pertenece a ninguna era, por eso ninguna era sabe detenerlo."
  },
  {
    name: "Relámpago de la Fisura",
    description: "Una descarga de rayo que atraviesa una criatura debilitada.",
    cost: 2,
    cardType: "HECHIZO",
    rarity: "COMUN",
    manaTypes: ["RAYO"],
    attribute: "RAYO",
    subtypes: [],
    abilities: [
      {
        name: "Descarga Fracturada",
        description: "Inflige 2 de daño a una criatura o jugador",
        trigger: "INSTANT",
        effect: "DAMAGE_2_TARGET"
      }
    ],
    flavorText: "La fisura no lanza rayos; abre el camino para que lleguen."
  },
  {
    name: "Cartógrafo del Abismo",
    description: "Un explorador que dibuja rutas donde el espacio deja de ser estable.",
    cost: 2,
    attack: 1,
    defense: 3,
    cardType: "CRIATURA",
    rarity: "COMUN",
    manaTypes: ["VACIO"],
    attribute: "VACIO",
    subtypes: ["VEILBORN"],
    abilities: [
      {
        name: "Mapa Imposible",
        description: "Al entrar: Roba 1 carta",
        trigger: "ON_ENTER",
        effect: "DRAW_1"
      }
    ],
    flavorText: "Un mapa del vacío solo necesita señalar dónde no mirar."
  },

  // ==================== CARTAS DEL VOLCÁN DORMIDO ====================
  // COMUNES
  {
    name: "Huevo de Dragón Volcánico",
    description: "Un huevo de dragón que alberga el poder del fuego primordial.",
    cost: 2,
    attack: 2,
    defense: 1,
    cardType: "CRIATURA",
    rarity: "COMUN",
    manaTypes: ["FUEGO"],
    attribute: "FUEGO",
    subtypes: ["DRAGON"],
    abilities: [
      {
        name: "Eclosión en Cadena",
        description: "Al invocar: Invoca gratis otro Huevo de Dragón Volcánico de tu deck",
        trigger: "ON_ENTER",
        effect: "SUMMON_SAME_CARD_FROM_DECK"
      },
      {
        name: "Herencia Ígnea",
        description: "Al morir: Roba 1 Dragón Volcánico de tu deck",
        trigger: "ON_DEATH",
        effect: "DRAW_SPECIFIC_CARD_FROM_DECK"
      }
    ],
    flavorText: "El calor del volcán acelera su nacimiento."
  },
  {
    name: "Dragón Volcánico",
    description: "Un dragón nacido de las cenizas del volcán dormido.",
    cost: 4,
    attack: 4,
    defense: 3,
    cardType: "CRIATURA",
    rarity: "COMUN",
    manaTypes: ["FUEGO"],
    attribute: "FUEGO",
    subtypes: ["DRAGON"],
    abilities: [
      {
        name: "Aliento Ardiente",
        description: "Al invocar: Inflige 2 de daño a todos los monstruos que no sean de fuego",
        trigger: "ON_ENTER",
        effect: "DAMAGE_2_NON_FIRE"
      },
      {
        name: "Ascensión Ancestral",
        description: "Al morir: Roba 1 Dragón Volcánico Ancestral de tu deck",
        trigger: "ON_DEATH",
        effect: "DRAW_SPECIFIC_CARD_FROM_DECK"
      }
    ],
    flavorText: "Las alas de ceniza oscurecen el cielo."
  },
  {
    name: "Fanático de la Llama Solar",
    description: "Un creyente que ofrece su cuerpo a las llamas sagradas.",
    cost: 2,
    attack: 2,
    defense: 1,
    cardType: "CRIATURA",
    rarity: "COMUN",
    manaTypes: ["FUEGO"],
    attribute: "FUEGO",
    subtypes: ["HUMANO"],
    abilities: [
      {
        name: "Fervor Ardiente",
        description: "Al invocar: Inflige 1 de daño al adversario",
        trigger: "ON_ENTER",
        effect: "DAMAGE_1_PLAYER"
      },
      {
        name: "Sacrificio Honroso",
        description: "Si es sacrificado: Inflige 2 de daño al adversario",
        trigger: "ON_SACRIFICE",
        effect: "DAMAGE_2_PLAYER"
      }
    ],
    flavorText: "Su fe arde más fuerte que cualquier fuego."
  },

  // INFRECUENTES
  {
    name: "Berserker de la Fisura Ardiente",
    description: "Un guerrero enloquecido por el calor del volcán.",
    cost: 3,
    attack: 4,
    defense: 2,
    cardType: "CRIATURA",
    rarity: "INFRECUENTE",
    manaTypes: ["FUEGO"],
    attribute: "FUEGO",
    subtypes: ["HUMANO"],
    abilities: [
      {
        name: "Furia Incontrolable",
        description: "Debe atacar cada turno si puede",
        trigger: "CONTINUO",
        effect: "MUST_ATTACK"
      },
      {
        name: "Sed de Sangre",
        description: "Si destruye un monstruo en batalla: Gana +1 ATK permanente",
        trigger: "ON_DESTROY_ENEMY",
        effect: "PERMANENT_ATK_BUFF"
      }
    ],
    flavorText: "El volcán no solo quema la piel, también la razón."
  },
  {
    name: "Portador del Estandarte Carmesí",
    description: "El portador de las flamas eternas del volcán.",
    cost: 3,
    attack: 3,
    defense: 3,
    cardType: "CRIATURA",
    rarity: "INFRECUENTE",
    manaTypes: ["FUEGO"],
    attribute: "FUEGO",
    subtypes: ["TITAN"],
    abilities: [
      {
        name: "Aura de Fuego",
        description: "Otros monstruos de fuego que controles ganan +1 ATK",
        trigger: "CONTINUO",
        effect: "BUFF_FIRE_ATK"
      },
      {
        name: "Formación Ígnea",
        description: "Si controlas 3+ monstruos de fuego: Gana +2 DEF",
        trigger: "CONTINUO",
        effect: "DEF_BUFF_IF_3_FIRE"
      }
    ],
    flavorText: "Donde flamea el estandarte, el fuego sigue."
  },

  // RARAS
  {
    name: "Dragón Volcánico Ancestral",
    description: "Un dragón antiguo que ha despertado de su sueño milenario.",
    cost: 5,
    attack: 2,
    defense: 5,
    cardType: "CRIATURA",
    rarity: "RARA",
    manaTypes: ["FUEGO"],
    attribute: "FUEGO",
    subtypes: ["DRAGON"],
    abilities: [
      {
        name: "Aliento Ancestral",
        description: "Al invocar: Inflige 2 de daño a todos los monstruos que no sean de fuego",
        trigger: "ON_ENTER",
        effect: "DAMAGE_2_NON_FIRE"
      },
      {
        name: "Llamada Guerrera",
        description: "Al morir: Roba 1 Dragón de Guerra Volcánico de tu deck",
        trigger: "ON_DEATH",
        effect: "DRAW_SPECIFIC_CARD_FROM_DECK"
      }
    ],
    flavorText: "Los ancestros despiertan cuando el volcán ruge."
  },
  {
    name: "Guardián de la Caldera Eterna",
    description: "El protector de las profundidades del volcán.",
    cost: 4,
    attack: 3,
    defense: 5,
    cardType: "CRIATURA",
    rarity: "RARA",
    manaTypes: ["FUEGO"],
    attribute: "FUEGO",
    subtypes: ["HUMANO"],
    abilities: [
      {
        name: "Escudo de Lava",
        description: "Mientras controles otro monstruo de fuego: Gana +2 DEF",
        trigger: "CONTINUO",
        effect: "DEF_BUFF_IF_OTHER_FIRE"
      },
      {
        name: "Venganza Ígnea",
        description: "Cuando un monstruo de fuego es destruido: Inflige 1 de daño al adversario",
        trigger: "ON_FIRE_DESTROYED",
        effect: "DAMAGE_1_PLAYER"
      }
    ],
    flavorText: "La caldera nunca se apaga bajo su vigilancia."
  },
  {
    name: "Tormenta de Cenizas",
    description: "Una nube de ceniza que ciega y quema.",
    cost: 4,
    cardType: "HECHIZO",
    rarity: "RARA",
    manaTypes: ["FUEGO"],
    attribute: "FUEGO",
    subtypes: [],
    abilities: [
      {
        name: "Ceniza Asfixiante",
        description: "Todos los monstruos pierden 2 ATK hasta el final del turno. Los que lleguen a 0 ATK son destruidos",
        trigger: "INSTANT",
        effect: "REDUCE_ATK_DESTROY_ZERO"
      }
    ],
    flavorText: "La ceniza no perdona, solo cubre."
  },
  {
    name: "Sacerdote del Núcleo Ardiente",
    description: "Un servo del fuego que canaliza el poder del volcán.",
    cost: 4,
    attack: 2,
    defense: 4,
    cardType: "CRIATURA",
    rarity: "RARA",
    manaTypes: ["FUEGO"],
    attribute: "FUEGO",
    subtypes: ["HUMANO"],
    abilities: [
      {
        name: "Rito de Sangre",
        description: "Una vez por turno: Puedes sacrificar un monstruo; roba 1 carta",
        trigger: "ACTIVATED",
        effect: "SACRIFICE_DRAW"
      },
      {
        name: "Ofrenda Ardiente",
        description: "Si el monstruo sacrificado era de fuego: Inflige 2 de daño al adversario",
        trigger: "ON_SACRIFICE_FIRE",
        effect: "DAMAGE_2_PLAYER"
      }
    ],
    flavorText: "El núcleo exige tributo, y él lo provee."
  },
  {
    name: "Ofrenda al Sol Carmesí",
    description: "Un ritual para honrar al sol volcánico.",
    cost: 3,
    cardType: "HECHIZO",
    rarity: "RARA",
    manaTypes: ["FUEGO"],
    attribute: "FUEGO",
    subtypes: [],
    abilities: [
      {
        name: "Sacrificio Solar",
        description: "Sacrifica un monstruo de fuego; roba 1 carta e inflige 2 de daño al adversario",
        trigger: "INSTANT",
        effect: "SACRIFICE_FIRE_DRAW_DAMAGE"
      }
    ],
    flavorText: "El sol carmesí acepta solo las ofrendas más ardientes."
  },
  {
    name: "Ritual de la Erupción Imperial",
    description: "El ritual prohibido de los señores del fuego.",
    cost: 3,
    cardType: "HECHIZO",
    rarity: "RARA",
    manaTypes: ["FUEGO"],
    attribute: "FUEGO",
    subtypes: [],
    abilities: [
      {
        name: "Erupción de Poder",
        description: "Sacrifica un monstruo de fuego; roba 2 cartas. Si era un Dragón: Inflige 2 de daño al adversario",
        trigger: "INSTANT",
        effect: "SACRIFICE_FIRE_DRAW_DRAGON_BONUS"
      }
    ],
    flavorText: "La erupción trae destrucción y renovación."
  },

  // ÉPICAS
  {
    name: "Dragón de Guerra Volcánico",
    description: "El señor de la guerra del volcán, forjado en lava milenaria.",
    cost: 7,
    attack: 6,
    defense: 6,
    cardType: "CRIATURA",
    rarity: "EPICA",
    manaTypes: ["FUEGO"],
    attribute: "FUEGO",
    subtypes: ["DRAGON"],
    abilities: [
      {
        name: "Devastación Cruzada",
        description: "Una vez por turno: Destruye un monstruo en tu campo y otro en el campo del adversario",
        trigger: "ACTIVATED",
        effect: "DESTROY_BOTH_FIELDS"
      },
      {
        name: "Ascensión Final",
        description: "Al morir: Roba 1 Emperador Volcánico Ignathor o Dominus Volcánico Astravor de tu deck (a tu elección)",
        trigger: "ON_DEATH",
        effect: "DRAW_CHOICE_LEGENDARY"
      }
    ],
    flavorText: "La guerra es su naturaleza, la destrucción su legado."
  },
  {
    name: "General Volcánico Kharzeth",
    description: "El estratega supremo de los ejércitos ígneos.",
    cost: 6,
    attack: 5,
    defense: 5,
    cardType: "CRIATURA",
    rarity: "EPICA",
    manaTypes: ["FUEGO"],
    attribute: "FUEGO",
    subtypes: ["DRAGON"],
    abilities: [
      {
        name: "Golpe Preciso",
        description: "Al invocar: Destruye un monstruo con 4 o menos de defensa",
        trigger: "ON_ENTER",
        effect: "DESTROY_LOW_DEFENSE"
      },
      {
        name: "Asalto Dragón",
        description: "Mientras controles otro Dragón además de esta carta: Esta carta puede atacar dos veces por turno",
        trigger: "CONTINUO",
        effect: "DOUBLE_ATTACK_IF_DRAGON"
      }
    ],
    flavorText: "Kharzeth no lidera desde atrás, arde desde el frente."
  },
  {
    name: "Forjador del Núcleo Ígneo",
    description: "El maestro forjador que da forma al fuego mismo.",
    cost: 6,
    attack: 4,
    defense: 6,
    cardType: "CRIATURA",
    rarity: "EPICA",
    manaTypes: ["FUEGO"],
    attribute: "FUEGO",
    subtypes: ["HUMANO"],
    abilities: [
      {
        name: "Forja de Fuego",
        description: "Una vez por turno: Sacrifica un monstruo de fuego; agrega 1 carta de fuego de hasta 6 de mana de tu deck a tu mano",
        trigger: "ACTIVATED",
        effect: "SACRIFICE_SEARCH_FIRE"
      },
      {
        name: "Poder del Dragón",
        description: "Si sacrificaste un Dragón: Gana +2 ATK este turno",
        trigger: "ON_SACRIFICE_DRAGON",
        effect: "TEMP_ATK_BUFF"
      }
    ],
    flavorText: "En sus manos, el fuego se vuelve acero."
  },
  {
    name: "Ascensión Volcánica",
    description: "El ritual para traer de vuelta a los dragones caídos.",
    cost: 5,
    cardType: "HECHIZO",
    rarity: "EPICA",
    manaTypes: ["FUEGO"],
    attribute: "FUEGO",
    subtypes: [],
    abilities: [
      {
        name: "Resurrección Ígnea",
        description: "Invoca desde tu cementerio un Dragón Volcánico o Dragón Volcánico Ancestral",
        trigger: "INSTANT",
        effect: "SUMMON_FROM_GRAVEYARD"
      },
      {
        name: "Poder del Volcán",
        description: "Si controlas 3+ monstruos de fuego: Esa criatura gana +3 ATK este turno",
        trigger: "INSTANT",
        effect: "BUFF_IF_3_FIRE"
      }
    ],
    flavorText: "El volcán devuelve lo que le pertenece."
  },
  {
    name: "Avatar del Sol Devastador",
    description: "La encarnación del sol en su forma más destructiva.",
    cost: 6,
    attack: 6,
    defense: 5,
    cardType: "CRIATURA",
    rarity: "EPICA",
    manaTypes: ["FUEGO"],
    attribute: "FUEGO",
    subtypes: ["TITAN"],
    abilities: [
      {
        name: "Explosión Solar",
        description: "Al invocar: Inflige 3 de daño a todos los monstruos",
        trigger: "ON_ENTER",
        effect: "DAMAGE_3_ALL"
      },
      {
        name: "Bendición del Sol",
        description: "Los monstruos de fuego que sobrevivan ganan +1 ATK permanente",
        trigger: "ON_ENTER",
        effect: "PERMANENT_ATK_FIRE_SURVIVORS"
      }
    ],
    flavorText: "El sol no distingue amigos de enemigos, solo quema."
  },
  {
    name: "Ritual de Incineración Total",
    description: "El hechizo prohibido que consume todo a su paso.",
    cost: 5,
    cardType: "HECHIZO",
    rarity: "EPICA",
    manaTypes: ["FUEGO"],
    attribute: "FUEGO",
    subtypes: [],
    abilities: [
      {
        name: "Incineración",
        description: "Todos los jugadores sacrifican 1 monstruo. Luego inflige 2 de daño por cada monstruo sacrificado",
        trigger: "INSTANT",
        effect: "BOTH_SACRIFICE_DAMAGE"
      }
    ],
    flavorText: "En las cenizas, todos son iguales."
  },

  // LEGENDARIAS
  {
    name: "Emperador Volcánico Ignathor",
    description: "El emperador supremo de los dragones volcánicos.",
    cost: 10,
    attack: 9,
    defense: 10,
    cardType: "CRIATURA",
    rarity: "LEGENDARIA",
    manaTypes: ["FUEGO", "LEGENDARIO"],
    attribute: "FUEGO",
    subtypes: ["DRAGON"],
    abilities: [
      {
        name: "Sacrificio Imperial",
        description: "Condición: Solo puede invocarse sacrificando un Dragón de Guerra Volcánico que controles",
        trigger: "SUMMON_CONDITION",
        effect: "REQUIRES_SACRIFICE"
      },
      {
        name: "Erupción Devastadora",
        description: "Al invocar: Destruye todos los monstruos. Gana +1 ATK por cada uno destruido",
        trigger: "ON_ENTER",
        effect: "DESTROY_ALL_BUFF_SELF"
      },
      {
        name: "Colapso Final",
        description: "Al morir: Destruye todos los monstruos",
        trigger: "ON_DEATH",
        effect: "DESTROY_ALL_MONSTERS"
      }
    ],
    flavorText: "Cuando Ignathor despierta, el mundo tiembla."
  },
  {
    name: "Sumo Hierofante Pyrothar",
    description: "El sumo sacerdote del fuego eterno.",
    cost: 10,
    attack: 7,
    defense: 9,
    cardType: "CRIATURA",
    rarity: "LEGENDARIA",
    manaTypes: ["FUEGO", "LEGENDARIO"],
    attribute: "FUEGO",
    subtypes: ["TITAN", "HUMANO"],
    abilities: [
      {
        name: "Rito Mayor",
        description: "Condición: Solo puede invocarse sacrificando 2 monstruos de fuego",
        trigger: "SUMMON_CONDITION",
        effect: "REQUIRES_2_FIRE_SACRIFICE"
      },
      {
        name: "Canalización del Sacrificio",
        description: "Mientras esté en el campo: Cada vez que sacrificas un monstruo, inflige daño al adversario igual a su ATK",
        trigger: "CONTINUO",
        effect: "DAMAGE_ON_SACRIFICE"
      },
      {
        name: "Resurrección Menor",
        description: "Una vez por turno: Invoca un monstruo de fuego de coste 3 o menor desde tu cementerio",
        trigger: "ACTIVATED",
        effect: "SUMMON_LOW_COST_FROM_GRAVEYARD"
      }
    ],
    flavorText: "Pyrothar habla con el fuego, y el fuego obedece."
  },
  {
    name: "Juramento del Trono Ígneo",
    description: "El juramento sagrado que convoca a los señores del volcán.",
    cost: 5,
    cardType: "HECHIZO",
    rarity: "LEGENDARIA",
    manaTypes: ["FUEGO", "LEGENDARIO"],
    attribute: "FUEGO",
    subtypes: [],
    abilities: [
      {
        name: "Búsqueda Imperial",
        description: "Si controlas un Dragón de Guerra Volcánico: Busca en tu deck un Emperador Volcánico Ignathor o Dominus Volcánico Astravor y añádelo a tu mano",
        trigger: "INSTANT",
        effect: "SEARCH_LEGENDARY_IF_WAR_DRAGON"
      },
      {
        name: "Límite del Juramento",
        description: "Solo puedes activar 1 Juramento del Trono Ígneo por turno",
        trigger: "CONTINUO",
        effect: "HARD_ONCE_PER_TURN"
      }
    ],
    flavorText: "El juramento no se rompe, ni siquiera con la muerte."
  },

  // CELESTIAL
  {
    name: "Dominus Volcánico Astravor",
    description: "El dios del volcán, señor absoluto del fuego primordial.",
    cost: 10,
    attack: 10,
    defense: 9,
    cardType: "CRIATURA",
    rarity: "CELESTIAL",
    manaTypes: ["FUEGO", "CELESTIAL"],
    attribute: "FUEGO",
    subtypes: ["DRAGON"],
    abilities: [
      {
        name: "Encarnación Divina",
        description: "Condición: Solo puede invocarse sacrificando un Dragón de Guerra Volcánico que controles",
        trigger: "SUMMON_CONDITION",
        effect: "REQUIRES_SACRIFICE"
      },
      {
        name: "Fuego Absoluto",
        description: "Mientras esté en el campo: Tu adversario solo puede seleccionar esta carta para ataques y efectos",
        trigger: "CONTINUO",
        effect: "PROTECT_OTHERS"
      },
      {
        name: "Negación Divina",
        description: "Una vez por turno: Niega el efecto de un monstruo o hechizo y destrúyelo",
        trigger: "ACTIVATED",
        effect: "NEGATE_AND_DESTROY"
      },
      {
        name: "Último Deseo",
        description: "Al morir: Roba 1 monstruo de fuego de hasta 2 de mana de tu deck",
        trigger: "ON_DEATH",
        effect: "DRAW_LOW_COST_FIRE"
      }
    ],
    flavorText: "Astravor no reza a los dioses. Él ES el dios al que otros rezan."
  },
  {
    name: "Volcán del fin",
    description: "Un volcán que transforma sacrificios en maná y deja una última promesa entre sus cenizas.",
    cost: 2,
    cardType: "ALTERADOR",
    rarity: "EPICA",
    manaTypes: ["FUEGO", "FUEGO"],
    attribute: "FUEGO",
    subtypes: [],
    imageUrl: "/assets/cards/volcan-del-fin.webp",
    abilities: [
      {
        name: "Ofrenda al cráter",
        description: "Una vez por turno: Puedes sacrificar una criatura que controles; añade 1 Mana de Fuego de tu mazo a tu mano.",
        trigger: "ACTIVATED",
        effect: "SACRIFICE_SEARCH_FIRE_MANA"
      },
      {
        name: "El último despertar",
        description: "Si esta carta es destruida: Destruye todas las criaturas y cartas de campo que controles. Después, busca 1 criatura DRAGON de tu mazo, a tu elección, y añádela a tu mano. Conservas tus fuentes de maná.",
        trigger: "ON_DEATH",
        effect: "DESTROY_OWN_FIELD_SEARCH_DRAGON"
      },
      {
        name: "Un solo fin",
        description: "Solo puedes controlar 1 Volcán del fin activo.",
        trigger: "CONTINUO",
        effect: "UNIQUE_ACTIVE_FIELD"
      }
    ],
    flavorText: "Cuando despierte, el fuego reclamará todo salvo su último heredero."
  },
  {
    name: "Caracol Volcánico",
    description: "Una pequeña alimaña protegida por una gruesa espiral de obsidiana ardiente.",
    cost: 1,
    attack: 1,
    defense: 4,
    cardType: "CRIATURA",
    rarity: "RARA",
    manaTypes: ["FUEGO"],
    attribute: "FUEGO",
    subtypes: ["ALIMANA"],
    imageUrl: "/assets/cards/caracol-volcanico.webp",
    abilities: [
      {
        name: "Último rastro de ceniza",
        description: "Al morir: Puedes elegir 1 criatura de coste 2 de maná o menos de tu mazo y destruirla, enviándola al cementerio.",
        trigger: "ON_DEATH",
        effect: "DESTROY_LOW_COST_CREATURE_FROM_DECK"
      }
    ],
    flavorText: "Hasta su último rastro deja algo bajo las cenizas."
  }
] satisfies Omit<CardDefinition, "id">[];

export const VOLCANIC_DRAGON_SUCCESSORS: Record<string, string> = {
  "Huevo de Dragón Volcánico": "Dragón Volcánico",
  "Dragón Volcánico": "Dragón Volcánico Ancestral",
  "Dragón Volcánico Ancestral": "Dragón de Guerra Volcánico",
};
