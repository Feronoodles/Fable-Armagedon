"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import { GameShell, CommandLoading, CommandError } from "@/components/command/GameShell";
import { getCardAppearance } from "@/lib/card-appearance";
import { getSubtypeLabel } from "@/game-engine/subtypes";
import { CardArt } from "@/components/cards/CardArt";
import { CardDetail } from "@/components/cards/CardDetail";
import { getRarityTextColor, type Card } from "@/components/cards/CardItem";

interface DeckCard { id: string; quantity: number; card: Card }
interface Deck { id: string; name: string; description?: string; deckCards: DeckCard[] }
interface PlayerCard { quantity: number; card: Card }
const LIMITS: Record<string, number> = { COMUN: 4, INFRECUENTE: 4, RARA: 3, EPICA: 3, LEGENDARIA: 1, CELESTIAL: 1 };
const ELEMENTS: Record<string, string> = { FUEGO: "🔥", AGUA: "💧", NATURALEZA: "🌿", RAYO: "⚡", VACIO: "🌑", NORMAL: "◈", TIERRA: "⛰", METAL: "⚙" };
const TYPE_NAMES: Record<string, string> = { CRIATURA: "Criaturas", HECHIZO: "Hechizos", ALTERADOR: "Cartas de campo", MANA: "Maná", TIERRA: "Maná" };
const land = (card: Card) => card.cardType === "MANA" || card.cardType === "TIERRA";
const clean = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const serialize = (name: string, description: string, entries: DeckCard[]) =>
  JSON.stringify({ name, description, cards: entries.map(e => [e.card.id, e.quantity]).sort((a, b) => String(a[0]).localeCompare(String(b[0]))) });
const EMPTY_FILTERS = { search: "", type: "", element: "", rarity: "", cost: "", subtype: "", available: false, sort: "cost" };

