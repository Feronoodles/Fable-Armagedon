import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  STARTER_DECKS,
  getStarterDeck,
  getStarterDeckCardEntries,
  getStarterDeckLandCount,
  getStarterDeckMainCardCount,
  getStarterDeckTotalCardCount,
} from "@/game-engine/starter-decks";

class StarterDeckError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

type DeckEligibility = {
  deckCards: Array<{
    quantity: number;
    card: { cardType: string };
  }>;
};

const hasPlayableDeck = (decks: DeckEligibility[]) =>
  decks.some((deck) =>
    deck.deckCards
      .filter((deckCard) => deckCard.card.cardType !== "MANA" && deckCard.card.cardType !== "TIERRA")
      .reduce((total, deckCard) => total + deckCard.quantity, 0) >= 40,
  );

const toPublicStarterDeck = (starterDeck: (typeof STARTER_DECKS)[number]) => ({
  key: starterDeck.key,
  name: starterDeck.name,
  description: starterDeck.description,
  difficulty: starterDeck.difficulty,
  focus: starterDeck.focus,
  elements: starterDeck.elements,
  mainCardCount: getStarterDeckMainCardCount(starterDeck),
  landCount: getStarterDeckLandCount(starterDeck),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const player = await prisma.player.findUnique({
      where: { userId: session.user.id },
      select: { id: true, starterDeckKey: true },
    });

    if (!player) {
      return NextResponse.json({ message: "Jugador no encontrado" }, { status: 404 });
    }

    const decks = await prisma.deck.findMany({
      where: { playerId: player.id },
      select: {
        deckCards: {
          select: { quantity: true, card: { select: { cardType: true } } },
        },
      },
    });

    return NextResponse.json({
      starterDecks: STARTER_DECKS.map(toPublicStarterDeck),
      eligible: !hasPlayableDeck(decks),
      claimedDeckKey: player.starterDeckKey,
    });
  } catch (error) {
    console.error("Error obteniendo mazos iniciales:", error);
    return NextResponse.json({ message: "Error al obtener mazos iniciales" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    const body = await req.json();
    const starterDeck = getStarterDeck(body.key);

    if (!starterDeck) {
      return NextResponse.json({ message: "Mazo inicial no válido" }, { status: 400 });
    }

    const deck = await prisma.$transaction(async (tx) => {
      const player = await tx.player.findUnique({
        where: { userId: session.user.id },
        select: { id: true, starterDeckKey: true },
      });

      if (!player) {
        throw new StarterDeckError("Jugador no encontrado", 404);
      }

      const decks = await tx.deck.findMany({
        where: { playerId: player.id },
        select: {
          deckCards: {
            select: { quantity: true, card: { select: { cardType: true } } },
          },
        },
      });

      if (hasPlayableDeck(decks)) {
        throw new StarterDeckError("Ya tienes un mazo listo para jugar", 409);
      }

      const entries = getStarterDeckCardEntries(starterDeck);
      const cards = await tx.card.findMany({
        where: { name: { in: entries.map((entry) => entry.name) } },
      });
      const cardsByName = new Map(cards.map((card) => [card.name, card]));
      const missingCards = entries
        .filter((entry) => !cardsByName.has(entry.name))
        .map((entry) => entry.name);
      const expansionCards = cards
        .filter((card) => card.expansionKey !== "CORE")
        .map((card) => card.name);

      if (missingCards.length > 0) {
        throw new StarterDeckError(
          `Faltan cartas del catálogo: ${missingCards.join(", ")}`,
          500,
        );
      }

      if (expansionCards.length > 0) {
        throw new StarterDeckError(
          `El mazo inicial contiene cartas de expansión: ${expansionCards.join(", ")}`,
          500,
        );
      }

      const createdDeck = await tx.deck.create({
        data: {
          playerId: player.id,
          name: starterDeck.name.es,
          description: starterDeck.description.es,
          isActive: true,
          totalCards: getStarterDeckTotalCardCount(starterDeck),
        },
      });

      for (const entry of entries) {
        const card = cardsByName.get(entry.name)!;

        await tx.playerCard.upsert({
          where: {
            playerId_cardId: {
              playerId: player.id,
              cardId: card.id,
            },
          },
          update: { quantity: { increment: entry.quantity } },
          create: {
            playerId: player.id,
            cardId: card.id,
            quantity: entry.quantity,
          },
        });
      }

      await tx.deckCard.createMany({
        data: entries.map((entry) => ({
          deckId: createdDeck.id,
          cardId: cardsByName.get(entry.name)!.id,
          quantity: entry.quantity,
        })),
      });

      await tx.player.update({
        where: { id: player.id },
        data: { starterDeckKey: starterDeck.key },
      });

      return createdDeck;
    });

    return NextResponse.json({ deck }, { status: 201 });
  } catch (error) {
    if (error instanceof StarterDeckError) {
      return NextResponse.json({ message: error.message }, { status: error.status });
    }

    console.error("Error reclamando mazo inicial:", error);
    return NextResponse.json({ message: "Error al reclamar el mazo inicial" }, { status: 500 });
  }
}
