"use client";

import { getCardArt } from "@/lib/card-art";

export function CardArt({ card, className = "", eager = false }: {
  card: { name: string; attribute?: string; imageUrl?: string; picture?: string };
  className?: string;
  eager?: boolean;
}) {
  return (
    // Local illustrations are already compressed and sized for card grids.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={getCardArt(card)} alt={card.name} loading={eager ? "eager" : "lazy"} decoding="async"
      draggable={false} className={"h-full w-full object-cover " + className} />
  );
}
