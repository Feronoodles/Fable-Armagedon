import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Los 9 subtipos permitidos para criaturas:
// DINOSAURIO, DRAGON, HUMANO, MECHA, ELFO, ORCO, RENACIDO, VEILBORN, TITAN

const cards = [
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
  }
];

const packTypes = [
  {
    name: "Sobre de Bienvenida",
    description: "Un sobre especial para nuevos duelistas. Contiene todo lo necesario para comenzar tu aventura.",
    priceGold: 0,
    priceGems: 0,
    cardsPerPack: 8,
    commonChance: 62,
    uncommonChance: 25,
    rareChance: 10,
    epicChance: 3,
    legendaryChance: 0,
    celestialChance: 0,
    guaranteeRare: true,
    isActive: true
  },
  {
    name: "Sobre Estándar",
    description: "Un sobre básico con cartas de todas las rarezas.",
    priceGold: 100,
    priceGems: 10,
    cardsPerPack: 5,
    commonChance: 60,
    uncommonChance: 25,
    rareChance: 10,
    epicChance: 4,
    legendaryChance: 1,
    celestialChance: 0,
    guaranteeRare: false,
    isActive: true
  },
  {
    name: "Sobre Élite",
    description: "Un sobre premium con mayor probabilidad de cartas raras.",
    priceGold: 0,
    priceGems: 100,
    cardsPerPack: 5,
    commonChance: 40,
    uncommonChance: 30,
    rareChance: 20,
    epicChance: 8,
    legendaryChance: 2,
    celestialChance: 0,
    guaranteeRare: true,
    isActive: true
  }
];

async function main() {
  console.log("🌱 Iniciando seed de la base de datos...");

  // Limpiar datos existentes (opcional - solo en desarrollo)
  console.log("🧹 Limpiando datos existentes...");
  await prisma.deckCard.deleteMany();
  await prisma.deck.deleteMany();
  await prisma.playerCard.deleteMany();
  await prisma.playerPack.deleteMany();
  await prisma.card.deleteMany();
  await prisma.packType.deleteMany();

  // Crear cartas
  console.log("🎴 Creando cartas...");
  for (const cardData of cards) {
    await prisma.card.create({
      data: cardData
    });
  }
  console.log(`✅ ${cards.length} cartas creadas`);

  // Crear tipos de sobres
  console.log("📦 Creando tipos de sobres...");
  for (const packData of packTypes) {
    await prisma.packType.create({
      data: packData
    });
  }
  console.log(`✅ ${packTypes.length} tipos de sobres creados`);

  console.log("✨ Seed completado exitosamente!");
  console.log("📋 Subtipos disponibles: DINOSAURIO, DRAGON, HUMANO, MECHA, ELFO, ORCO, RENACIDO, VEILBORN, TITAN");
}

main()
  .catch((e) => {
    console.error("❌ Error en el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });