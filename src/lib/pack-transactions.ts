import type { Prisma } from "@prisma/client";
import { drawPack, isVolcanPack, PackError, packPurchaseCost, VOLCAN_SPECIAL_MANA } from "./packs";

export async function purchasePacks(tx: Prisma.TransactionClient, userId: string, purchase: { packTypeId: string; currency: "gold" | "gems"; quantity: number }) {
  const player = await tx.player.findUnique({ where: { userId }, select: { id: true } });
  if (!player) throw new PackError("Jugador no encontrado.", 404);
  const pack = await tx.packType.findUnique({ where: { id: purchase.packTypeId } });
  if (!pack?.isActive) throw new PackError("Sobre no disponible.", 404);
  const totalCost = packPurchaseCost(purchase.currency === "gold" ? pack.priceGold : pack.priceGems, purchase.quantity);
  // The conditional debit locks the player row and prevents simultaneous overspending.
  const debit = await tx.player.updateMany({ where: { id: player.id, [purchase.currency]: { gte: totalCost } },
    data: { [purchase.currency]: { decrement: totalCost } } });
  if (debit.count !== 1) throw new PackError(purchase.currency === "gold" ? "No tienes suficiente oro para esta compra." : "No tienes suficientes gemas para esta compra.");
  const existing = await tx.playerPack.findFirst({ where: { playerId: player.id, packTypeId: pack.id }, orderBy: { id: "asc" } });
  if (existing) await tx.playerPack.update({ where: { id: existing.id }, data: { quantity: { increment: purchase.quantity } } });
  else await tx.playerPack.create({ data: { playerId: player.id, packTypeId: pack.id, quantity: purchase.quantity } });
  const balance = await tx.player.findUniqueOrThrow({ where: { id: player.id }, select: { gold: true, gems: true } });
  return { packType: pack.name, quantity: purchase.quantity, totalCost, ...balance };
}

export async function openPlayerPack(tx: Prisma.TransactionClient, userId: string, packId: string, random = Math.random) {
  const player = await tx.player.findUnique({ where: { userId }, select: { id: true } });
  if (!player) throw new PackError("Jugador no encontrado.", 404);
  const owned = await tx.playerPack.findFirst({ where: { id: packId, playerId: player.id }, include: { packType: true } });
  if (!owned) throw new PackError("Sobre no encontrado.", 404);
  // Keep zero-quantity rows: simultaneous opens and purchases use the same counter.
  const consumed = await tx.playerPack.updateMany({ where: { id: packId, playerId: player.id, quantity: { gte: 1 } }, data: { quantity: { decrement: 1 } } });
  if (consumed.count !== 1) throw new PackError("No tienes sobres disponibles.");
  const pack = owned.packType;
  const candidates = await tx.card.findMany({ where: isVolcanPack(pack) ? {
    OR: [{ expansionKey: "VOLCAN_DORMIDO" }, { name: { in: [...VOLCAN_SPECIAL_MANA] } }],
  } : pack.expansionKey ? { expansionKey: pack.expansionKey } : {}, orderBy: { id: "asc" } });
  const cards = drawPack(pack, candidates, random);
  const copies = new Map<string, number>();
  cards.forEach(card => copies.set(card.id, (copies.get(card.id) ?? 0) + 1));
  // Consistent order also avoids locking collection rows in opposite orders.
  for (const [cardId, quantity] of [...copies].sort(([a], [b]) => a.localeCompare(b))) {
    await tx.playerCard.upsert({ where: { playerId_cardId: { playerId: player.id, cardId } },
      update: { quantity: { increment: quantity } }, create: { playerId: player.id, cardId, quantity } });
  }
  const remaining = await tx.playerPack.findUniqueOrThrow({ where: { id: packId }, select: { quantity: true } });
  return { cards, remainingPacks: remaining.quantity };
}
