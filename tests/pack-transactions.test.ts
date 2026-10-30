import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { loadEnvConfig } from "@next/env";
import { PrismaClient } from "@prisma/client";
import { purchasePacks, openPlayerPack } from "../src/lib/pack-transactions";
import { PackError, VOLCAN_PACK_ODDS } from "../src/lib/packs";

// Integration checks use their own temporary accounts and remove them in finally.
loadEnvConfig(process.cwd(), true);
const prisma = new PrismaClient();
after(() => prisma.$disconnect());

async function withFixture(run: (fixture: { userId: string; playerId: string; packId: string; ownedId: string }) => Promise<void>, options: { gold?: number; quantity?: number; invalidOdds?: boolean } = {}) {
  const suffix = randomUUID(), userId = "packs-test-" + suffix, packId = "packs-test-type-" + suffix;
  try {
    const fixture = await prisma.$transaction(async tx => {
      await tx.packType.create({ data: { id: packId, name: "Prueba de sobres " + suffix, expansionKey: "VOLCAN_DORMIDO", priceGold: 200, priceGems: 50, cardsPerPack: 10, guaranteeRare: true, ...VOLCAN_PACK_ODDS, ...(options.invalidOdds ? { commonChance: 45 } : {}) } });
      const player = await tx.player.create({ data: { username: userId, gold: options.gold ?? 1000, gems: 500,
        user: { create: { id: userId, email: suffix + "@pack-tests.invalid" } } } });
      const owned = await tx.playerPack.create({ data: { playerId: player.id, packTypeId: packId, quantity: options.quantity ?? 0 } });
      return { userId, playerId: player.id, packId, ownedId: owned.id };
    });
    await run(fixture);
  } finally {
    await prisma.$transaction([
      prisma.user.deleteMany({ where: { id: userId } }),
      prisma.packType.deleteMany({ where: { id: packId } }),
    ]);
  }
}

test("bulk purchases debit the exact gold total and add all packs together", () => withFixture(async ({ userId, playerId, packId, ownedId }) => {
  const result = await prisma.$transaction(tx => purchasePacks(tx, userId, { packTypeId: packId, currency: "gold", quantity: 4 }));
  assert.equal(result.totalCost, 800);
  assert.equal(result.gold, 200);
  assert.equal(result.gems, 500);
  assert.equal((await prisma.playerPack.findUniqueOrThrow({ where: { id: ownedId } })).quantity, 4);
  assert.equal(await prisma.playerPack.count({ where: { playerId, packTypeId: packId } }), 1);
}));
test("gem purchases do not debit gold", () => withFixture(async ({ userId, packId }) => {
  const result = await prisma.$transaction(tx => purchasePacks(tx, userId, { packTypeId: packId, currency: "gems", quantity: 5 }));
  assert.equal(result.totalCost, 250);
  assert.equal(result.gems, 250);
  assert.equal(result.gold, 1000);
}));
test("insufficient balance leaves money and packs untouched", () => withFixture(async ({ userId, playerId, packId, ownedId }) => {
  await assert.rejects(prisma.$transaction(tx => purchasePacks(tx, userId, { packTypeId: packId, currency: "gold", quantity: 6 })), PackError);
  assert.equal((await prisma.player.findUniqueOrThrow({ where: { id: playerId } })).gold, 1000);
  assert.equal((await prisma.playerPack.findUniqueOrThrow({ where: { id: ownedId } })).quantity, 0);
}));
test("simultaneous purchases cannot spend the same balance twice", () => withFixture(async ({ userId, playerId, packId, ownedId }) => {
  const results = await Promise.allSettled(Array.from({ length: 5 }, () => prisma.$transaction(tx => purchasePacks(tx, userId, { packTypeId: packId, currency: "gold", quantity: 1 }))));
  assert.equal(results.filter(result => result.status === "fulfilled").length, 3);
  for (const result of results) if (result.status === "rejected") assert.ok(result.reason instanceof PackError);
  assert.equal((await prisma.player.findUniqueOrThrow({ where: { id: playerId } })).gold, 0);
  assert.equal((await prisma.playerPack.findUniqueOrThrow({ where: { id: ownedId } })).quantity, 3);
}, { gold: 600 }));
test("opening awards all ten cards and consumes only one pack", () => withFixture(async ({ userId, playerId, ownedId }) => {
  const result = await prisma.$transaction(tx => openPlayerPack(tx, userId, ownedId, () => .995));
  assert.equal(result.cards.length, 10);
  assert.equal(result.remainingPacks, 1);
  assert.ok(result.cards.every(card => ["Dominus Volcánico Astravor", "Trono de Fuego"].includes(card.name)));
  const collection = await prisma.playerCard.findMany({ where: { playerId } });
  assert.equal(collection.reduce((sum, card) => sum + card.quantity, 0), 10);
  assert.equal((await prisma.player.findUniqueOrThrow({ where: { id: playerId } })).gold, 1000);
}, { quantity: 2 }));
test("an invalid pack pool rolls back consumption without awarding partial cards", () => withFixture(async ({ userId, playerId, ownedId }) => {
  await assert.rejects(prisma.$transaction(tx => openPlayerPack(tx, userId, ownedId)), PackError);
  assert.equal((await prisma.playerPack.findUniqueOrThrow({ where: { id: ownedId } })).quantity, 1);
  assert.equal(await prisma.playerCard.count({ where: { playerId } }), 0);
}, { quantity: 1, invalidOdds: true }));
test("simultaneous opens cannot duplicate the last pack", () => withFixture(async ({ userId, playerId, ownedId }) => {
  const results = await Promise.allSettled(Array.from({ length: 2 }, () => prisma.$transaction(tx => openPlayerPack(tx, userId, ownedId))));
  assert.equal(results.filter(result => result.status === "fulfilled").length, 1);
  const failure = results.find(result => result.status === "rejected");
  assert.ok(failure && failure.reason instanceof PackError);
  assert.equal((await prisma.playerPack.findUniqueOrThrow({ where: { id: ownedId } })).quantity, 0);
  const collection = await prisma.playerCard.findMany({ where: { playerId } });
  assert.equal(collection.reduce((sum, card) => sum + card.quantity, 0), 10);
}, { quantity: 1 }));
