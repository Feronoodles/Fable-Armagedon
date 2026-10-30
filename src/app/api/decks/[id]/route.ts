import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MIN_NON_LAND_CARDS = 40;
const MAX_NON_LAND_CARDS = 50;
const MAX_TOTAL_LANDS = 24;
const MAX_SPECIAL_LANDS = 5;

type CardWithRarity = { rarity: string; cardType: string };

function isLandCard(card: CardWithRarity): boolean {
  return card.cardType === "TIERRA" || card.cardType === "MANA";
}

function isBasicLand(card: CardWithRarity): boolean {
  return isLandCard(card) && card.rarity === "COMUN";
}

function isSpecialLand(card: CardWithRarity): boolean {
  return isLandCard(card) && (card.rarity === "LEGENDARIA" || card.rarity === "CELESTIAL");
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
    });

    if (!player) {
      return NextResponse.json({ message: "Jugador no encontrado" }, { status: 404 });
    }

    const deck = await prisma.deck.findFirst({
      where: { id, playerId: player.id },
      include: { deckCards: { include: { card: true } } },
    });

    if (!deck) {
      return NextResponse.json({ message: "Mazo no encontrado" }, { status: 404 });
    }

    return NextResponse.json({ deck });
  } catch (error) {
    console.error("Error obteniendo mazo:", error);
    return NextResponse.json({ message: "Error al obtener mazo" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
    });

    if (!player) {
      return NextResponse.json({ message: "Jugador no encontrado" }, { status: 404 });
    }

    const deck = await prisma.deck.findFirst({
      where: { id, playerId: player.id },
    });

    if (!deck) {
      return NextResponse.json({ message: "Mazo no encontrado" }, { status: 404 });
    }

    const { name, description, isActive, deckCards } = await req.json();

    // Validar y actualizar cartas del deck si se proporcionan
    if (deckCards && Array.isArray(deckCards)) {
      const rarityLimits: { [key: string]: number } = {
        COMUN: 4,
        INFRECUENTE: 4,
        RARA: 3,
        EPICA: 3,
        LEGENDARIA: 1,
        CELESTIAL: 1,
      };

      let totalNonLands = 0;
      let totalLands = 0;
      const specialLandCounts: { [cardId: string]: number } = {};

      // Obtener información de todas las cartas
      const cardIds = deckCards.map((dc: { cardId: string }) => dc.cardId);
      const cards = await prisma.card.findMany({
        where: { id: { in: cardIds } },
      });
      const cardMap = new Map(cards.map((c) => [c.id, c]));

      for (const dc of deckCards) {
        const card = cardMap.get(dc.cardId);
        if (!card) {
          return NextResponse.json(
            { message: `Carta ${dc.cardId} no encontrada` },
            { status: 400 }
          );
        }

        const qty = dc.quantity || 0;

        if (isLandCard(card)) {
          totalLands += qty;

          if (isSpecialLand(card)) {
            specialLandCounts[dc.cardId] = (specialLandCounts[dc.cardId] || 0) + qty;
            if (specialLandCounts[dc.cardId] > MAX_SPECIAL_LANDS) {
              return NextResponse.json(
                { message: `Solo puedes tener máximo ${MAX_SPECIAL_LANDS} copias de ${card.name}` },
                { status: 400 }
              );
            }

            const playerCard = await prisma.playerCard.findFirst({
              where: { playerId: player.id, cardId: dc.cardId },
            });
            if (!playerCard || playerCard.quantity < qty) {
              return NextResponse.json(
                { message: `No tienes suficientes copias de ${card.name} en tu colección` },
                { status: 400 }
              );
            }
          }
        } else {
          totalNonLands += qty;

          const maxAllowed = rarityLimits[card.rarity] || 3;
          if (qty > maxAllowed) {
            return NextResponse.json(
              { message: `Solo puedes tener máximo ${maxAllowed} copias de ${card.name}` },
              { status: 400 }
            );
          }

          const playerCard = await prisma.playerCard.findFirst({
            where: { playerId: player.id, cardId: dc.cardId },
          });
          if (!playerCard || playerCard.quantity < qty) {
            return NextResponse.json(
              { message: `No tienes suficientes copias de ${card.name} en tu colección` },
              { status: 400 }
            );
          }
        }
      }

      if (totalNonLands < MIN_NON_LAND_CARDS) {
        return NextResponse.json(
          { message: `El mazo debe tener al menos ${MIN_NON_LAND_CARDS} cartas (sin contar tierras)` },
          { status: 400 }
        );
      }

      if (totalNonLands > MAX_NON_LAND_CARDS) {
        return NextResponse.json(
          { message: `El mazo no puede tener más de ${MAX_NON_LAND_CARDS} cartas (sin contar tierras)` },
          { status: 400 }
        );
      }

      if (totalLands > MAX_TOTAL_LANDS) {
        return NextResponse.json(
          { message: `Solo puedes tener máximo ${MAX_TOTAL_LANDS} tierras en total` },
          { status: 400 }
        );
      }

      // Eliminar todas las cartas actuales del deck
      await prisma.deckCard.deleteMany({
        where: { deckId: id },
      });

      // Agregar las nuevas cartas
      for (const dc of deckCards) {
        if (dc.quantity > 0) {
          await prisma.deckCard.create({
            data: {
              deckId: id,
              cardId: dc.cardId,
              quantity: dc.quantity,
            },
          });
        }
      }

      // Actualizar total de cartas
      await prisma.deck.update({
        where: { id },
        data: { totalCards: totalNonLands + totalLands },
      });
    }

    // Validar si se va a activar el deck
    if (isActive) {
      const deckWithCards = await prisma.deck.findFirst({
        where: { id, playerId: player.id },
        include: { deckCards: { include: { card: true } } },
      });

      if (deckWithCards) {
        const nonLandCards = deckWithCards.deckCards
          .filter((dc) => !isLandCard(dc.card))
          .reduce((sum, dc) => sum + dc.quantity, 0);

        if (nonLandCards < MIN_NON_LAND_CARDS) {
          return NextResponse.json(
            { message: `El mazo debe tener al menos ${MIN_NON_LAND_CARDS} cartas (sin contar tierras). Actualmente tiene ${nonLandCards}.` },
            { status: 400 }
          );
        }

        await prisma.deck.updateMany({
          where: { playerId: player.id, id: { not: id } },
          data: { isActive: false },
        });
      }
    }

    const updatedDeck = await prisma.deck.update({
      where: { id },
      data: {
        ...(name !== undefined && { name: name.trim() }),
        ...(description !== undefined && { description: description?.trim() }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { deckCards: { include: { card: true } } },
    });

    return NextResponse.json({ deck: updatedDeck });
  } catch (error) {
    console.error("Error actualizando mazo:", error);
    return NextResponse.json({ message: "Error al actualizar mazo" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
    });

    if (!player) {
      return NextResponse.json({ message: "Jugador no encontrado" }, { status: 404 });
    }

    const deck = await prisma.deck.findFirst({
      where: { id, playerId: player.id },
    });

    if (!deck) {
      return NextResponse.json({ message: "Mazo no encontrado" }, { status: 404 });
    }

    await prisma.deck.delete({ where: { id } });

    return NextResponse.json({ message: "Mazo eliminado correctamente" });
  } catch (error) {
    console.error("Error eliminando mazo:", error);
    return NextResponse.json({ message: "Error al eliminar mazo" }, { status: 500 });
  }
}
