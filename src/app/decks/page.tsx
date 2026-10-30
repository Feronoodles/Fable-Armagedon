"use client";

import { useState, type CSSProperties } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import { GameShell, CommandHeading, CommandLoading, CommandEmpty, CommandError } from "@/components/command/GameShell";
import { useGameResource, gameMutation } from "@/components/command/useGameResource";
import { usePlayer } from "@/components/command/PlayerProvider";
import { CommandDialog } from "@/components/command/CommandDialog";
import { CommandIcon } from "@/components/command/CommandIcon";
import { deckCover, mainCount, manaCount, playable, cleanText, type CommandDeck } from "@/components/command/card-utils";
import { CardArt } from "@/components/cards/CardArt";
import { ELEMENT_APPEARANCE } from "@/lib/card-appearance";

export default function DecksPage() {
  const { language } = useI18n(), en = language === "en", router = useRouter();
  const { data, loading, error, reload } = useGameResource<{ decks: CommandDeck[] }>("/api/decks");
  const { refresh } = usePlayer();
  const [search, setSearch] = useState(""), [creating, setCreating] = useState(false), [name, setName] = useState("");
  const [deleting, setDeleting] = useState<CommandDeck | null>(null), [busy, setBusy] = useState(false), [message, setMessage] = useState("");
  const decks = (data?.decks ?? []).filter(deck => cleanText(deck.name).includes(cleanText(search)));
  async function create(event: React.FormEvent) {
    event.preventDefault(); if (busy || !name.trim()) return;
    setBusy(true); setMessage("");
    try { const result = await gameMutation<{ deck: CommandDeck }>("/api/decks", "POST", { name: name.trim() }); refresh(); router.push("/decks/" + result.deck.id); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : "Error"); setBusy(false); }
  }
  async function remove() {
    if (!deleting || busy) return;
    setBusy(true); setMessage("");
    try { await gameMutation("/api/decks/" + deleting.id, "DELETE"); setDeleting(null); reload(); refresh(); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : "Error"); }
    finally { setBusy(false); }
  }
  async function activate(deck: CommandDeck) {
    if (busy) return;
    setBusy(true); setMessage("");
    try { await gameMutation("/api/decks/" + deck.id, "PUT", { isActive: true }); reload(); }
    catch (cause) { setMessage(cause instanceof Error ? cause.message : "Error"); }
    finally { setBusy(false); }
  }
  const newButton = <button className="command-button" disabled={(data?.decks.length ?? 0) >= 10} onClick={() => { setMessage(""); setName(""); setCreating(true); }}><CommandIcon name="plus" />{en ? "Create deck" : "Crear mazo"}</button>;
  return <GameShell section={en ? "My decks" : "Mis mazos"}>
    <CommandHeading eyebrow={en ? "The war room" : "La sala de guerra"} title={en ? "Your strategies" : "Tus estrategias"} action={newButton}>{en ? "Build, refine and prepare your next battle. Your preferred deck is selected first in the arena." : "Construye, ajusta y prepara tu próxima batalla. Tu mazo preferido se selecciona primero en la arena."}</CommandHeading>
    {!creating && !deleting && message && <CommandError message={message} />}
    <div className="command-toolbar"><div className="command-search"><CommandIcon name="search" /><input className="command-input" aria-label={en ? "Find a deck" : "Buscar un mazo"} placeholder={en ? "Find a strategy…" : "Buscar una estrategia…"} value={search} onChange={event => setSearch(event.target.value)} /></div><span className="command-description">{data?.decks.length ?? 0} / 10 {en ? "decks" : "mazos"}</span></div>
    {error ? <CommandError message={error} retry={reload} /> : loading ? <CommandLoading /> : decks.length ? <div className="command-deck-grid">{decks.map(deck => {
      const cover = deckCover(deck), valid = playable(deck), color = ELEMENT_APPEARANCE[cover?.attribute ?? "NORMAL"]?.color;
      return <article key={deck.id} className="command-deck-card" style={{ "--deck-color": color } as CSSProperties}><div className="command-deck-cover">{cover ? <CardArt card={cover} /> : <CommandIcon name="decks" />}<span className="command-deck-badge">{deck.isActive ? (en ? "Preferred deck" : "Mazo preferido") : valid ? (en ? "Ready for battle" : "Listo para combatir") : en ? "In construction" : "En construcción"}</span></div><div className="command-deck-body"><h2>{deck.name}</h2><p>{deck.description || (valid ? (en ? "Your strategy is ready. Refine it in the workshop." : "Tu estrategia está lista. Perfecciónala en el taller.") : en ? "Add at least 40 main cards in the workshop." : "Añade al menos 40 cartas principales en el taller.")}</p><div className="command-deck-counts"><span><b>{mainCount(deck)}</b> {en ? "main" : "principales"}</span><span><b>{manaCount(deck)}</b> {en ? "mana" : "maná"}</span></div><div className="command-deck-actions"><Link href={"/decks/" + deck.id} className="command-button is-secondary is-small">{en ? "Open workshop" : "Abrir taller"}<CommandIcon name="arrow" width="15" /></Link><details className="command-overflow"><summary aria-label={(en ? "Options for " : "Opciones de ") + deck.name}><CommandIcon name="more" /></summary><div className="command-overflow-menu">{!deck.isActive && <button disabled={busy || !valid} onClick={event => { event.currentTarget.closest("details")?.removeAttribute("open"); void activate(deck); }}>{en ? "Set as preferred" : "Usar como preferido"}</button>}<button className="is-danger" disabled={busy} onClick={event => { event.currentTarget.closest("details")?.removeAttribute("open"); setMessage(""); setDeleting(deck); }}>{en ? "Delete deck" : "Eliminar mazo"}</button></div></details></div></div></article>;
    })}</div> : <CommandEmpty title={search ? (en ? "No matching decks" : "No se encontraron mazos") : en ? "Your next strategy starts here" : "Tu próxima estrategia empieza aquí"} action={!search && newButton}>{search ? (en ? "Try a different name." : "Prueba otro nombre.") : en ? "Create a deck and add cards from your collection. Your cards are always kept when deleting a deck." : "Crea un mazo y añade cartas de tu colección. Tus cartas se conservan al eliminar un mazo."}</CommandEmpty>}
    {creating && <CommandDialog title={en ? "A new strategy" : "Una nueva estrategia"} onClose={() => setCreating(false)} busy={busy}><form onSubmit={create}><label className="command-field">{en ? "Deck name" : "Nombre del mazo"}<input autoFocus className="command-input" required maxLength={80} value={name} onChange={event => setName(event.target.value)} placeholder={en ? "Name your strategy" : "Dale un nombre a tu estrategia"} disabled={busy} /></label>{message && <CommandError message={message} />}<button className="command-button" disabled={busy || !name.trim()}>{busy ? (en ? "Creating…" : "Creando…") : en ? "Create and open workshop" : "Crear y abrir taller"}<CommandIcon name="arrow" /></button></form></CommandDialog>}
    {deleting && <CommandDialog title={en ? "Delete this deck?" : "¿Eliminar este mazo?"} onClose={() => setDeleting(null)} busy={busy}><p><strong>{deleting.name}</strong></p><p>{en ? "This removes the deck. All cards stay in your collection." : "Se eliminará el mazo. Todas las cartas se conservan en tu colección."}</p>{message && <CommandError message={message} />}<div className="command-dialog-actions"><button className="command-button is-secondary" disabled={busy} onClick={() => setDeleting(null)}>{en ? "Keep deck" : "Conservar"}</button><button className="command-button is-danger" disabled={busy} onClick={() => void remove()}>{busy ? (en ? "Deleting…" : "Eliminando…") : en ? "Delete deck" : "Eliminar mazo"}</button></div></CommandDialog>}
  </GameShell>;
}
