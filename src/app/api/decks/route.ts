import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/decks - Obtener todos los mazos del jugador
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }

    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
    });

    if (!player) {
      return NextResponse.json(
        { message: "Jugador no encontrado" },
        { status: 404 }
      );
    }

    const decks = await prisma.deck.findMany({
      where: { playerId: player.id },
      include: {
        deckCards: {
          include: {
            card: true,
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({ decks });
  } catch (error) {
    console.error("Error obteniendo mazos:", error);
    return NextResponse.json(
      { message: "Error al obtener mazos" },
      { status: 500 }
    );
  }
}

// POST /api/decks - Crear un nuevo mazo
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }

    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
    });

    if (!player) {
      return NextResponse.json(
        { message: "Jugador no encontrado" },
        { status: 404 }
      );
    }

    const { name, description } = await req.json();

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { message: "El nombre del mazo es requerido" },
        { status: 400 }
      );
    }

    // Verificar límite de mazos (opcional, por ejemplo máximo 10 mazos)
    const deckCount = await prisma.deck.count({
      where: { playerId: player.id },
    });

    if (deckCount >= 10) {
      return NextResponse.json(
        { message: "Has alcanzado el límite máximo de mazos (10)" },
        { status: 400 }
      );
    }

    const deck = await prisma.deck.create({
      data: {
        playerId: player.id,
        name: name.trim(),
        description: description?.trim(),
        totalCards: 0,
      },
    });

    return NextResponse.json({ deck }, { status: 201 });
  } catch (error) {
    console.error("Error creando mazo:", error);
    return NextResponse.json(
      { message: "Error al crear mazo" },
      { status: 500 }
    );
  }
}
