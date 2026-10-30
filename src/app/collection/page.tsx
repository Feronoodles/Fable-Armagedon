"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/components/I18nProvider";
import { GameShell, CommandHeading, CommandError, CommandLoading, CommandEmpty } from "@/components/command/GameShell";
import { useGameResource } from "@/components/command/useGameResource";
import { CommandIcon } from "@/components/command/CommandIcon";
import { ArchiveCard } from "@/components/command/ArchiveCard";
import { CardDetail } from "@/components/cards/CardDetail";
import type { Card } from "@/components/cards/CardItem";
import { ELEMENT_APPEARANCE, RARITY_APPEARANCE, TYPE_APPEARANCE } from "@/lib/card-appearance";
import { getSubtypeLabel } from "@/game-engine/subtypes";
import { cleanText } from "@/components/command/card-utils";

const EMPTY = { search: "", type: "", element: "", rarity: "", subtype: "", cost: "", sort: "name" };
export default function CollectionPage() {
  const { language, translateCardName } = useI18n(), en = language === "en";
  const { data, error, loading, reload } = useGameResource<{ collection: { quantity: number; card: Card }[]; allCards: Card[] }>("/api/collection");
  const [filters, setFilters] = useState(EMPTY), [catalog, setCatalog] = useState(false), [selected, setSelected] = useState<Card | null>(null);
  const owned = new Map(data?.collection.filter(entry => entry.quantity > 0).map(entry => [entry.card.id, entry.quantity]) ?? []);
  const library = catalog ? data?.allCards ?? [] : (data?.collection ?? []).filter(entry => entry.quantity > 0).map(entry => entry.card);
  const cards = library.filter(card => (!filters.type || (card.cardType === "TIERRA" ? "MANA" : card.cardType) === filters.type) &&
    (!filters.element || card.attribute === filters.element) && (!filters.rarity || card.rarity === filters.rarity) &&
    (!filters.subtype || card.subtypes.includes(filters.subtype)) && (!filters.cost || (filters.cost === "6+" ? card.cost >= 6 : card.cost === Number(filters.cost))) &&
    (!filters.search || cleanText(card.name + " " + translateCardName(card.name) + " " + (card.description ?? "") + " " + (card.abilities ?? []).map(ability => ability.description).join(" ")).includes(cleanText(filters.search))))
    .sort((a, b) => filters.sort === "cost" ? a.cost - b.cost || a.name.localeCompare(b.name) : filters.sort === "rarity" ? (RARITY_APPEARANCE[b.rarity]?.rank ?? 0) - (RARITY_APPEARANCE[a.rarity]?.rank ?? 0) || a.name.localeCompare(b.name) : translateCardName(a.name).localeCompare(translateCardName(b.name)));
  const update = (key: keyof typeof EMPTY, value: string) => setFilters(previous => ({ ...previous, [key]: value }));
  const filtered = Object.entries(filters).some(([key, value]) => key !== "sort" && value !== "");
  return <GameShell section={en ? "Collection" : "Colección"}>
    <CommandHeading eyebrow={en ? "The archive" : "El archivo"} title={en ? "Your collection" : "Tu colección"} action={<Link href="/packs" className="command-button is-secondary"><CommandIcon name="packs" />{en ? "Get cards" : "Conseguir cartas"}</Link>}>{en ? "Explore your cards and inspect their abilities. Every great strategy starts with an idea." : "Explora tus cartas y consulta sus habilidades. Toda gran estrategia empieza con una idea."}</CommandHeading>
    <div className="command-tabs" role="group" aria-label={en ? "Card ownership" : "Cartas obtenidas"}><button type="button" aria-pressed={!catalog} onClick={() => setCatalog(false)}>{en ? "My cards" : "Mis cartas"} · {owned.size}</button><button type="button" aria-pressed={catalog} onClick={() => setCatalog(true)}>{en ? "Full catalog" : "Catálogo completo"} · {data?.allCards.length ?? "—"}</button></div>
    <div className="command-toolbar"><div className="command-search"><CommandIcon name="search" /><input className="command-input" aria-label={en ? "Search cards" : "Buscar cartas"} placeholder={en ? "Search by name or effect…" : "Buscar por nombre o efecto…"} value={filters.search} onChange={event => update("search", event.target.value)} /></div>
      <select className="command-select" aria-label={en ? "Element" : "Elemento"} value={filters.element} onChange={event => update("element", event.target.value)}><option value="">{en ? "All elements" : "Todos los elementos"}</option>{Object.entries(ELEMENT_APPEARANCE).filter(([key]) => !["LEGENDARIO", "CELESTIAL"].includes(key)).map(([key, item]) => <option key={key} value={key}>{en ? item.en : item.es}</option>)}</select>
      <select className="command-select" aria-label={en ? "Card type" : "Tipo de carta"} value={filters.type} onChange={event => update("type", event.target.value)}><option value="">{en ? "All types" : "Todos los tipos"}</option>{Object.entries(TYPE_APPEARANCE).map(([key, item]) => <option key={key} value={key}>{en ? item.en : item.es}</option>)}</select>
      <details className="command-filter-details"><summary>{en ? "More filters" : "Más filtros"}{[filters.rarity, filters.cost, filters.subtype].some(Boolean) ? " •" : ""}</summary><div className="command-filter-popover"><label className="command-field">{en ? "Rarity" : "Rareza"}<select className="command-select" value={filters.rarity} onChange={event => update("rarity", event.target.value)}><option value="">{en ? "All rarities" : "Todas las rarezas"}</option>{Object.entries(RARITY_APPEARANCE).map(([key, item]) => <option key={key} value={key}>{en ? item.en : item.es}</option>)}</select></label><label className="command-field">{en ? "Subtype" : "Subtipo"}<select className="command-select" value={filters.subtype} onChange={event => update("subtype", event.target.value)}><option value="">{en ? "All subtypes" : "Todos los subtipos"}</option>{[...new Set((data?.allCards ?? []).flatMap(card => card.subtypes))].sort().map(key => <option key={key} value={key}>{getSubtypeLabel(key, language)}</option>)}</select></label><label className="command-field">{en ? "Mana cost" : "Costo de maná"}<select className="command-select" value={filters.cost} onChange={event => update("cost", event.target.value)}><option value="">{en ? "Any cost" : "Cualquier costo"}</option>{["0", "1", "2", "3", "4", "5", "6+"].map(cost => <option key={cost}>{cost}</option>)}</select></label></div></details>
      <select className="command-select" aria-label={en ? "Sort cards" : "Ordenar cartas"} value={filters.sort} onChange={event => update("sort", event.target.value)}><option value="name">{en ? "Name A–Z" : "Nombre A–Z"}</option><option value="cost">{en ? "Lowest cost" : "Menor costo"}</option><option value="rarity">{en ? "Highest rarity" : "Mayor rareza"}</option></select>
    </div>
    <div className="command-results-line"><span>{cards.length} {en ? "results · Select a card to inspect it" : "resultados · Selecciona una carta para verla"}</span>{filtered && <button onClick={() => setFilters(EMPTY)}>{en ? "Clear filters" : "Limpiar filtros"}</button>}</div>
    {error ? <CommandError message={error} retry={reload} /> : loading ? <CommandLoading /> : cards.length ? <div className="command-archive-grid">{cards.map(card => <ArchiveCard key={card.id} card={card} quantity={owned.get(card.id) ?? 0} onClick={() => setSelected(card)} />)}</div> : <CommandEmpty icon="collection" title={en ? "No cards here yet" : "No hay cartas aquí"}>{filtered ? (en ? "Try changing your search or filters." : "Prueba otra búsqueda o cambia los filtros.") : en ? "Open a pack or explore the full catalog." : "Abre un sobre o explora el catálogo completo."}</CommandEmpty>}
    {selected && <CardDetail card={selected} quantity={owned.get(selected.id) ?? 0} onClose={() => setSelected(null)} />}
  </GameShell>;
}
