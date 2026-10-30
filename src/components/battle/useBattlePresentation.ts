import { useEffect, useState } from "react";
import { useGameStore } from "@/stores/gameStore";

export function useBattlePresentation() {
  const frame = useGameStore(s => s.presentationQueue[0]);
  const enable = useGameStore(s => s.setPresentationEnabled);
  const finish = useGameStore(s => s.finishPresentation);
  const [paused, setPaused] = useState(false);
  useEffect(() => { enable(true); return () => enable(false); }, [enable]);
  useEffect(() => {
    if (!frame || paused) return;
    const timer = setTimeout(() => finish(frame.id), frame.durationMs);
    return () => clearTimeout(timer);
  }, [frame, paused, finish]);
  return { frame, paused, togglePause: () => setPaused(value => !value) };
}
