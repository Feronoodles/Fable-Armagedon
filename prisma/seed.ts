import { cardCatalog } from "../src/game-engine/catalog";
import { getCardExpansionKey } from "../src/game-engine/expansions";
import { CREATURE_SUBTYPE_KEYS } from "../src/game-engine/subtypes";
import { PrismaClient } from "@prisma/client";
import { VOLCAN_PACK_ART, VOLCAN_PACK_DESCRIPTION, VOLCAN_PACK_ODDS } from "../src/lib/packs";

const prisma = new PrismaClient();

// Los subtipos de criaturas se comparten con el motor y la interfaz.

const cards = cardCatalog;

const packTypes = [
  {
    name: "Sobre de Bienvenida",
    description: "Un sobre especial para nuevos duelistas. Contiene todo lo necesario para comenzar tu aventura.",
    expansionKey: "CORE",
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
    expansionKey: "CORE",
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
    expansionKey: "CORE",
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
  },
  {
    name: "Volcán Dormido",
    description: VOLCAN_PACK_DESCRIPTION,
    expansionKey: "VOLCAN_DORMIDO",
    imageUrl: VOLCAN_PACK_ART,
    priceGold: 200,
    priceGems: 50,
    cardsPerPack: 10,
    ...VOLCAN_PACK_ODDS,
    guaranteeRare: true,
    isActive: true
  }
];

async function main() {
  console.log("🌱 Iniciando seed de la base de datos...");

  // Verificar si ya existen cartas
  const existingCards = await prisma.card.count();

  if (existingCards > 0) {
    console.log(`📊 Ya existen ${existingCards} cartas en la base de datos.`);
    console.log("🔄 Actualizando solo cartas nuevas...");

    // Solo agregar cartas que no existan (basado en el nombre)
    const existingCardRecords = await prisma.card.findMany({
      select: { id: true, name: true, expansionKey: true }
    });
    const existingCardMap = new Map(existingCardRecords.map(c => [c.name, c]));

    let newCardsCount = 0;
    let updatedCardExpansions = 0;
    for (const cardData of cards) {
      const existingCard = existingCardMap.get(cardData.name);
      const expansionKey = getCardExpansionKey(cardData.name);

      if (!existingCard) {
        await prisma.card.create({
          data: { ...cardData, expansionKey }
        });
        newCardsCount++;
        console.log(`  ➕ Nueva carta: ${cardData.name}`);
      } else if (existingCard.expansionKey !== expansionKey) {
        await prisma.card.update({
          where: { id: existingCard.id },
          data: { expansionKey }
        });
        updatedCardExpansions++;
      }
    }

    if (newCardsCount > 0) {
      console.log(`✅ ${newCardsCount} cartas nuevas agregadas`);
    } else {
      console.log("✅ No hay cartas nuevas para agregar");
    }
    if (updatedCardExpansions > 0) {
      console.log(`🔄 ${updatedCardExpansions} cartas actualizadas con su expansión`);
    }

    // Verificar, agregar o actualizar tipos de sobres
    const existingPackTypesData = await prisma.packType.findMany({
      select: { id: true, name: true }
    });
    const existingPackMap = new Map(existingPackTypesData.map(p => [p.name, p.id]));

    let newPacksCount = 0;
    let updatedPacksCount = 0;
    for (const packData of packTypes) {
      if (existingPackMap.has(packData.name)) {
        // Actualizar existente
        await prisma.packType.update({
          where: { id: existingPackMap.get(packData.name) },
          data: packData
        });
        updatedPacksCount++;
      } else {
        // Crear nuevo
        await prisma.packType.create({
          data: packData
        });
        newPacksCount++;
        console.log(`  ➕ Nuevo sobre: ${packData.name}`);
      }
    }

    if (newPacksCount > 0) {
      console.log(`✅ ${newPacksCount} tipos de sobres nuevos agregados`);
    }
    if (updatedPacksCount > 0) {
      console.log(`🔄 ${updatedPacksCount} tipos de sobres actualizados`);
    }
    if (newPacksCount === 0 && updatedPacksCount === 0) {
      console.log("✅ No hay cambios en tipos de sobres");
    }

  } else {
    // Primera vez: crear todo desde cero
    console.log("🆕 Base de datos vacía. Creando todas las cartas...");

    // Crear cartas
    console.log("🎴 Creando cartas...");
    for (const cardData of cards) {
      await prisma.card.create({
        data: { ...cardData, expansionKey: getCardExpansionKey(cardData.name) }
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
  }

  console.log("✨ Seed completado exitosamente!");
  console.log("📋 Subtipos disponibles: " + CREATURE_SUBTYPE_KEYS.join(", "));
  console.log("⚠️  NOTA: Los datos de jugadores (cartas, mazos, sobres) NO se borraron.");
}

main()
  .catch((e) => {
    console.error("❌ Error en el seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
