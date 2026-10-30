import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { cardCatalog } from "../src/game-engine/catalog";
import { getCardExpansionKey } from "../src/game-engine/expansions";

loadEnvConfig(process.cwd(), true);
const prisma = new PrismaClient();

async function main() {
  const name = process.argv.slice(2).join(" ");
  if (!name) throw new Error('Indica una carta: npm run sync:card -- "Nombre de la carta"');
  const definition = cardCatalog.find(card => card.name === name);
  if (!definition) throw new Error("La carta no existe en el catálogo.");
  const data = { ...definition, expansionKey: getCardExpansionKey(definition.name) };
  const result = await prisma.$transaction(async tx => {
    const existing = await tx.card.findMany({ where: { name: definition.name }, select: { id: true } });
    if (existing.length > 1) throw new Error("Hay varias cartas con este nombre; revisa los duplicados antes de sincronizar.");
    const card = existing.length ? await tx.card.update({ where: { id: existing[0].id }, data }) : await tx.card.create({ data });
    if (data.expansionKey === "VOLCAN_DORMIDO") await tx.packType.updateMany({ where: { name: "Volcán Dormido" }, data: { expansionKey: data.expansionKey } });
    const packs = await tx.packType.count({ where: { expansionKey: data.expansionKey } });
    if (!packs) throw new Error("No existen sobres para esta expansión. Inicializa primero el catálogo con npm run seed.");
    const rarityPoolSize = await tx.card.count({ where: { expansionKey: data.expansionKey, rarity: card.rarity, cardType: { notIn: ["MANA", "TIERRA"] } } });
    return { name: card.name, rarity: card.rarity, cost: card.cost, attack: card.attack, defense: card.defense, subtypes: card.subtypes, manaTypes: card.manaTypes, abilities: card.abilities, expansionKey: card.expansionKey, packs, rarityPoolSize };
  });
  console.log(JSON.stringify(result, null, 2));
}

main().catch(error => { console.error(error instanceof Error ? error.message : "Error al sincronizar la carta."); process.exitCode = 1; })
  .finally(() => prisma.$disconnect());
