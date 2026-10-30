"use client";
import { CardArt } from "@/components/cards/CardArt";
import type { Card } from "@/components/cards/CardItem";
import { getCardAppearance } from "@/lib/card-appearance";
import { useI18n } from "@/components/I18nProvider";

export function ArchiveCard({ card, quantity, onClick }: { card: Card; quantity?: number; onClick: () => void }) {
  const { language, translateCardName } = useI18n();
  const en = language === "en", theme = getCardAppearance(card);
  return <button type="button" className={"archive-card" + (quantity === 0 ? " is-unowned" : "")} style={theme.style} onClick={onClick}>
    <div className="archive-art"><CardArt card={card} /><span className="archive-cost" title={en ? "Mana cost" : "Costo de maná"}>{card.cost}</span>{quantity !== undefined && <span className="archive-quantity">{quantity ? "×" + quantity : en ? "Not owned" : "Sin obtener"}</span>}</div>
    <div className="archive-card-body"><span className="archive-rarity">{en ? theme.rarity.en : theme.rarity.es}</span><h3>{translateCardName(card.name)}</h3><div className="archive-card-meta"><span>{en ? theme.type.en : theme.type.es} · {en ? theme.element.en : theme.element.es}</span>{card.cardType === "CRIATURA" && <b>{card.attack ?? 0} / {card.defense ?? 0}</b>}</div></div>
  </button>;
}
