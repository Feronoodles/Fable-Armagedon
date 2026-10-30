import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    const player = await prisma.player.findUnique({ where: { userId: session.user.id }, select: {
      id: true, username: true, level: true, experience: true, gold: true, gems: true,
      wins: true, losses: true, draws: true, createdAt: true,
      cards: { where: { quantity: { gt: 0 } }, select: { quantity: true } },
      packs: { select: { quantity: true } }, _count: { select: { decks: true } },
    } });
    if (!player) return NextResponse.json({ message: "Jugador no encontrado" }, { status: 404 });
    const catalogSize = await prisma.card.count();
    const { id: _id, cards, packs, _count, ...publicPlayer } = player;
    void _id;
    return NextResponse.json({ player: { ...publicPlayer, catalogSize,
      uniqueCards: cards.length, totalCards: cards.reduce((sum, card) => sum + card.quantity, 0),
      deckCount: _count.decks, unopenedPacks: packs.reduce((sum, pack) => sum + pack.quantity, 0),
    } }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Error obteniendo perfil:", error);
    return NextResponse.json({ message: "No se pudo cargar tu perfil." }, { status: 500 });
  }
}