export default function DeckBuilderPage() {
  const { data: session, status } = useSession();
  const router = useRouter(), params = useParams(), deckId = String(params.id);
  const { language, translateCardName } = useI18n();
  const en = language === "en";
  const [name, setName] = useState(""), [description, setDescription] = useState("");
  const [entries, setEntries] = useState<DeckCard[]>([]);
  const [clearedEntries, setClearedEntries] = useState<DeckCard[] | null>(null);
  const [collection, setCollection] = useState<PlayerCard[]>([]), [allCards, setAllCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true), [error, setError] = useState(""), [saving, setSaving] = useState(false);
  const [baseline, setBaseline] = useState(""), [notice, setNotice] = useState("");
  const [tab, setTab] = useState<"cards" | "mana">("cards"), [filters, setFilters] = useState(EMPTY_FILTERS);
  const [selected, setSelected] = useState<Card | null>(null), [retry, setRetry] = useState(0);
  const [draggingOver, setDraggingOver] = useState(false);
  const owned = useMemo(() => new Map(collection.map(c => [c.card.id, c.quantity])), [collection]);
  const quantities = useMemo(() => new Map(entries.map(e => [e.card.id, e.quantity])), [entries]);
  const main = useMemo(() => entries.filter(e => !land(e.card)), [entries]);
  const lands = useMemo(() => entries.filter(e => land(e.card)), [entries]);
  const mainCount = main.reduce((sum, e) => sum + e.quantity, 0), manaCount = lands.reduce((sum, e) => sum + e.quantity, 0);
  const dirty = baseline !== "" && serialize(name, description, entries) !== baseline;
  const valid = name.trim().length > 0 && mainCount >= 40 && mainCount <= 50 && manaCount <= 24;
  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
    if (status !== "authenticated") return;
    const controller = new AbortController();
    setLoading(true); setError("");
    void (async () => {
      try {
        const [deckResponse, collectionResponse] = await Promise.all([
          fetch("/api/decks/" + deckId, { signal: controller.signal }),
          fetch("/api/collection", { signal: controller.signal }),
        ]);
        if (!deckResponse.ok || !collectionResponse.ok) throw new Error("No se pudo cargar el mazo y la colección.");
        const { deck }: { deck: Deck } = await deckResponse.json(), data = await collectionResponse.json();
        if (controller.signal.aborted) return;
        setName(deck.name); setDescription(deck.description ?? ""); setEntries(deck.deckCards); setClearedEntries(null);
        setCollection(data.collection ?? []); setAllCards(data.allCards ?? []);
        setBaseline(serialize(deck.name, deck.description ?? "", deck.deckCards));
      } catch (err) { if (!controller.signal.aborted) setError(err instanceof Error ? err.message : "Error al cargar."); }
      finally { if (!controller.signal.aborted) setLoading(false); }
    })();
    return () => controller.abort();
  }, [status, deckId, router, retry]);
  useEffect(() => {
    if (!dirty) return;
    const handler = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = ""; };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);
  const addReason = (card: Card, current = entries) => {
    const qty = current.find(e => e.card.id === card.id)?.quantity ?? 0;
    const total = current.filter(e => land(e.card) === land(card)).reduce((sum, e) => sum + e.quantity, 0);
    if (total >= (land(card) ? 24 : 50)) return land(card) ? "Máximo 24 cartas de maná." : "Máximo 50 cartas principales.";
    if (land(card) && card.rarity === "COMUN") return "";
    if (qty >= (owned.get(card.id) ?? 0)) return "Ya usaste todas las copias de tu colección.";
    if (qty >= (land(card) ? 5 : LIMITS[card.rarity] ?? 4)) return "Alcanzaste el límite de copias de esta carta.";
    return "";
  };
  const add = (card: Card) => {
    if (saving) return;
    setClearedEntries(null);
    setEntries(current => {
      if (addReason(card, current)) return current;
      const exists = current.some(e => e.card.id === card.id);
      return exists ? current.map(e => e.card.id === card.id ? { ...e, quantity: e.quantity + 1 } : e) :
        [...current, { id: "local-" + card.id, quantity: 1, card }];
    });
    setNotice("");
  };
  const remove = (id: string) => {
    if (saving) return;
    setClearedEntries(null);
    setEntries(current => current.flatMap(e => e.card.id !== id ? [e] : e.quantity > 1 ? [{ ...e, quantity: e.quantity - 1 }] : []));
    setNotice("");
  };
  const clearDeck = () => {
    if (saving || !entries.length) return;
    setClearedEntries(entries);
    setEntries([]);
    setSelected(null);
    setDraggingOver(false);
    setNotice("");
  };
  const undoClearDeck = () => {
    if (saving || !clearedEntries) return;
    setEntries(clearedEntries);
    setClearedEntries(null);
    setNotice(en ? "Deck restored." : "Mazo restaurado.");
  };
  const autoMana = () => {
    const basic = allCards.filter(c => land(c) && c.rarity === "COMUN");
    if (!basic.length) { setNotice("No se encontraron cartas de maná básico."); return; }
    const target = Math.min(24, Math.max(16, Math.round(mainCount * .42)));
    const weights = new Map<string, number>();
    main.forEach(e => e.card.manaTypes.filter(t => !["LEGENDARIO", "CELESTIAL"].includes(t)).forEach(t =>
      weights.set(t, (weights.get(t) ?? 0) + e.quantity * Math.max(1, e.card.cost))));
    const eligible = basic.filter(c => weights.has(c.attribute));
    const choices = eligible.length ? eligible : basic.filter(c => c.attribute === "NORMAL").length ? basic.filter(c => c.attribute === "NORMAL") : basic;
    const totalWeight = choices.reduce((sum, c) => sum + (weights.get(c.attribute) ?? 1), 0);
    setClearedEntries(null);
    setEntries(current => {
      let next = [...current];
      const count = () => next.filter(e => land(e.card)).reduce((sum, e) => sum + e.quantity, 0);
      while (count() < target) {
        const chosen = [...choices].sort((a, b) => {
          const deficit = (c: Card) => target * (weights.get(c.attribute) ?? 1) / totalWeight -
            next.filter(e => land(e.card) && e.card.attribute === c.attribute).reduce((sum, e) => sum + e.quantity, 0);
          return deficit(b) - deficit(a);
        })[0];
        next = next.some(e => e.card.id === chosen.id) ? next.map(e => e.card.id === chosen.id ? { ...e, quantity: e.quantity + 1 } : e) :
          [...next, { id: "local-" + chosen.id, quantity: 1, card: chosen }];
      }
      return next;
    });
    setNotice(en ? "Basic mana added to match your deck's elements." : "Maná básico añadido según los elementos de tu mazo.");
  };
  const save = async () => {
    if (!valid || saving || !dirty) return;
    setSaving(true); setNotice("");
    try {
      const response = await fetch("/api/decks/" + deckId, { method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), description, deckCards: entries.map(e => ({ cardId: e.card.id, quantity: e.quantity })) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message ?? "No se pudo guardar el mazo.");
      setName(name.trim()); setBaseline(serialize(name.trim(), description, entries));
      setNotice(en ? "Deck saved." : "Mazo guardado.");
    } catch (err) { setNotice(err instanceof Error ? err.message : "Error al guardar."); }
    finally { setSaving(false); }
  };
  const library = tab === "mana" ? allCards.filter(land) : collection.map(c => c.card).filter(c => !land(c));
  const visible = library.filter(card =>
    (!filters.search || clean(translateCardName(card.name) + " " + card.name + " " + (card.description ?? "") + " " + (card.abilities ?? []).map(a => a.description).join(" ")).includes(clean(filters.search))) &&
    (!filters.type || card.cardType === filters.type) && (!filters.element || card.attribute === filters.element) &&
    (!filters.rarity || card.rarity === filters.rarity) && (!filters.subtype || card.subtypes.includes(filters.subtype)) &&
    (!filters.cost || (filters.cost === "6+" ? card.cost >= 6 : card.cost === Number(filters.cost))) &&
    (!filters.available || !addReason(card))
  ).sort((a, b) => filters.sort === "name" ? translateCardName(a.name).localeCompare(translateCardName(b.name)) :
    filters.sort === "rarity" ? Object.keys(LIMITS).indexOf(b.rarity) - Object.keys(LIMITS).indexOf(a.rarity) || a.cost - b.cost :
      a.cost - b.cost || a.name.localeCompare(b.name));
  const curve = Array.from({ length: 7 }, (_, cost) => main.filter(e => Math.min(e.card.cost, 6) === cost).reduce((sum, e) => sum + e.quantity, 0));
  const average = mainCount ? (main.reduce((sum, e) => sum + e.card.cost * e.quantity, 0) / mainCount).toFixed(1) : "0";
  const updateFilter = (key: keyof typeof EMPTY_FILTERS, value: string | boolean) => setFilters(previous => ({ ...previous, [key]: value }));
  const dragStart = (event: React.DragEvent, card: Card, source: string) => {
    event.dataTransfer.setData("application/json", JSON.stringify({ id: card.id, source })); event.dataTransfer.effectAllowed = "copyMove";
  };
  const drop = (event: React.DragEvent, destination: string) => {
    event.preventDefault(); setDraggingOver(false);
    try {
      const { id, source } = JSON.parse(event.dataTransfer.getData("application/json"));
      if (source === "deck" && destination === "library") remove(id);
      if (source === "library" && destination === "deck") {
        const card = [...allCards, ...collection.map(c => c.card)].find(c => c.id === id);
        if (card) add(card);
      }
    } catch { /* Only this editor's card drags are accepted. */ }
  };
  if (status === "loading" || loading) return <GameShell section={en ? "Workshop" : "Taller de mazos"}><CommandLoading /></GameShell>;
  if (error) return <GameShell section={en ? "Workshop" : "Taller de mazos"}><CommandError message={error} retry={() => setRetry(v => v + 1)} /></GameShell>;
  if (!session) return null;
  const saveLabel = saving ? (en ? "Saving…" : "Guardando…") : en ? "Save deck" : "Guardar mazo";
  return (
    <GameShell section={en ? "Workshop" : "Taller de mazos"} workshop beforeNavigate={() => !dirty || confirm(en ? "Leave without saving?" : "¿Salir sin guardar los cambios?")}>
    <div className="deck-workshop era-stage min-h-screen text-slate-200">
      <header className="deck-workshop-header">
        <div className="min-w-0 flex-1"><p className="era-kicker">{en ? "Deck workshop" : "Taller de mazos"}</p><input aria-label={en ? "Deck name" : "Nombre del mazo"} value={name} maxLength={80} disabled={saving} onChange={e => setName(e.target.value)} className="mt-1 w-full max-w-lg truncate border-0 bg-transparent text-xl font-bold text-white outline-none focus:ring-1 focus:ring-cyan-300/40" /></div>
        <div className="text-right text-xs"><p className={dirty ? "text-amber-300" : "text-emerald-300"}>{dirty ? (en ? "Unsaved changes" : "Cambios sin guardar") : (en ? "Up to date" : "Guardado")}</p><p className="mt-1 text-slate-500">{mainCount + manaCount} {en ? "total cards" : "cartas en total"}</p></div>
      </header>
      <div className="deck-workshop-layout">
        <section className="deck-library era-panel" onDragOver={e => e.preventDefault()} onDrop={e => drop(e, "library")}>
          <div className="deck-library-tools">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex gap-1 rounded-xl bg-slate-950/70 p-1">{(["cards", "mana"] as const).map(value => <button key={value} type="button" onClick={() => { setTab(value); setFilters(EMPTY_FILTERS); }} className={"rounded-lg px-4 py-2 text-sm font-semibold " + (tab === value ? "bg-cyan-300/15 text-cyan-200" : "text-slate-400 hover:text-white")}>{value === "cards" ? (en ? "My collection" : "Mi colección") : (en ? "Mana cards" : "Cartas de maná")}</button>)}</div>
              <p className="text-xs text-slate-500">{visible.length} {en ? "results" : "resultados"} · {en ? "Use + or drag into the deck" : "Usa + o arrastra al mazo"}</p>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
              <input aria-label={en ? "Find a card" : "Buscar una carta"} placeholder={en ? "Find a card or effect…" : "Busca una carta o un efecto…"} value={filters.search} onChange={e => updateFilter("search", e.target.value)} className="deck-filter col-span-2" />
              <select aria-label="Elemento" value={filters.element} onChange={e => updateFilter("element", e.target.value)} className="deck-filter"><option value="">{en ? "All elements" : "Todos los elementos"}</option>{Object.entries(ELEMENTS).map(([key, icon]) => <option key={key} value={key}>{icon} {key}</option>)}</select>
              {tab === "cards" ? <select aria-label="Tipo de carta" value={filters.type} onChange={e => updateFilter("type", e.target.value)} className="deck-filter"><option value="">{en ? "All card types" : "Todos los tipos"}</option>{["CRIATURA", "HECHIZO", "ALTERADOR"].map(type => <option key={type} value={type}>{TYPE_NAMES[type]}</option>)}</select> : <select aria-label="Tipo de maná" value={filters.rarity} onChange={e => updateFilter("rarity", e.target.value)} className="deck-filter"><option value="">Todo el maná</option><option value="COMUN">Básico · ilimitado</option><option value="LEGENDARIA">Legendario</option><option value="CELESTIAL">Celestial</option></select>}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
              <label className="flex items-center gap-2 text-slate-400"><input type="checkbox" checked={filters.available} onChange={e => updateFilter("available", e.target.checked)} className="accent-cyan-300" />{en ? "Available copies only" : "Solo copias disponibles"}</label>
              <details className="relative"><summary className="cursor-pointer text-cyan-200">{en ? "More filters" : "Más filtros"}</summary><div className="deck-advanced-filters">
                {tab === "cards" && <select aria-label="Rareza" className="deck-filter" value={filters.rarity} onChange={e => updateFilter("rarity", e.target.value)}><option value="">Todas las rarezas</option>{Object.keys(LIMITS).map(r => <option key={r}>{r}</option>)}</select>}
                <select aria-label="Costo" className="deck-filter" value={filters.cost} onChange={e => updateFilter("cost", e.target.value)}><option value="">Cualquier costo</option>{["0", "1", "2", "3", "4", "5", "6+"].map(c => <option key={c} value={c}>{c} maná</option>)}</select>
                <select aria-label="Subtipo" className="deck-filter" value={filters.subtype} onChange={e => updateFilter("subtype", e.target.value)}><option value="">Todos los subtipos</option>{[...new Set(library.flatMap(c => c.subtypes))].sort().map(s => <option key={s} value={s}>{getSubtypeLabel(s, language)}</option>)}</select>
              </div></details>
              <button type="button" onClick={() => setFilters(EMPTY_FILTERS)} className="text-slate-500 hover:text-white">{en ? "Clear" : "Limpiar"}</button>
              <select aria-label="Ordenar cartas" value={filters.sort} onChange={e => updateFilter("sort", e.target.value)} className="ml-auto rounded-lg border border-white/10 bg-slate-950 px-2 py-1.5 text-slate-300"><option value="cost">Costo: menor primero</option><option value="name">Nombre</option><option value="rarity">Rareza</option></select>
            </div>
          </div>
          <div className="deck-library-scroll">
            {visible.length ? <div className="deck-card-grid">{visible.map(card => {
              const reason = addReason(card), qty = quantities.get(card.id) ?? 0, appearance = getCardAppearance(card);
              return <article key={card.id} draggable={!saving} onDragStart={e => dragStart(e, card, "library")} style={appearance.style} data-card-type={card.cardType} data-rarity={card.rarity} className={"deck-library-card themed-card " + (qty ? "in-deck" : "")}>
                <button type="button" onClick={() => setSelected(card)} className="block w-full text-left" aria-label={(en ? "Inspect " : "Ver ") + translateCardName(card.name)}>
                  <div className="deck-card-art"><CardArt card={card} /><span className="deck-rarity-mark" title={appearance.rarity[en ? "en" : "es"]}>{appearance.rarity.icon} {appearance.rarity[en ? "en" : "es"]}</span><span className="deck-cost">{ELEMENTS[card.attribute]} {card.cost}</span>{qty > 0 && <span className="deck-copy-badge">{qty} {en ? "in deck" : "en mazo"}</span>}</div>
                  <div className="px-3 pt-3"><h3 className={"line-clamp-2 min-h-9 text-xs font-bold leading-4 " + getRarityTextColor(card.rarity)}>{translateCardName(card.name)}</h3><p className="deck-card-type-line"><span className="card-type-badge">{appearance.type.icon} {appearance.type[en ? "en" : "es"]}</span> {card.cardType === "CRIATURA" ? "· " + card.attack + " / " + card.defense : ""}</p></div>
                </button>
                <div className="flex items-center justify-between gap-2 p-3"><span className="text-[10px] text-slate-400">{land(card) && card.rarity === "COMUN" ? (en ? "Unlimited basic mana" : "Maná básico ilimitado") : (owned.get(card.id) ?? 0) - qty + (en ? " available" : " disponibles")}</span><button type="button" disabled={Boolean(reason) || saving} title={reason || (en ? "Add a copy" : "Añadir una copia")} aria-label={(en ? "Add " : "Añadir ") + card.name} onClick={() => add(card)} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-cyan-300/15 text-lg font-bold text-cyan-200 transition hover:bg-cyan-300/30 disabled:cursor-not-allowed disabled:opacity-25">+</button></div>
              </article>;
            })}</div> : <div className="grid min-h-52 place-items-center p-8 text-center"><div><p className="text-sm text-slate-300">{en ? "No matching cards." : "No hay cartas con estos filtros."}</p><button onClick={() => setFilters(EMPTY_FILTERS)} className="mt-3 text-xs text-cyan-200">{en ? "Clear filters" : "Limpiar filtros"}</button></div></div>}
          </div>
        </section>
        <aside className={"deck-roster era-panel " + (draggingOver ? "drop-active" : "")} onDragOver={e => { e.preventDefault(); setDraggingOver(true); }} onDragLeave={e => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDraggingOver(false); }} onDrop={e => drop(e, "deck")}>
          <div className="border-b border-white/10 p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2"><h2 className="font-bold text-white">{en ? "Your deck" : "Tu mazo"}</h2><span className="text-[10px] text-slate-500">{mainCount + manaCount} {en ? "cards" : "cartas"}</span></div>
              <button type="button" onClick={clearDeck} disabled={saving || !entries.length}
                title={en ? "Remove all cards and mana to start again" : "Quitar todas las cartas y el maná para empezar de nuevo"}
                className="rounded-lg border border-rose-300/20 bg-rose-300/5 px-2.5 py-1.5 text-[10px] font-semibold text-rose-200 transition hover:border-rose-300/40 hover:bg-rose-300/10 disabled:cursor-not-allowed disabled:opacity-30">
                {en ? "Empty deck" : "Vaciar mazo"}
              </button>
            </div>
            {clearedEntries && <div className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-cyan-300/20 bg-cyan-300/5 px-3 py-2">
              <p role="status" className="text-[11px] text-slate-300">{en ? "Deck emptied. Your cards are in your collection." : "Mazo vacío. Tus cartas siguen en la colección."}</p>
              <button type="button" onClick={undoClearDeck} disabled={saving} className="text-xs font-semibold text-cyan-200 underline underline-offset-4 hover:text-white disabled:opacity-40">{en ? "Undo" : "Deshacer"}</button>
            </div>}
            <div className="mt-4 grid grid-cols-2 gap-3"><div><div className="flex justify-between text-xs"><span className="text-slate-400">{en ? "Main deck" : "Cartas principales"}</span><b className={mainCount >= 40 ? "text-emerald-300" : "text-amber-300"}>{mainCount}/40–50</b></div><div className="mt-2 h-1.5 rounded bg-white/5"><div className="h-full rounded bg-cyan-300" style={{ width: Math.min(100, mainCount / 40 * 100) + "%" }} /></div></div><div><div className="flex justify-between text-xs"><span className="text-slate-400">Maná</span><b className="text-cyan-200">{manaCount}/24</b></div><div className="mt-2 h-1.5 rounded bg-white/5"><div className="h-full rounded bg-amber-300" style={{ width: manaCount / 24 * 100 + "%" }} /></div></div></div>
            <button type="button" disabled={saving || manaCount >= 24} onClick={autoMana} className="mt-4 w-full rounded-xl border border-amber-300/20 bg-amber-300/5 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-300/10 disabled:opacity-30">✦ {en ? "Add suggested mana" : "Añadir maná sugerido"}</button>
          </div>
          <div className="deck-roster-scroll">
            {["CRIATURA", "HECHIZO", "ALTERADOR", "MANA"].map(type => {
              const cards = entries.filter(e => type === "MANA" ? land(e.card) : e.card.cardType === type).sort((a, b) => a.card.cost - b.card.cost || a.card.name.localeCompare(b.card.name));
              if (!cards.length) return null;
              return <section key={type} className="mb-4"><h3 className="mb-2 flex justify-between px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500"><span>{TYPE_NAMES[type]}</span><span>{cards.reduce((sum, e) => sum + e.quantity, 0)}</span></h3>{cards.map(entry => <div key={entry.card.id} draggable={!saving} onDragStart={e => dragStart(e, entry.card, "deck")} style={getCardAppearance(entry.card).style} data-card-type={entry.card.cardType} className="deck-roster-row themed-roster-row"><button type="button" className="flex min-w-0 flex-1 items-center gap-2 text-left" onClick={() => setSelected(entry.card)}><div className="h-10 w-8 shrink-0 overflow-hidden rounded"><CardArt card={entry.card} /></div><span className="min-w-0"><span className="block truncate text-[11px] font-medium text-slate-200">{translateCardName(entry.card.name)}</span><span className="text-[9px] text-slate-500">{ELEMENTS[entry.card.attribute]} {entry.card.cost} maná</span></span></button><div className="flex shrink-0 items-center gap-1"><button type="button" aria-label={"Quitar " + entry.card.name} disabled={saving} onClick={() => remove(entry.card.id)} className="deck-quantity-button">−</button><b className="w-5 text-center text-xs text-white">{entry.quantity}</b><button type="button" aria-label={"Añadir " + entry.card.name} title={addReason(entry.card)} disabled={Boolean(addReason(entry.card)) || saving} onClick={() => add(entry.card)} className="deck-quantity-button">+</button></div></div>)}</section>;
            })}
            {!entries.length && <div className="py-12 text-center"><p className="text-3xl text-cyan-200/30">＋</p><p className="mt-3 text-sm text-slate-400">{en ? "Your strategy starts here" : "Tu estrategia empieza aquí"}</p><p className="mt-2 text-xs leading-5 text-slate-500">{en ? "Add cards from your collection, then add mana." : "Añade cartas de tu colección y después completa el maná."}</p></div>}
          </div>
          <div className="border-t border-white/10 p-4">
            <details><summary className="cursor-pointer text-xs text-slate-400">{en ? "Mana curve and notes" : "Curva de maná y notas"} · {average} {en ? "average" : "promedio"}</summary><div className="mt-3 flex h-20 items-end gap-2">{curve.map((count, i) => <div key={i} className="flex flex-1 flex-col items-center gap-1 text-[9px] text-slate-500"><span>{count}</span><span className="w-full rounded-t bg-cyan-300/35" style={{ height: Math.max(2, count / Math.max(1, ...curve) * 42) }} /><span>{i === 6 ? "6+" : i}</span></div>)}</div><textarea aria-label="Notas del mazo" rows={2} disabled={saving} value={description} onChange={e => setDescription(e.target.value)} placeholder={en ? "Strategy notes…" : "Notas de tu estrategia…"} className="deck-filter mt-3 w-full resize-none" /></details>
            <p className={"mt-3 text-xs leading-5 " + (valid ? "text-emerald-300" : "text-amber-200")}>{mainCount < 40 ? (en ? "Add " : "Añade ") + (40 - mainCount) + (en ? " more main-deck cards." : " cartas principales más.") : !name.trim() ? (en ? "Give your deck a name." : "Ponle un nombre a tu mazo.") : manaCount < 12 ? (en ? "Ready. Consider adding more mana." : "Listo. Considera añadir más maná.") : (en ? "Ready to save and battle." : "Listo para guardar y entrar a la batalla.")}</p>
            <p role="status" aria-live="polite" className="mt-1 text-xs text-cyan-200">{notice}</p>
            <button type="button" onClick={() => void save()} disabled={!valid || !dirty || saving} className="era-button-primary mt-3 w-full rounded-xl py-3 text-sm font-bold disabled:opacity-35">{saveLabel}</button>
          </div>
        </aside>
      </div>
      {selected && <CardDetail card={selected} quantity={owned.get(selected.id)} deckQuantity={quantities.get(selected.id) ?? 0} onClose={() => setSelected(null)}
        onAdd={!addReason(selected) ? () => add(selected) : undefined} onRemove={(quantities.get(selected.id) ?? 0) > 0 ? () => remove(selected.id) : undefined} disabled={Boolean(addReason(selected))} />}
    </div>
    </GameShell>
  );
}
