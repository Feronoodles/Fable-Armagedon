"use client";

import { useEffect, useState, type CSSProperties } from "react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import { GameShell, CommandHeading, CommandError, CommandLoading } from "@/components/command/GameShell";
import { CommandIcon } from "@/components/command/CommandIcon";
import { useGameResource, gameMutation } from "@/components/command/useGameResource";
import { usePlayer } from "@/components/command/PlayerProvider";
import { ELEMENT_APPEARANCE } from "@/lib/card-appearance";

type Localized = { es: string; en: string };
type Starter = { key: string; name: Localized; description: Localized; difficulty: Localized; focus: Localized; elements: string[]; mainCardCount: number; landCount: number };
export default function StarterDecksPage() {
  const { language } = useI18n(), en = language === "en", locale = en ? "en" : "es", router = useRouter();
  const { data, error, loading, reload } = useGameResource<{ eligible: boolean; starterDecks: Starter[] }>("/api/starter-decks");
  const { refresh } = usePlayer();
  const [claiming, setClaiming] = useState<string | null>(null), [failure, setFailure] = useState("");
  useEffect(() => { if (data && !data.eligible) router.replace("/decks"); }, [data, router]);
  async function claim(key: string) {
    if (claiming) return;
    setClaiming(key); setFailure("");
    try { const result = await gameMutation<{ deck: { id: string } }>("/api/starter-decks", "POST", { key }); refresh(); router.push("/decks/" + result.deck.id); }
    catch (cause) { setFailure(cause instanceof Error ? cause.message : "Error"); setClaiming(null); }
  }
  return <GameShell section={en ? "Starter deck" : "Mazo inicial"}>
    <CommandHeading eyebrow={en ? "Your first command" : "Tu primera orden"} title={en ? "Choose your starting force" : "Elige tu primera fuerza"}>{en ? "Receive a complete deck to begin. Each strategy has its own rhythm; you can refine it in the workshop." : "Recibe un mazo completo para empezar. Cada estrategia tiene su propio ritmo; después podrás ajustarla en el taller."}</CommandHeading>
    {failure && <CommandError message={failure} />}
    {error ? <CommandError message={error} retry={reload} /> : loading || !data?.eligible ? <CommandLoading /> : <div className="command-starter-grid">{data.starterDecks.map(deck => {
      const element = ELEMENT_APPEARANCE[deck.elements[0]] ?? ELEMENT_APPEARANCE.NORMAL;
      return <article className="command-panel command-starter" key={deck.key} style={{ "--deck-color": element.color } as CSSProperties}><div>{deck.elements.map(key => <span className="command-element-tag" key={key} style={{ color: ELEMENT_APPEARANCE[key]?.color }}>{ELEMENT_APPEARANCE[key]?.[locale] ?? key}</span>)}</div><h2>{deck.name[locale]}</h2><p>{deck.description[locale]}</p><dl><div><dt>{en ? "Play style" : "Estilo de juego"}</dt><dd>{deck.focus[locale]}</dd></div><div><dt>{en ? "Difficulty" : "Dificultad"}</dt><dd>{deck.difficulty[locale]}</dd></div><div><dt>{en ? "Main cards" : "Cartas principales"}</dt><dd>{deck.mainCardCount}</dd></div><div><dt>{en ? "Mana sources" : "Fuentes de maná"}</dt><dd>{deck.landCount}</dd></div></dl><button className="command-button is-secondary" disabled={Boolean(claiming)} onClick={() => void claim(deck.key)}>{claiming === deck.key ? (en ? "Preparing…" : "Preparando…") : en ? "Choose this deck" : "Elegir este mazo"}<CommandIcon name="arrow" /></button></article>;
    })}</div>}
  </GameShell>;
}
