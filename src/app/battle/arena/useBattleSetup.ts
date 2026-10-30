import { useCallback, useEffect, useRef, useState } from "react";
import { generateCpuDeck } from "@/game-engine/cpu/deck";
import { CardDefinition } from "@/game-engine/types";

type DeckCard = CardDefinition;

export function useBattleSetup({
  status,
  session,
  deckId,
  gameStarted,
  language,
  startGame,
  onUnauthenticated,
  onMissingDeck,
}: {
  status: string;
  session: unknown;
  deckId: string | null;
  gameStarted: boolean;
  language: string;
  startGame: (playerDeck: DeckCard[], cpuDeck: DeckCard[]) => void;
  onUnauthenticated: () => void;
  onMissingDeck: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestKeyRef = useRef<string | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  const loadDeckAndStart = useCallback(
    async (force = false) => {
      if (!deckId) return;

      const requestKey = `${deckId}:${language}`;
      if (!force && requestKeyRef.current === requestKey) return;

      requestKeyRef.current = requestKey;
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      let timedOut = false;
      let started = false;
      const timeoutId = setTimeout(() => {
        timedOut = true;
        controller.abort();
      }, 12000);

      try {
        setLoading(true);
        setError(null);

        const [deckRes, allCardsRes] = await Promise.all([
          fetch(`/api/decks/${deckId}`, { signal: controller.signal }),
          fetch("/api/collection", { signal: controller.signal }),
        ]);

        if (!deckRes.ok) {
          throw new Error(language === "en" ? "Could not load deck" : "No se pudo cargar el mazo");
        }

        const deckData = await deckRes.json();
        const allCardsData = allCardsRes.ok ? await allCardsRes.json() : { allCards: [] };

        if (!deckData.deck?.deckCards || !Array.isArray(deckData.deck.deckCards)) {
          throw new Error(language === "en" ? "The selected deck is invalid" : "El mazo seleccionado no es valido");
        }

        const playerDeck: DeckCard[] = [];
        deckData.deck.deckCards.forEach((deckCard: { card: DeckCard; quantity: number }) => {
          for (let index = 0; index < deckCard.quantity; index++) {
            playerDeck.push({ ...deckCard.card, id: `${deckCard.card.id}-${index}` });
          }
        });

        const cardPool = (allCardsData.allCards || allCardsData.cards || []) as DeckCard[];
        const cpuDeck = generateCpuDeck(cardPool);
        startGame(playerDeck, cpuDeck);
        started = true;
      } catch (err: unknown) {
        if (controller.signal.aborted && !timedOut) return;
        const message = err instanceof Error
          ? err.message
          : language === "en"
            ? "Could not load battle"
            : "No se pudo cargar la batalla";
        setError(
          timedOut
            ? language === "en"
              ? "Battle loading timed out"
              : "La carga de batalla tardo demasiado"
            : message,
        );
      } finally {
        clearTimeout(timeoutId);
        const isCurrentRequest = requestKeyRef.current === requestKey;
        if (controllerRef.current === controller) controllerRef.current = null;
        if (isCurrentRequest) {
          if (!started) requestKeyRef.current = null;
          setLoading(false);
        }
      }
    },
    [deckId, language, startGame],
  );

  useEffect(() => {
    if (status === "unauthenticated") onUnauthenticated();
  }, [status, onUnauthenticated]);

  useEffect(() => {
    if (status === "authenticated" && session && deckId && !gameStarted) {
      void loadDeckAndStart();
    } else if (status === "authenticated" && session && !deckId) {
      onMissingDeck();
    }
  }, [status, session, deckId, gameStarted, loadDeckAndStart, onMissingDeck]);

  return { loading, error, loadDeckAndStart };
}
