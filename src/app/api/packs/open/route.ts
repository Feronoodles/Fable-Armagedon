import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Función para seleccionar una rareza basada en probabilidades
function selectRarity(packType: any): string {
  const random = Math.random() * 100;
  let cumulative = 0;
  
  cumulative += packType.celestialChance;
  if (random <= cumulative) return "CELESTIAL";
  
  cumulative += packType.legendaryChance;
  if (random <= cumulative) return "LEGENDARIA";
  
  cumulative += packType.epicChance;
  if (random <= cumulative) return "EPICA";
  
  cumulative += packType.rareChance;
  if (random <= cumulative) return "RARA";
  
  cumulative += packType.uncommonChance;
  if (random <= cumulative) return "INFRECUENTE";
  
  return "COMUN";
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "No autorizado" },
        { status: 401 }
      );
    }

    const { packId } = await req.json();

    if (!packId) {
      return NextResponse.json(
        { message: "ID de sobre requerido" },
        { status: 400 }
      );
    }

    // Obtener el jugador y el sobre
    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
      include: {
        packs: {
          where: { id: packId },
          include: { packType: true },
        },
      },
    });

    if (!player || player.packs.length === 0) {
      return NextResponse.json(
        { message: "Sobre no encontrado" },
        { status: 404 }
      );
    }

    const playerPack = player.packs[0];
    
    if (playerPack.quantity <= 0) {
      return NextResponse.json(
        { message: "No tienes sobres disponibles" },
        { status: 400 }
      );
    }

    // Generar cartas
    const packType = playerPack.packType;
    const cards: any[] = [];
    const cardsPerPack = packType.cardsPerPack;
    
    // Garantizar al menos 1 rara si el sobre lo indica
    let guaranteedRare = packType.guaranteeRare;
    
    for (let i = 0; i < cardsPerPack; i++) {
      let rarity = selectRarity(packType);
      
      // Si es la última carta y necesitamos garantía rara
      if (i === cardsPerPack - 1 && guaranteedRare && rarity === "COMUN") {
        rarity = "RARA";
      }
      
      // Obtener carta aleatoria de esa rareza
      const cardsOfRarity = await prisma.card.findMany({
        where: { rarity },
      });
      
      if (cardsOfRarity.length > 0) {
        const randomCard = cardsOfRarity[Math.floor(Math.random() * cardsOfRarity.length)];
        cards.push(randomCard);
        
        // Agregar carta al jugador
        await prisma.playerCard.upsert({
          where: {
            playerId_cardId: {
              playerId: player.id,
              cardId: randomCard.id,
            },
          },
          update: {
            quantity: { increment: 1 },
          },
          create: {
            playerId: player.id,
            cardId: randomCard.id,
            quantity: 1,
          },
        });
      }
    }

    // Reducir cantidad de sobres o eliminar si es 0
    if (playerPack.quantity <= 1) {
      await prisma.playerPack.delete({
        where: { id: packId },
      });
    } else {
      await prisma.playerPack.update({
        where: { id: packId },
        data: { quantity: { decrement: 1 } },
      });
    }

    return NextResponse.json({
      message: "¡Sobre abierto exitosamente!",
      cards,
      remainingPacks: playerPack.quantity - 1,
    });
  } catch (error) {
    console.error("Error abriendo sobre:", error);
    return NextResponse.json(
      { message: "Error al abrir sobre" },
      { status: 500 }
    );
  }
}