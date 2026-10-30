"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import { GameShell, CommandHeading, CommandError } from "@/components/command/GameShell";
import { useGameResource } from "@/components/command/useGameResource";
import { usePlayer } from "@/components/command/PlayerProvider";
import { CommandIcon } from "@/components/command/CommandIcon";
import { deckCover, mainCount, manaCount, playable, type CommandDeck } from "@/components/command/card-utils";
import { CardArt } from "@/components/cards/CardArt";

export default function MenuPage() {
  const { language } = useI18n(), en = language === "en", router = useRouter();
  const { player, error, refresh } = usePlayer();
  const decks = useGameResource<{ decks: CommandDeck[] }>("/api/decks");
  const starters = useGameResource<{ eligible: boolean }>("/api/starter-decks");
  useEffect(() => { if (starters.data?.eligible) router.replace("/starter-decks"); }, [starters.data, router]);
  const featured = decks.data?.decks.find(deck => deck.isActive && playable(deck)) ?? decks.data?.decks.find(playable);
  const cover = featured && deckCover(featured);
  return <GameShell section={en ? "Headquarters" : "Cuartel"}>
    <CommandHeading eyebrow={en ? "The chronicle continues" : "La crónica continúa"} title={(en ? "Welcome, " : "Bienvenido, ") + (player?.username ?? (en ? "commander" : "comandante")) + "."}>{en ? "Your next victory starts here. Prepare your deck and enter the arena." : "Tu próxima victoria empieza aquí. Prepara tu mazo y entra a la arena."}</CommandHeading>
    {error && <CommandError message={error} retry={refresh} />}
    <div className="command-home-grid">
      <section className="command-hero"><p className="command-eyebrow">{en ? "Single player · Tactical duel" : "Un jugador · Duelo táctico"}</p><h2>{en ? <>The battlefield<br />awaits.</> : <>El campo de<br />batalla te espera.</>}</h2><p>{en ? "Face the Ember Legion. Choose your strategy, command your creatures and master every turn." : "Enfréntate a la Legión de Brasa. Elige tu estrategia, dirige tus criaturas y domina cada turno."}</p><Link className="command-button" href="/battle"><CommandIcon name="swords" />{en ? "Enter the arena" : "Entrar a la arena"}<CommandIcon name="arrow" /></Link><span className="command-hero-note">{en ? "25 life · Turn-based combat · CPU opponent" : "25 de vida · Combate por turnos · Rival CPU"}</span></section>
      <aside className="command-home-side"><section className="command-panel command-featured-deck"><p className="command-eyebrow">{en ? "Your battle plan" : "Tu plan de batalla"}</p>{featured ? <>
        <div className="command-featured-cover">{cover && <CardArt card={cover} />}</div><h2>{featured.name}</h2><p>{mainCount(featured)} {en ? "main cards" : "cartas principales"} · {manaCount(featured)} {en ? "mana" : "maná"}</p><Link className="command-text-link" href={"/decks/" + featured.id}>{en ? "Open in workshop" : "Abrir en el taller"}<CommandIcon name="arrow" width="16" /></Link>
      </> : <><h2>{en ? "Forge your strategy" : "Forja tu estrategia"}</h2><p>{decks.loading ? (en ? "Loading your decks…" : "Cargando tus mazos…") : en ? "Build a deck with at least 40 main cards to begin." : "Prepara un mazo con al menos 40 cartas principales para empezar."}</p><Link className="command-text-link" href="/decks">{en ? "Go to my decks" : "Ir a mis mazos"}<CommandIcon name="arrow" width="16" /></Link></>}</section>
        <div className="command-mini-stats"><div><b>{player?.uniqueCards ?? "—"}</b><span>{en ? "Unique cards" : "Cartas únicas"}</span></div><div><b>{player?.deckCount ?? "—"}</b><span>{en ? "Decks" : "Mazos"}</span></div><div><b>{player?.unopenedPacks ?? "—"}</b><span>{en ? "Unopened packs" : "Sobres por abrir"}</span></div></div>
      </aside>
    </div>
    <section className="command-dispatch"><CommandIcon name="packs" /><div><h2>{en ? "Sleeping Volcano" : "Volcán Dormido"}</h2><p>{en ? "Volcanic dragons, creatures and new ways to ignite your strategy." : "Dragones volcánicos, criaturas y nuevas formas de encender tu estrategia."}</p></div><Link href="/packs" className="command-text-link">{player?.unopenedPacks ? (en ? "Open my packs" : "Abrir mis sobres") : en ? "Explore packs" : "Explorar sobres"}<CommandIcon name="arrow" width="16" /></Link></section>
  </GameShell>;
}
