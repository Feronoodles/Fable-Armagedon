"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import { GameShell, CommandHeading, CommandLoading, CommandEmpty, CommandError } from "@/components/command/GameShell";
import { CommandDialog } from "@/components/command/CommandDialog";
import { CommandIcon } from "@/components/command/CommandIcon";
import { ArchiveCard } from "@/components/command/ArchiveCard";
import { useGameResource, gameMutation } from "@/components/command/useGameResource";
import { usePlayer } from "@/components/command/PlayerProvider";
import { isVolcanPack, MAX_PACK_PURCHASE, VOLCAN_PACK_ART, type FeaturedDrop, type PackOdds } from "@/lib/packs";
import { CardArt } from "@/components/cards/CardArt";
import { CardDetail } from "@/components/cards/CardDetail";
import type { Card } from "@/components/cards/CardItem";
import { RARITY_APPEARANCE } from "@/lib/card-appearance";

interface PackType {
  id: string; name: string; description?: string; expansionKey?: string | null; imageUrl?: string | null; featuredDrops: FeaturedDrop[]; cardsPerPack: number; priceGold: number; priceGems: number;
  commonChance: number; uncommonChance: number; rareChance: number; epicChance: number; legendaryChance: number; celestialChance: number; guaranteeRare: boolean;
}
interface Pack { id: string; quantity: number; packType: PackType }
interface PacksData { packs: Pack[]; shopPacks: PackType[]; gold: number; gems: number }
const RATE_KEYS: [keyof PackOdds, string][] = [["commonChance", "COMUN"], ["uncommonChance", "INFRECUENTE"], ["rareChance", "RARA"], ["epicChance", "EPICA"], ["legendaryChance", "LEGENDARIA"], ["celestialChance", "CELESTIAL"]];

