import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const MIN_NON_LAND_CARDS = 40;
const MAX_NON_LAND_CARDS = 50;
const MAX_TOTAL_LANDS = 24;
const MAX_SPECIAL_LANDS = 5;

type CardWithRarity = { rarity: string; cardType: string; manaTypes: string[] };

function isLandCard(card: CardWithRarity): boolean {
  return card.cardType === "TIERRA" || card.cardType === "MANA";
}

function isBasicLand(card: CardWithRarity): boolean {
  return isLandCard(card) && card.rarity === "COMUN";
}

function isLegendaryLand(card: CardWithRarity): boolean {
  return isLandCard(card) && card.rarity === "LEGENDARIA";
}

function isCelestialLand(card: CardWithRarity): boolean {
  return isLandCard(card) && card.rarity === "CELESTIAL";
}

function isSpecialLand(card: CardWithRarity): boolean {
  return isLegendaryLand(card) || isCelestialLand(card);
}

async function validateSpecialLand(
  playerId: string,
  cardId: string,
  card: CardWithRarity,
  newQuantity: number
): Promise<{ valid: boolean; message?: string }> {
  if (!isSpecialLand(card)) return { valid: true };

  const playerCard = await prisma.playerCard.findFirst({
    where: { playerId, cardId },
  });

  if (!playerCard) {
    return {
      valid: false,
      message: "No tienes esta tierra especial en tu colección",
    };
  }

  if (newQuantity > MAX_SPECIAL_LANDS) {
    return {
      valid: false,
      message: `Solo puedes tener máximo ${MAX_SPECIAL_LANDS} copias de esta tierra especial`,
    };
  }

  if (newQuantity > playerCard.quantity) {
    return {
      valid: false,
      message: `Solo posees ${playerCard.quantity} copia(s) de esta tierra`,
    };
  }

  return { valid: true };
}

