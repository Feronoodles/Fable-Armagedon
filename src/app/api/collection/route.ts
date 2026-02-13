import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const rarity = searchParams.get("rarity");
    const cardType = searchParams.get("cardType");
    const attribute = searchParams.get("attribute");
    const subtype = searchParams.get("subtype");

    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
    });

    if (!player) {
      return NextResponse.json(
        { message: "Jugador no encontrado" },
        { status: 404 }
      );
    }

    // Construir filtros
    const whereClause: any = {
      playerId: player.id,
    };

    if (rarity) {
      whereClause.card = {
        rarity: rarity.toUpperCase(),
      };
    }

    if (cardType) {
      whereClause.card = {
        ...whereClause.card,
        cardType: cardType.toUpperCase(),
      };
    }

    if (attribute) {
      whereClause.card = {
        ...whereClause.card,
        attribute: attribute.toUpperCase(),
      };
    }

    if (subtype) {
      whereClause.card = {
        ...whereClause.card,
        subtypes: {
          has: subtype.toUpperCase(),
        },
      };
    }

    const playerCards = await prisma.playerCard.findMany({
      where: whereClause,
      include: {
        card: true,
      },
      orderBy: {
        card: {
          rarity: "desc",
        },
      },
    });

    // Obtener todas las cartas disponibles (para mostrar las que no tiene)
    const allCards = await prisma.card.findMany({
      orderBy: {
        rarity: "desc",
      },
    });

    return NextResponse.json({
      collection: playerCards,
      allCards,
      totalUnique: playerCards.length,
      totalCards: playerCards.reduce((sum, pc) => sum + pc.quantity, 0),
    });
  } catch (error) {
    console.error("Error obteniendo colección:", error);
    return NextResponse.json(
      { message: "Error al obtener colección" },
      { status: 500 }
    );
  }
}