function PackVisual({ pack, en }: { pack: PackType; en: boolean }) {
  const volcanic = isVolcanPack(pack), image = pack.imageUrl || (volcanic ? VOLCAN_PACK_ART : null);
  return <div className="command-pack-visual" aria-hidden="true"><div className={"command-pack-box" + (volcanic ? " is-volcanic" : "") + (image ? " has-art" : "")}>
    {image ? <><CardArt card={{ name: pack.name, imageUrl: image }} /><div className="command-pack-cover-title"><small>{volcanic ? (en ? "Fire expansion" : "Expansión de Fuego") : "FABLE ARMAGEDDON"}</small><strong>{pack.name}</strong></div></> : <><CommandIcon name="citadel" /><small>FABLE<br />ARMAGEDDON</small></>}
  </div></div>;
}
function PackInfo({ pack, en }: { pack: PackType; en: boolean }) {
  return <><h2>{pack.name}</h2><p>{pack.description}</p><div className="command-pack-meta">{pack.cardsPerPack} {en ? "cards per pack" : "cartas por sobre"}{pack.celestialChance > 0 && <span className="command-pack-celestial">{pack.celestialChance}% celestial</span>}</div>
    <details><summary>{en ? "Contents and probabilities" : "Contenido y probabilidades"}</summary><dl className="command-drop-rates">{RATE_KEYS.map(([key, rarity]) => <div key={key} style={{ display: "contents" }}><dt>{en ? RARITY_APPEARANCE[rarity].en : RARITY_APPEARANCE[rarity].es}</dt><dd>{pack[key]}%</dd></div>)}</dl>
      <p className="command-pack-odds-note">{en ? "Base chance per card. Cards of the same rarity share its probability equally." : "Probabilidad base por carta. Las cartas de una misma rareza comparten su probabilidad por igual."}{pack.guaranteeRare && (en ? " At least one rare or better is guaranteed in each pack." : " Se garantiza al menos una rara o superior por sobre.")}</p>
      {pack.featuredDrops?.length > 0 && <><p className="command-pack-featured-label">{en ? "Also available in this pack" : "También pueden salir en este sobre"}</p><dl className="command-drop-rates is-featured">{pack.featuredDrops.map(drop => <div key={drop.name} style={{ display: "contents" }}><dt style={{ color: RARITY_APPEARANCE[drop.rarity]?.color }}>{drop.name}</dt><dd>{drop.chance.toLocaleString(en ? "en-US" : "es-PE", { maximumFractionDigits: 3 })}%</dd></div>)}</dl><p className="command-pack-odds-note">{en ? "Special mana uses one card slot. Basic mana is not included." : "El maná especial ocupa una de las cartas del sobre. El maná básico no aparece."}</p></>}
    </details></>;
}
function Purchase({ pack, gold, gems, busy, en, buy }: { pack: PackType; gold: number; gems: number; busy: boolean; en: boolean; buy: (currency: "gold" | "gems", quantity: number) => void }) {
  const [currency, setCurrency] = useState<"gold" | "gems">(pack.priceGold > 0 ? "gold" : "gems");
  const [amount, setAmount] = useState("1");
  const quantity = Number(amount), valid = Number.isSafeInteger(quantity) && quantity >= 1 && quantity <= MAX_PACK_PURCHASE;
  const unitPrice = currency === "gold" ? pack.priceGold : pack.priceGems, cost = valid ? unitPrice * quantity : 0;
  const available = currency === "gold" ? gold : gems;
  return <div className="command-purchase">
    <div className="command-purchase-fields"><label className="command-field">{en ? "Pay with" : "Pagar con"}<select className="command-select" value={currency} disabled={busy} onChange={event => setCurrency(event.target.value as "gold" | "gems")}>{pack.priceGold > 0 && <option value="gold">{pack.priceGold} {en ? "gold / pack" : "oro / sobre"}</option>}{pack.priceGems > 0 && <option value="gems">{pack.priceGems} {en ? "gems / pack" : "gemas / sobre"}</option>}</select></label><label className="command-field">{en ? "Quantity" : "Cantidad"}<input className="command-input" type="number" inputMode="numeric" min={1} max={MAX_PACK_PURCHASE} step={1} value={amount} disabled={busy} onChange={event => setAmount(event.target.value)} aria-label={(en ? "Quantity of " : "Cantidad de sobres ") + pack.name} aria-invalid={!valid} /></label></div>
    <div className="command-purchase-total" aria-live="polite"><span>Total</span><strong><CommandIcon name={currency} />{valid ? cost.toLocaleString(en ? "en-US" : "es-PE") : "—"} <small>{currency === "gold" ? (en ? "gold" : "oro") : en ? "gems" : "gemas"}</small></strong></div>
    <button className="command-button" disabled={busy || !valid || unitPrice <= 0 || available < cost} onClick={() => buy(currency, quantity)}><CommandIcon name="packs" />{busy ? (en ? "Processing…" : "Procesando…") : (en ? "Buy " : "Comprar ") + (valid ? quantity : "") + (en ? (quantity === 1 ? " pack" : " packs") : quantity === 1 ? " sobre" : " sobres")}</button>
    <p className="command-purchase-hint" aria-live="polite">{!valid ? (en ? "Choose 1–100 packs." : "Elige entre 1 y 100 sobres.") : available < cost ? (en ? "You need " : "Te faltan ") + (cost - available) + (currency === "gold" ? (en ? " gold." : " de oro.") : en ? " gems." : " gemas.") : ""}</p>
  </div>;
}
export default function PacksPage() {
  const { language } = useI18n(), en = language === "en";
  const { data, error, loading, reload } = useGameResource<PacksData>("/api/packs");
  const { refresh } = usePlayer();
  const [tab, setTab] = useState<"inventory" | "shop">("inventory"), [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState(""), [failure, setFailure] = useState("");
  const [opened, setOpened] = useState<Card[] | null>(null), [showResults, setShowResults] = useState(false), [selected, setSelected] = useState<Card | null>(null);
  const inventory = (data?.packs ?? []).filter(pack => pack.quantity > 0);
  async function buy(pack: PackType, currency: "gold" | "gems", quantity: number) {
    if (busy || loading) return;
    setBusy(pack.id); setMessage(""); setFailure("");
    try { await gameMutation("/api/packs/buy", "POST", { packTypeId: pack.id, currency, quantity }); setMessage(quantity + (en ? (quantity === 1 ? " pack of " : " packs of ") : (quantity === 1 ? " sobre de " : " sobres de ")) + pack.name + (en ? " added to your inventory." : (quantity === 1 ? " añadido a tu inventario." : " añadidos a tu inventario."))); reload(); refresh(); }
    catch (cause) { setFailure(cause instanceof Error ? cause.message : "Error"); }
    finally { setBusy(null); }
  }
  async function open(pack: Pack) {
    if (busy || loading) return;
    setBusy(pack.id); setMessage(""); setFailure("");
    try { const result = await gameMutation<{ cards: Card[] }>("/api/packs/open", "POST", { packId: pack.id }); setOpened(result.cards); setShowResults(true); reload(); refresh(); }
    catch (cause) { setFailure(cause instanceof Error ? cause.message : "Error"); }
    finally { setBusy(null); }
  }
  return <GameShell section={en ? "Packs" : "Sobres"}>
    <CommandHeading eyebrow={en ? "The armory" : "La armería"} title={en ? "Expand your arsenal" : "Amplía tu arsenal"}>{en ? "Open your packs or find your next addition. Check the cost and rarity chances of each pack." : "Abre tus sobres o encuentra tu próxima incorporación. Consulta el costo y las probabilidades de cada sobre."}</CommandHeading>
    <div className="command-tabs" role="group" aria-label={en ? "Pack section" : "Sección de sobres"}><button aria-pressed={tab === "inventory"} onClick={() => setTab("inventory")}>{en ? "My packs" : "Mis sobres"} · {inventory.reduce((sum, pack) => sum + pack.quantity, 0)}</button><button aria-pressed={tab === "shop"} onClick={() => setTab("shop")}>{en ? "Shop" : "Armería"}</button></div>
    {message && <div className="command-notice" role="status"><p>{message}</p>{tab === "shop" && <button className="command-text-link" onClick={() => setTab("inventory")}>{en ? "See my packs" : "Ver mis sobres"}<CommandIcon name="arrow" width="15" /></button>}</div>}
    {failure && <CommandError message={failure} />}
    {error ? <CommandError message={error} retry={reload} /> : loading && !data ? <CommandLoading /> : tab === "inventory" ? inventory.length ? <div className="command-pack-grid">{inventory.map(pack => <article className="command-panel command-pack" key={pack.id}><PackVisual pack={pack.packType} en={en} /><PackInfo pack={pack.packType} en={en} /><div className="command-purchase"><p className="command-results-line">{pack.quantity} {en ? "available" : "disponibles"}</p><button className="command-button" disabled={Boolean(busy) || loading} onClick={() => void open(pack)}><CommandIcon name="packs" />{busy === pack.id ? (en ? "Opening…" : "Abriendo…") : en ? "Open one pack" : "Abrir un sobre"}</button></div></article>)}</div> : <CommandEmpty icon="packs" title={en ? "No unopened packs" : "No tienes sobres por abrir"} action={<button className="command-button" onClick={() => setTab("shop")}>{en ? "Explore the armory" : "Explorar la armería"}<CommandIcon name="arrow" /></button>}>{en ? "Visit the armory to get cards and discover new strategies." : "Visita la armería para conseguir cartas y descubrir nuevas estrategias."}</CommandEmpty> : <div className="command-pack-grid">{data?.shopPacks.filter(pack => pack.priceGold > 0 || pack.priceGems > 0).map(pack => <article className="command-panel command-pack" key={pack.id}><PackVisual pack={pack} en={en} /><PackInfo pack={pack} en={en} /><Purchase pack={pack} gold={data.gold} gems={data.gems} busy={Boolean(busy) || loading} en={en} buy={(currency, quantity) => void buy(pack, currency, quantity)} /></article>)}</div>}
    {showResults && opened && <CommandDialog wide title={en ? "Your new cards" : "Tus nuevas cartas"} onClose={() => setShowResults(false)}><p style={{ marginBottom: 20 }}>{en ? "Added to your collection. Select a card to inspect its abilities." : "Añadidas a tu colección. Selecciona una carta para consultar sus habilidades."}</p><div className="command-archive-grid">{opened.map((card, index) => <ArchiveCard key={card.id + "-" + index} card={card} onClick={() => { setShowResults(false); setSelected(card); }} />)}</div><div className="command-dialog-actions"><Link className="command-button is-secondary" href="/collection">{en ? "View collection" : "Ver colección"}</Link><button className="command-button" onClick={() => setShowResults(false)}>{en ? "Continue" : "Continuar"}</button></div></CommandDialog>}
    {selected && <CardDetail card={selected} onClose={() => { setSelected(null); setShowResults(true); }} />}
  </GameShell>;
}
