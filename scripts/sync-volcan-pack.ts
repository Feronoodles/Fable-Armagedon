import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { cardCatalog } from "../src/game-engine/catalog";
import { getCardExpansionKey } from "../src/game-engine/expansions";
import { featuredPackDrops, isCardInPack, VOLCAN_PACK_ART, VOLCAN_PACK_DESCRIPTION, VOLCAN_PACK_ODDS } from "../src/lib/packs";

loadEnvConfig(process.cwd(), true);
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.$transaction(async tx => {
    // Only this pack's content, art and odds change. Player balances and inventory stay intact.
    for (const name of ["Dominus Volcánico Astravor", "Santuario de Fuego", "Trono de Fuego"]) {
      const definition = cardCatalog.find(card => card.name === name);
      if (!definition) throw new Error("Carta ausente del catálogo: " + name);
      const existing = await tx.card.findMany({ where: { name }, select: { id: true } });
      if (existing.length > 1) throw new Error("Hay cartas duplicadas: " + name);
      if (!existing.length) await tx.card.create({ data: { ...definition, expansionKey: getCardExpansionKey(name) } });
    }
    const existing = await tx.packType.findMany({ where: { name: "Volcán Dormido" }, select: { id: true } });
    if (existing.length > 1) throw new Error("Hay varios sobres Volcán Dormido; revisa los duplicados.");
    const data = { description: VOLCAN_PACK_DESCRIPTION, expansionKey: "VOLCAN_DORMIDO", imageUrl: VOLCAN_PACK_ART, ...VOLCAN_PACK_ODDS };
    const pack = existing.length ? await tx.packType.update({ where: { id: existing[0].id }, data }) : await tx.packType.create({
      data: { ...data, name: "Volcán Dormido", priceGold: 200, priceGems: 50, cardsPerPack: 10, guaranteeRare: true },
    });
    const cards = await tx.card.findMany({ select: { id: true, name: true, rarity: true, attribute: true, cardType: true, expansionKey: true } });
    const drops = featuredPackDrops(pack, cards);
    if (drops.length !== 3 || drops.some(drop => drop.chance <= 0)) throw new Error("No se pudo habilitar el contenido destacado del sobre.");
    return { name: pack.name, imageUrl: pack.imageUrl, odds: VOLCAN_PACK_ODDS, eligibleCards: cards.filter(card => isCardInPack(card, pack)).length, featuredDrops: drops };
  });
  console.log(JSON.stringify(result, null, 2));
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Error al actualizar el sobre."); process.exitCode = 1; }).finally(() => prisma.$disconnect());
