import test from "node:test";
import assert from "node:assert/strict";
import { cardCatalog } from "../src/game-engine/catalog";
import { getCardExpansionKey } from "../src/game-engine/expansions";
import { drawPack, featuredPackDrops, isCardInPack, MAX_PACK_PURCHASE, PACK_RARITIES, PackError, packPurchaseCost, parsePackPurchase, VOLCAN_PACK_ODDS } from "../src/lib/packs";

const catalog = cardCatalog.map((card, index) => ({ ...card, id: String(index), expansionKey: getCardExpansionKey(card.name) }));
const volcano = { name: "Volcán Dormido", expansionKey: "VOLCAN_DORMIDO", cardsPerPack: 10, guaranteeRare: true, ...VOLCAN_PACK_ODDS };
const find = (name: string) => { const card = catalog.find(card => card.name === name); assert.ok(card); return card; };

test("Volcán Dormido includes Dominus and only its two special Fire mana cards", () => {
  for (const name of ["Dominus Volcánico Astravor", "Santuario de Fuego", "Trono de Fuego"]) assert.ok(isCardInPack(find(name), volcano));
  for (const name of ["Mana de Fuego", "Santuario de Agua", "Trono de Metal", "Titán Colisionador de Eras"]) assert.equal(isCardInPack(find(name), volcano), false);
  const mana = catalog.filter(card => card.cardType === "MANA" && isCardInPack(card, volcano));
  assert.deepEqual(mana.map(card => card.name).sort(), ["Santuario de Fuego", "Trono de Fuego"]);
  assert.ok(catalog.filter(card => isCardInPack(card, volcano)).every(card => card.attribute === "FUEGO"));
});
test("other packs keep their own expansions and do not gain mana cards", () => {
  const core = { name: "Sobre Estándar", expansionKey: "CORE" };
  assert.equal(isCardInPack(find("Santuario de Fuego"), core), false);
  assert.equal(isCardInPack(find("Trono de Fuego"), core), false);
  assert.equal(isCardInPack(find("Dominus Volcánico Astravor"), core), false);
  assert.equal(isCardInPack(find("Guerrero Neandertal Cibernético"), core), true);
});
test("base odds total 100 and expose the actual per-card chances of the featured cards", () => {
  assert.equal(Object.values(VOLCAN_PACK_ODDS).reduce((sum, value) => sum + value, 0), 100);
  const drops = featuredPackDrops(volcano, catalog);
  assert.equal(drops.find(drop => drop.name === "Dominus Volcánico Astravor")?.chance, 0.5);
  assert.equal(drops.find(drop => drop.name === "Trono de Fuego")?.chance, 0.5);
  assert.equal(drops.find(drop => drop.name === "Santuario de Fuego")?.chance, 0.75);
});
test("rarity sampling follows the published percentages across evenly spaced rolls", () => {
  const counts = Object.fromEntries(PACK_RARITIES.map(rarity => [rarity, 0]));
  const pack = { ...volcano, cardsPerPack: 1, guaranteeRare: false };
  for (let i = 0; i < 10000; i++) {
    let call = 0;
    const card = drawPack(pack, catalog, () => call++ === 0 ? (i + .5) / 10000 : .5)[0];
    counts[card.rarity]++;
  }
  assert.deepEqual(counts, { COMUN: 4400, INFRECUENTE: 3000, RARA: 1500, EPICA: 700, LEGENDARIA: 300, CELESTIAL: 100 });
});
test("each featured card can actually be drawn at its rarity", () => {
  for (const [name, roll] of [["Dominus Volcánico Astravor", .995], ["Trono de Fuego", .995], ["Santuario de Fuego", .975]] as const) {
    const target = find(name), pool = catalog.filter(card => isCardInPack(card, volcano) && card.rarity === target.rarity);
    const index = pool.findIndex(card => card.id === target.id);
    let call = 0;
    const [result] = drawPack({ ...volcano, cardsPerPack: 1, guaranteeRare: false }, catalog, () => call++ === 0 ? roll : (index + .5) / pool.length);
    assert.equal(result.name, name);
  }
});
test("a pack guarantees rare or better even when all initial draws are uncommon", () => {
  const cards = drawPack(volcano, catalog, () => .6);
  assert.equal(cards.length, 10);
  assert.ok(cards.slice(0, 9).every(card => card.rarity === "INFRECUENTE"));
  assert.ok(PACK_RARITIES.indexOf(cards[9].rarity as typeof PACK_RARITIES[number]) >= 2);
});
test("an earlier rare satisfies the guarantee without replacing the last common", () => {
  let call = 0;
  const cards = drawPack(volcano, catalog, () => call++ === 0 ? .8 : 0);
  assert.equal(cards[0].rarity, "RARA");
  assert.equal(cards[9].rarity, "COMUN");
});
test("zero-probability rarities cannot appear at the random boundary zero", () => {
  const commonOnly = { ...volcano, cardsPerPack: 1, guaranteeRare: false, commonChance: 100, uncommonChance: 0, rareChance: 0, epicChance: 0, legendaryChance: 0, celestialChance: 0 };
  assert.equal(drawPack(commonOnly, catalog, () => 0)[0].rarity, "COMUN");
  assert.equal(drawPack(commonOnly, catalog, () => .999999)[0].rarity, "COMUN");
});
test("missing pools or invalid odds fail instead of producing short packs", () => {
  assert.throws(() => drawPack(volcano, catalog.filter(card => card.rarity !== "CELESTIAL")), PackError);
  assert.throws(() => drawPack({ ...volcano, commonChance: 45 }, catalog), /100%/);
  assert.throws(() => drawPack({ ...volcano, cardsPerPack: 0 }, catalog), PackError);
});
test("bulk purchase accepts whole quantities and keeps the old one-pack request compatible", () => {
  assert.deepEqual(parsePackPurchase({ packTypeId: "volcano", currency: "gold" }), { packTypeId: "volcano", currency: "gold", quantity: 1 });
  assert.equal(parsePackPurchase({ packTypeId: "volcano", currency: "gems", quantity: MAX_PACK_PURCHASE }).quantity, 100);
  assert.equal(packPurchaseCost(200, 5), 1000);
});
test("invalid quantities, currencies and amounts cannot be charged", () => {
  for (const quantity of [0, -1, 1.5, 101, "5", null, Infinity, NaN]) assert.throws(() => parsePackPurchase({ packTypeId: "volcano", currency: "gold", quantity }), PackError);
  for (const input of [null, [], {}, { packTypeId: "volcano", currency: "coins" }, { packTypeId: "", currency: "gold" }]) assert.throws(() => parsePackPurchase(input), PackError);
  assert.throws(() => packPurchaseCost(0, 1), PackError);
  assert.throws(() => packPurchaseCost(2147483647, 100), PackError);
});
