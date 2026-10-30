import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { featuredPackDrops } from "@/lib/packs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
      include: {
        packs: {
          where: { quantity: { gt: 0 } },
          include: {
            packType: true,
          },
        },
      },
    });

    if (!player) {
      return NextResponse.json({ message: "Jugador no encontrado" }, { status: 404 });
    }

    // Obtener todos los tipos de sobres disponibles para comprar
    const shopPacks = await prisma.packType.findMany({
      where: { isActive: true },
    });

    const catalog = await prisma.card.findMany({ select: {
      id: true, name: true, rarity: true, cardType: true, attribute: true, expansionKey: true,
    } });
    const withDrops = <T extends typeof shopPacks[number]>(pack: T) => ({ ...pack, featuredDrops: featuredPackDrops(pack, catalog) });

    return NextResponse.json({
      packs: player.packs.map(pack => ({ ...pack, packType: withDrops(pack.packType) })),
      shopPacks: shopPacks.map(withDrops),
      gold: player.gold,
      gems: player.gems,
    });
  } catch (error) {
    console.error("Error obteniendo sobres:", error);
    return NextResponse.json({ message: "Error al obtener sobres" }, { status: 500 });
  }
}
