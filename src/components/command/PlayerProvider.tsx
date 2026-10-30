"use client";

import { createContext, useContext } from "react";
import { useGameResource } from "./useGameResource";

export interface PlayerSummary {
  username: string; level: number; experience: number; gold: number; gems: number;
  wins: number; losses: number; draws: number; createdAt: string;
  uniqueCards: number; totalCards: number; deckCount: number; unopenedPacks: number; catalogSize: number;
}
const PlayerContext = createContext<{ player: PlayerSummary | null; loading: boolean; error: string; refresh: () => void } | null>(null);
export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const { data, loading, error, reload } = useGameResource<{ player: PlayerSummary }>("/api/player");
  return <PlayerContext.Provider value={{ player: data?.player ?? null, loading, error, refresh: reload }}>{children}</PlayerContext.Provider>;
}
export function usePlayer() {
  const value = useContext(PlayerContext);
  if (!value) throw new Error("PlayerProvider is required");
  return value;
}
