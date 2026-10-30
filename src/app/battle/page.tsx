"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import { GameShell, CommandHeading, CommandError, CommandLoading, CommandEmpty } from "@/components/command/GameShell";
import { CommandIcon } from "@/components/command/CommandIcon";
import { useGameResource } from "@/components/command/useGameResource";
import { mainCount, manaCount, playable, deckCover, type CommandDeck } from "@/components/command/card-utils";
import { CardArt } from "@/components/cards/CardArt";
import { CPU_DECK_PROFILE } from "@/game-engine/cpu/deck";

export default function BattlePage() {
  const { language } = useI18n(), en = language === "en", router = useRouter();
  const { data, loading, error, reload } = useGameResource<{ decks: CommandDeck[] }>("/api/decks");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const decks = data?.decks ?? [], valid = decks.filter(playable);
  const selected = valid.find(deck => deck.id === selectedId) ?? valid.find(deck => deck.isActive) ?? valid[0];
  return <GameShell section={en ? "Battle preparation" : "Preparar batalla"}>
    <CommandHeading eyebrow={en ? "Deployment" : "Despliegue"} title={en ? "Choose your strategy" : "Elige tu estrategia"}>{en ? "Select a deck and face the CPU. Check your composition before entering the arena." : "Selecciona un mazo y enfréntate a la CPU. Revisa tu composición antes de entrar a la arena."}</CommandHeading>
    {error ? <CommandError message={error} retry={reload} /> : loading ? <CommandLoading /> : !valid.length ? <CommandEmpty icon="swords" title={en ? "Prepare a battle-ready deck" : "Prepara un mazo para combatir"} action={<Link className="command-button" href="/decks">{en ? "Go to the workshop" : "Ir a mis mazos"}<CommandIcon name="arrow" /></Link>}>{en ? "You need 40–50 main cards and up to 24 mana cards. Complete a deck in the workshop." : "Necesitas entre 40 y 50 cartas principales y hasta 24 de maná. Completa un mazo en el taller."}</CommandEmpty> : <div className="command-prebattle">
      <section><div className="command-results-line"><span>{en ? "Your battle-ready decks" : "Tus mazos listos para combatir"}</span><Link className="command-text-link" href="/decks">{en ? "Manage decks" : "Gestionar mazos"}</Link></div><div className="command-deck-options" role="group" aria-label={en ? "Choose deck" : "Elegir mazo"}>{valid.map(deck => { const cover = deckCover(deck); return <button className={"command-deck-option" + (selected?.id === deck.id ? " is-selected" : "")} key={deck.id} aria-pressed={selected?.id === deck.id} onClick={() => setSelectedId(deck.id)}><div className="command-deck-thumbnail">{cover && <CardArt card={cover} />}</div><div><h2>{deck.name}</h2><p>{mainCount(deck)} {en ? "main cards" : "cartas principales"} · {manaCount(deck)} {en ? "mana" : "maná"}{deck.isActive ? (en ? " · Preferred" : " · Preferido") : ""}</p></div><span aria-hidden="true" /></button>; })}</div>{decks.length > valid.length && <p className="command-description">{decks.length - valid.length} {en ? "unfinished decks. Complete them in the workshop to use them here." : "mazos incompletos. Termínalos en el taller para usarlos aquí."}</p>}</section>
      <aside className="command-panel command-opponent"><p className="command-eyebrow">{en ? "Your opponent · CPU" : "Tu rival · CPU"}</p><h2>{CPU_DECK_PROFILE.name[en ? "en" : "es"]}</h2><p>{CPU_DECK_PROFILE.description[en ? "en" : "es"]}</p><div className="command-mini-stats"><div><b>25</b><span>{en ? "Starting life" : "Vida inicial"}</span></div><div><b>{CPU_DECK_PROFILE.mainCount}</b><span>{en ? "Main cards" : "Principales"}</span></div><div><b>{CPU_DECK_PROFILE.manaCount}</b><span>{en ? "Fire mana" : "Maná de Fuego"}</span></div></div><p className="command-description">{en ? "Your deck: " : "Tu mazo: "}<strong>{selected?.name}</strong></p><button className="command-button" disabled={!selected} onClick={() => selected && router.push("/battle/arena?deckId=" + encodeURIComponent(selected.id))}><CommandIcon name="swords" />{en ? "Start battle" : "Comenzar batalla"}<CommandIcon name="arrow" /></button></aside>
    </div>}
  </GameShell>;
}