export async function POST(
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

    const { cardId, quantity = 1 } = await req.json();

    if (!cardId) {
      return NextResponse.json({ message: "ID de carta requerido" }, { status: 400 });
    }

    const card = await prisma.card.findUnique({ where: { id: cardId } });

    if (!card) {
      return NextResponse.json({ message: "Carta no encontrada" }, { status: 404 });
    }

    const existingDeckCard = deck.deckCards.find((dc) => dc.cardId === cardId);
    const currentQuantity = existingDeckCard?.quantity || 0;
    const newQuantity = currentQuantity + quantity;

    const isLand = isLandCard(card);

    if (isLand) {
      const totalLands = deck.deckCards
        .filter((dc) => isLandCard(dc.card))
        .reduce((sum, dc) => sum + dc.quantity, 0);

      if (totalLands - currentQuantity + newQuantity > MAX_TOTAL_LANDS) {
        return NextResponse.json(
          { message: `Solo puedes tener máximo ${MAX_TOTAL_LANDS} tierras en total` },
          { status: 400 }
        );
      }

      if (isSpecialLand(card)) {
        const validation = await validateSpecialLand(player.id, cardId, card, newQuantity);
        if (!validation.valid) {
          return NextResponse.json({ message: validation.message }, { status: 400 });
        }
      }
    } else {
      const playerCard = await prisma.playerCard.findFirst({
        where: { playerId: player.id, cardId },
        include: { card: true },
      });

      if (!playerCard) {
        return NextResponse.json({ message: "No tienes esta carta en tu colección" }, { status: 400 });
      }

      const rarityLimits: { [key: string]: number } = {
        COMUN: 4,
        INFRECUENTE: 4,
        RARA: 3,
        EPICA: 3,
        LEGENDARIA: 1,
        CELESTIAL: 1,
      };

      const maxAllowed = rarityLimits[playerCard.card.rarity] || 3;

      if (newQuantity > maxAllowed) {
        return NextResponse.json(
          { message: `Solo puedes tener máximo ${maxAllowed} copia(s) de esta carta en el mazo` },
          { status: 400 }
        );
      }

      if (newQuantity > playerCard.quantity) {
        return NextResponse.json(
          { message: `Solo posees ${playerCard.quantity} copia(s) de esta carta` },
          { status: 400 }
        );
      }

      const totalNonLandCards = deck.deckCards
        .filter((dc) => !isLandCard(dc.card))
        .reduce((sum, dc) => sum + dc.quantity, 0);

      if (totalNonLandCards + quantity > MAX_NON_LAND_CARDS) {
        return NextResponse.json(
          { message: `El mazo no puede tener más de ${MAX_NON_LAND_CARDS} cartas (sin contar tierras)` },
          { status: 400 }
        );
      }
    }

    if (existingDeckCard) {
      await prisma.deckCard.update({
        where: { id: existingDeckCard.id },
        data: { quantity: newQuantity },
      });
    } else {
      await prisma.deckCard.create({
        data: { deckId: id, cardId, quantity },
      });
    }

    const updatedTotal = deck.totalCards + quantity;
    await prisma.deck.update({
      where: { id },
      data: { totalCards: updatedTotal },
    });

    return NextResponse.json({ message: "Carta agregada al mazo", totalCards: updatedTotal });
  } catch (error) {
    console.error("Error agregando carta al mazo:", error);
    return NextResponse.json({ message: "Error al agregar carta al mazo" }, { status: 500 });
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
      include: { deckCards: true },
    });

    if (!deck) {
      return NextResponse.json({ message: "Mazo no encontrado" }, { status: 404 });
    }

    const { cardId, quantity = 1 } = await req.json();

    if (!cardId) {
      return NextResponse.json({ message: "ID de carta requerido" }, { status: 400 });
    }

    const deckCard = deck.deckCards.find((dc) => dc.cardId === cardId);

    if (!deckCard) {
      return NextResponse.json({ message: "Esta carta no está en el mazo" }, { status: 404 });
    }

    const newQuantity = deckCard.quantity - quantity;

    if (newQuantity <= 0) {
      await prisma.deckCard.delete({ where: { id: deckCard.id } });
    } else {
      await prisma.deckCard.update({
        where: { id: deckCard.id },
        data: { quantity: newQuantity },
      });
    }

    const updatedTotal = deck.totalCards - quantity;
    await prisma.deck.update({
      where: { id },
      data: { totalCards: updatedTotal },
    });

    return NextResponse.json({ message: "Carta eliminada del mazo", totalCards: updatedTotal });
  } catch (error) {
    console.error("Error eliminando carta del mazo:", error);
    return NextResponse.json({ message: "Error al eliminar carta del mazo" }, { status: 500 });
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
      include: { deckCards: { include: { card: true } } },
    });

    if (!deck) {
      return NextResponse.json({ message: "Mazo no encontrado" }, { status: 404 });
    }

    const { cardId, quantity } = await req.json();

    if (!cardId || quantity === undefined) {
      return NextResponse.json({ message: "ID de carta y cantidad requeridos" }, { status: 400 });
    }

    if (quantity < 0) {
      return NextResponse.json({ message: "La cantidad no puede ser negativa" }, { status: 400 });
    }

    const card = await prisma.card.findUnique({ where: { id: cardId } });

    if (!card) {
      return NextResponse.json({ message: "Carta no encontrada" }, { status: 404 });
    }

    const existingDeckCard = deck.deckCards.find((dc) => dc.cardId === cardId);
    const currentQuantity = existingDeckCard?.quantity || 0;
    const difference = quantity - currentQuantity;

    const isLand = isLandCard(card);

    if (isLand) {
      const totalLands = deck.deckCards
        .filter((dc) => isLandCard(dc.card))
        .reduce((sum, dc) => sum + dc.quantity, 0);

      if (totalLands - currentQuantity + quantity > MAX_TOTAL_LANDS) {
        return NextResponse.json(
          { message: `Solo puedes tener máximo ${MAX_TOTAL_LANDS} tierras en total` },
          { status: 400 }
        );
      }

      if (isSpecialLand(card)) {
        const validation = await validateSpecialLand(player.id, cardId, card, quantity);
        if (!validation.valid) {
          return NextResponse.json({ message: validation.message }, { status: 400 });
        }
      }
    } else {
      const playerCard = await prisma.playerCard.findFirst({
        where: { playerId: player.id, cardId },
        include: { card: true },
      });

      if (!playerCard) {
        return NextResponse.json({ message: "No tienes esta carta en tu colección" }, { status: 400 });
      }

      const rarityLimits: { [key: string]: number } = {
        COMUN: 4,
        INFRECUENTE: 4,
        RARA: 3,
        EPICA: 3,
        LEGENDARIA: 1,
        CELESTIAL: 1,
      };

      const maxAllowed = rarityLimits[playerCard.card.rarity] || 3;

      if (quantity > maxAllowed) {
        return NextResponse.json(
          { message: `Solo puedes tener máximo ${maxAllowed} copia(s) de esta carta en el mazo` },
          { status: 400 }
        );
      }

      if (quantity > playerCard.quantity) {
        return NextResponse.json(
          { message: `Solo posees ${playerCard.quantity} copia(s) de esta carta` },
          { status: 400 }
        );
      }

      const otherNonLandTotal = deck.deckCards
        .filter((dc) => !isLandCard(dc.card) && dc.cardId !== cardId)
        .reduce((sum, dc) => sum + dc.quantity, 0);

      if (otherNonLandTotal + quantity > MAX_NON_LAND_CARDS) {
        return NextResponse.json(
          { message: `El mazo no puede tener más de ${MAX_NON_LAND_CARDS} cartas (sin contar tierras)` },
          { status: 400 }
        );
      }
    }

    if (quantity === 0) {
      if (existingDeckCard) {
        await prisma.deckCard.delete({ where: { id: existingDeckCard.id } });
      }
    } else if (existingDeckCard) {
      await prisma.deckCard.update({
        where: { id: existingDeckCard.id },
        data: { quantity },
      });
    } else {
      await prisma.deckCard.create({
        data: { deckId: id, cardId, quantity },
      });
    }

    const updatedTotal = deck.totalCards + difference;
    await prisma.deck.update({
      where: { id },
      data: { totalCards: updatedTotal },
    });

    return NextResponse.json({ message: "Cantidad actualizada", totalCards: updatedTotal });
  } catch (error) {
    console.error("Error actualizando carta del mazo:", error);
    return NextResponse.json({ message: "Error al actualizar carta del mazo" }, { status: 500 });
  }
}
