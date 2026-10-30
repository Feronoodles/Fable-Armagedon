"use client";

import { useEffect, useRef, useState } from "react";
import { getAbilityDescription } from "@/game-engine/ability-text";
import { getAbilityTiming } from "@/game-engine/effect-presentation";
import { ELEMENT_APPEARANCE, getCardAppearance, getShortAbilityTiming } from "@/lib/card-appearance";
import { getSubtypeLabel } from "@/game-engine/subtypes";
import { CardArt } from "./CardArt";
import { useI18n } from "@/components/I18nProvider";
import type { Card } from "./CardItem";

interface CardDetailProps {
  card: Card; onClose: () => void; quantity?: number; deckQuantity?: number;
  onAdd?: () => void; onRemove?: () => void; disabled?: boolean; zIndexClassName?: string;
}

export function CardDetail({ card, onClose, quantity, deckQuantity, onAdd, onRemove, disabled = false, zIndexClassName = "z-50" }: CardDetailProps) {
  const { language, translateCardName, translateCardDescription, translateAbilityDescription, translateAbilityName, translateFlavorText } = useI18n();
  const en = language === "en", locale = en ? "en" : "es";
  const theme = getCardAppearance(card), isMana = card.cardType === "MANA" || card.cardType === "TIERRA";
  const abilities = card.abilities ?? [];
  const dialogRef = useRef<HTMLElement>(null), contentRef = useRef<HTMLDivElement>(null), closeRef = useRef(onClose);
  const [fit, setFit] = useState(0);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    let frame = 0;
    const measure = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const content = contentRef.current, dialog = dialogRef.current;
        if (content && dialog && (content.scrollHeight > content.clientHeight + 1 || dialog.scrollHeight > dialog.clientHeight + 1)) {
          setFit(current => Math.min(3, current + 1));
        }
      });
    };
    const resize = () => { setFit(0); measure(); };
    const observer = new ResizeObserver(measure);
    if (dialogRef.current) observer.observe(dialogRef.current);
    if (contentRef.current) observer.observe(contentRef.current);
    window.addEventListener("resize", resize);
    measure();
    return () => { observer.disconnect(); cancelAnimationFrame(frame); window.removeEventListener("resize", resize); };
  }, [card.id, fit]);
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") { event.preventDefault(); closeRef.current(); }
      if (event.key !== "Tab") return;
      const controls = [...(dialogRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), a[href], [tabindex="0"]') ?? [])]
        .filter(element => element.offsetParent !== null);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => { window.removeEventListener("keydown", onKeyDown); document.body.style.overflow = overflow; if (previousFocus?.isConnected) previousFocus.focus(); };
  }, []);
  return <div className={"card-inspector-backdrop " + zIndexClassName} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <section ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="card-inspector-title" className="card-inspector"
      data-element={card.attribute} data-rarity={card.rarity} data-card-type={isMana ? "MANA" : card.cardType}
      data-ability-count={abilities.length} data-fit={fit} style={theme.style}>
      <header className="inspector-header">
        <div className="min-w-0">
          <div className="inspector-identity-line">
            <span className="card-type-badge"><span aria-hidden="true">{theme.type.icon}</span>{theme.type[locale]}</span>
            <span className="inspector-element-label">{theme.element.icon} {theme.element[locale]}</span>
          </div>
          <h2 id="card-inspector-title">{translateCardName(card.name)}</h2>
        </div>
        <span className="inspector-rarity"><span aria-hidden="true">{theme.rarity.icon}</span>{theme.rarity[locale]}</span>
        <button type="button" onClick={onClose} className="inspector-close" aria-label={en ? "Close card" : "Cerrar carta"}>×</button>
      </header>
      <div ref={contentRef} className="inspector-content">
        <div className="inspector-overview">
          <div className="inspector-art">
            <CardArt card={card} eager />
            <div className="inspector-art-shade" />
            <span className="inspector-cost">{isMana ? theme.type.icon : card.cost}<small>{isMana ? (en ? "SOURCE" : "FUENTE") : (en ? "MANA" : "MANÁ")}</small></span>
            <span className="inspector-rarity-gems" title={theme.rarity[locale]} aria-hidden="true">{Array.from({ length: theme.rarity.rank }, () => "◆").join(" ")}</span>
          </div>
          <div className="inspector-overview-info">
            <div className="inspector-mana-types">
              {(isMana ? card.manaTypes : card.manaTypes.filter(type => type !== "NORMAL" || card.manaTypes.length === 1)).map((type, index) => {
                const element = ELEMENT_APPEARANCE[type] ?? ELEMENT_APPEARANCE.NORMAL;
                return <span key={type + index} style={{ color: element.color }}>{element.icon} {element[locale]}</span>;
              })}
            </div>
            {card.cardType === "CRIATURA" ? <div className="inspector-stats">
              <div><span>⚔ {en ? "ATTACK" : "ATAQUE"}</span><b>{card.attack ?? 0}</b></div>
              <div><span>◇ {en ? "DEFENSE" : "DEFENSA"}</span><b>{card.defense ?? 0}</b></div>
            </div> : <div className="inspector-type-note"><span aria-hidden="true">{theme.type.icon}</span><p>{theme.type.hint[en ? 1 : 0]}</p></div>}
            {card.subtypes.length > 0 && <div className="inspector-subtypes">{card.subtypes.map(subtype => <span key={subtype}>{getSubtypeLabel(subtype, language)}</span>)}</div>}
          </div>
          {card.flavorText && <blockquote className="inspector-flavor">“{translateFlavorText(card.flavorText)}”</blockquote>}
        </div>
        <div className="inspector-rules">
          {card.description && <p className="inspector-description">{translateCardDescription(card.description)}</p>}
          <div className="inspector-rules-title"><h3>{en ? "Abilities & effects" : "Habilidades y efectos"}</h3><span>{abilities.length}</span></div>
          <div className="inspector-abilities" data-many={abilities.length >= 3}>
            {abilities.map((ability, index) => {
              const description = translateAbilityDescription(getAbilityDescription(ability, language));
              return <article className="inspector-ability" key={ability.name + index} data-long={description.length > 240}>
                <div className="inspector-ability-heading"><h4>{translateAbilityName(ability.name)}</h4>
                  <span title={getAbilityTiming(ability.trigger, language)}>{getShortAbilityTiming(ability.trigger, language)}</span></div>
                <p>{description}</p>
              </article>;
            })}
            {!abilities.length && <div className="inspector-no-effects"><span>◇</span><p>{en ? "No additional abilities. Its strength is in its combat stats." : "Sin habilidades adicionales. Su fuerza está en sus estadísticas de combate."}</p></div>}
          </div>
        </div>
      </div>
      <footer className="inspector-footer">
        <div className="inspector-quantities">
          {isMana && card.rarity === "COMUN" ? <span>{en ? "Unlimited basic mana" : "Maná básico ilimitado"}</span> :
            quantity !== undefined && <span>{en ? "Owned" : "En colección"} <b>{quantity}</b></span>}
          {deckQuantity !== undefined && <span>{en ? "In deck" : "En mazo"} <b>{deckQuantity}</b></span>}
        </div>
        <div className="inspector-actions">
          {(onAdd || onRemove) && <>
            <button type="button" onClick={onRemove} disabled={!onRemove || (deckQuantity ?? 0) <= 0} className="inspector-remove">− {en ? "Remove" : "Quitar"}</button>
            <button type="button" onClick={onAdd} disabled={disabled || !onAdd} className="inspector-add">+ {en ? "Add to deck" : "Añadir al mazo"}</button>
          </>}
          <button type="button" onClick={onClose} className="inspector-done">{en ? "Close" : "Cerrar"}</button>
        </div>
      </footer>
    </section>
  </div>;
}
