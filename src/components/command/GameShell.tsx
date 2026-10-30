"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useI18n } from "@/components/I18nProvider";
import { usePlayer } from "./PlayerProvider";
import { CommandIcon, type CommandIconName } from "./CommandIcon";

const NAV: { href: string; icon: CommandIconName; es: string; en: string }[] = [
  { href: "/menu", icon: "citadel", es: "Cuartel", en: "Headquarters" },
  { href: "/decks", icon: "decks", es: "Mis mazos", en: "My decks" },
  { href: "/collection", icon: "collection", es: "Colección", en: "Collection" },
  { href: "/packs", icon: "packs", es: "Sobres", en: "Packs" },
  { href: "/profile", icon: "profile", es: "Perfil", en: "Profile" },
];
export function GameShell({ children, section, workshop = false, beforeNavigate }: {
  children: React.ReactNode; section: string; workshop?: boolean; beforeNavigate?: () => boolean;
}) {
  const pathname = usePathname(), router = useRouter();
  const { status } = useSession();
  const { language } = useI18n();
  const en = language === "en";
  const { player } = usePlayer();
  const number = (value?: number) => value === undefined ? "—" : value.toLocaleString(en ? "en-US" : "es-ES");
  useEffect(() => { if (status === "unauthenticated") router.replace("/login"); }, [status, router]);
  const guard = (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (beforeNavigate && !beforeNavigate()) event.preventDefault();
  };
  return <div className={"command-shell" + (workshop ? " command-shell--workshop" : "")}>
    <a href="#command-content" className="command-skip">{en ? "Skip to content" : "Ir al contenido"}</a>
    <aside className="command-rail">
      <Link href="/menu" onClick={guard} className="command-brand" aria-label="Fable Armageddon · Cuartel"><CommandIcon name="citadel" /><span>FABLE<small>ARMAGEDDON</small></span></Link>
      <p className="command-rail-label">{en ? "Command center" : "Centro de mando"}</p>
      <nav aria-label={en ? "Main navigation" : "Navegación principal"}>{NAV.map((item, index) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/") || item.href === "/menu" && pathname === "/battle";
        return <Link key={item.href} href={item.href} onClick={guard} aria-current={active ? "page" : undefined} className={"command-nav-link" + (active ? " is-active" : "")}><CommandIcon name={item.icon} /><span>{en ? item.en : item.es}</span><small>0{index + 1}</small></Link>;
      })}</nav>
      <div className="command-rail-bottom"><span className="command-insignia">FA</span><p>{en ? "Forge your legacy." : "Forja tu legado."}<small>{en ? "One deck. Infinite possibilities." : "Un mazo. Infinitas posibilidades."}</small></p></div>
    </aside>
    <div className="command-main">
      <header className="command-topbar"><div className="command-breadcrumb"><span>FABLE ARMAGEDDON</span><b>/</b><strong>{section}</strong></div>
        <div className="command-wallet" aria-label={en ? "Your resources" : "Tus recursos"}>
          <span className="command-gold" title={en ? "Gold" : "Oro"}><CommandIcon name="gold" /><b>{number(player?.gold)}</b><small>{en ? "Gold" : "Oro"}</small></span>
          <span className="command-gems" title={en ? "Gems" : "Gemas"}><CommandIcon name="gems" /><b>{number(player?.gems)}</b><small>{en ? "Gems" : "Gemas"}</small></span>
        </div>
        <Link className="command-account" href="/profile" onClick={guard}><span>{player?.username?.slice(0, 1).toUpperCase() ?? "F"}</span><div>{player?.username ?? (en ? "Player" : "Jugador")}<small>{en ? "Level" : "Nivel"} {player?.level ?? "—"}</small></div></Link>
      </header>
      <main id="command-content" className="command-content" tabIndex={-1}>{status === "authenticated" ? children : <CommandLoading />}</main>
      {!workshop && <footer className="command-footer"><span>FABLE ARMAGEDDON</span><span>{en ? "Prepare. Adapt. Conquer." : "Prepara. Adapta. Conquista."}</span></footer>}
    </div>
  </div>;
}
export function CommandHeading({ eyebrow, title, children, action }: { eyebrow?: string; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return <header className="command-heading"><div>{eyebrow && <p className="command-eyebrow">{eyebrow}</p>}<h1>{title}</h1>{children && <p className="command-description">{children}</p>}</div>{action && <div className="command-heading-action">{action}</div>}</header>;
}
export function CommandLoading() {
  const { language } = useI18n();
  return <div className="command-loading" role="status"><span /><p>{language === "en" ? "Preparing the command center…" : "Preparando el centro de mando…"}</p></div>;
}
export function CommandError({ message, retry }: { message: string; retry?: () => void }) {
  const { language } = useI18n();
  return <div role="alert" className="command-notice is-error"><p>{message}</p>{retry && <button type="button" className="command-button is-secondary" onClick={retry}>{language === "en" ? "Retry" : "Reintentar"}</button>}</div>;
}
export function CommandEmpty({ icon = "decks", title, children, action }: { icon?: CommandIconName; title: string; children?: React.ReactNode; action?: React.ReactNode }) {
  return <div className="command-empty"><CommandIcon name={icon} /><h2>{title}</h2><p>{children}</p>{action}</div>;
}
