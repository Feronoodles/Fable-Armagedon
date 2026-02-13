import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
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
      include: {
        packs: {
          include: {
            packType: true,
          },
        },
      },
    });

    if (!player) {
      return NextResponse.json(
        { message: "Jugador no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({ packs: player.packs });
  } catch (error) {
    console.error("Error obteniendo sobres:", error);
    return NextResponse.json(
      { message: "Error al obtener sobres" },
      { status: 500 }
    );
  }
}