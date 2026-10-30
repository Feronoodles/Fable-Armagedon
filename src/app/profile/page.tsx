"use client";

import { signOut, useSession } from "next-auth/react";
import { useI18n } from "@/components/I18nProvider";
import { usePlayer } from "@/components/command/PlayerProvider";
import { GameShell, CommandHeading, CommandLoading, CommandError } from "@/components/command/GameShell";

export default function ProfilePage() {
  const { language, changeLanguage } = useI18n(), en = language === "en";
  const { player, loading, error, refresh } = usePlayer();
  const { data: session } = useSession();
  const progress = player?.catalogSize ? Math.min(100, player.uniqueCards / player.catalogSize * 100) : 0;
  return <GameShell section={en ? "Profile" : "Perfil"}>
    <CommandHeading eyebrow={en ? "Commander record" : "Registro del comandante"} title={en ? "Your profile" : "Tu perfil"}>{en ? "Your collection, your resources and your place in the chronicle." : "Tu colección, tus recursos y tu lugar en la crónica."}</CommandHeading>
    {error ? <CommandError message={error} retry={refresh} /> : loading || !player ? <CommandLoading /> : <div className="command-profile-grid">
      <section className="command-panel command-identity"><div className="command-avatar" aria-hidden="true">{player.username.slice(0, 1).toUpperCase()}</div><p className="command-eyebrow">{en ? "Commander" : "Comandante"}</p><h2>{player.username}</h2><p>{en ? "Level" : "Nivel"} {player.level} · {player.experience.toLocaleString()} EXP</p><p>{en ? "Joined " : "En la crónica desde "}{new Date(player.createdAt).toLocaleDateString(en ? "en-US" : "es-PE", { month: "long", year: "numeric" })}</p><button className="command-text-link" onClick={() => void signOut({ callbackUrl: "/login" })}>{en ? "Sign out" : "Cerrar sesión"}</button></section>
      <div className="command-profile-side"><section className="command-panel"><div className="command-panel-head"><h2>{en ? "Battle record" : "Registro de combate"}</h2><small>{en ? "Recorded results" : "Resultados registrados"}</small></div><div className="command-stat-grid"><div><b>{player.wins}</b><span>{en ? "Wins" : "Victorias"}</span></div><div><b>{player.losses}</b><span>{en ? "Losses" : "Derrotas"}</span></div><div><b>{player.draws}</b><span>{en ? "Draws" : "Empates"}</span></div></div></section>
        <section className="command-panel"><div className="command-panel-head"><h2>{en ? "Collection progress" : "Tu arsenal"}</h2><small>{Math.round(progress)}%</small></div><div className="command-progress-body"><div className="command-progress-label"><span>{en ? "Unique cards" : "Cartas únicas"}</span><b>{player.uniqueCards} / {player.catalogSize}</b></div><div className="command-progress" role="progressbar" aria-label={en ? "Collection progress" : "Progreso de la colección"} aria-valuenow={player.uniqueCards} aria-valuemin={0} aria-valuemax={player.catalogSize}><span style={{ width: progress + "%" }} /></div><dl className="command-profile-facts"><div><dt>{en ? "Total copies" : "Copias totales"}</dt><dd>{player.totalCards}</dd></div><div><dt>{en ? "Decks" : "Mazos"}</dt><dd>{player.deckCount}</dd></div><div><dt>{en ? "Unopened packs" : "Sobres por abrir"}</dt><dd>{player.unopenedPacks}</dd></div></dl></div></section>
        <section className="command-panel command-settings"><div><p>{en ? "Interface language" : "Idioma de la interfaz"}</p><small>{en ? "Account: " : "Cuenta: "}{session?.user?.email}</small></div><select className="command-select" aria-label={en ? "Language" : "Idioma"} value={language} onChange={event => changeLanguage(event.target.value)}><option value="es">Español</option><option value="en">English</option></select></section>
      </div>
    </div>}
  </GameShell>;
}
