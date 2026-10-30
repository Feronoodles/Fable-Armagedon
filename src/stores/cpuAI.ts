import { useEffect } from "react";
import { getCpuManaCardToPlay, getCpuSummonPlan } from "@/game-engine/cpu/decision";
import { useGameStore } from "./gameStore";
import { getPlayRestriction } from "@/game-engine/battle-actions";

export const useCPUAI = () => {
  const turn = useGameStore(s => s.turn), phase = useGameStore(s => s.phase);
  const started = useGameStore(s => s.gameStarted), ended = useGameStore(s => s.gameEnded);
  const pending = useGameStore(s => Boolean(s.pendingEffect || s.pendingDiscard || s.pendingCombatChoice));
  useEffect(() => {
    if (turn !== "CPU" || !started || ended || pending) return;
    let cancelled = false;
    const pause = (ms: number) => new Promise<void>(resolve => setTimeout(resolve, ms));
    const waitForEffects = async () => {
      while (!cancelled && (useGameStore.getState().presentationQueue.length || useGameStore.getState().effectQueue.length)) await pause(50);
    };
    const stillMain = () => !cancelled && useGameStore.getState().turn === "CPU" &&
      useGameStore.getState().phase === "MAIN" && !useGameStore.getState().gameEnded &&
      !useGameStore.getState().pendingEffect && !useGameStore.getState().pendingDiscard;
    const timer = setTimeout(() => {
      void (async () => {
        await waitForEffects();
        if (cancelled) return;
        if (phase === "END") { useGameStore.getState().endTurn(); return; }
        if (phase === "DRAW") return; // The store owns drawing and start-of-turn effects.
        if (phase !== "MAIN" || !stillMain()) return;
        let state = useGameStore.getState();
        const mana = getCpuManaCardToPlay(state.cpu.hand, state.playedManaThisTurn.CPU);
        if (mana) { state.playCard("CPU", mana.instanceId); await pause(650); await waitForEffects(); }
        // Recalculate after each action: payment, sacrifices and draws change the plan.
        const attempted = new Set<string>();
        for (let i = 0; i < 4 && stillMain(); i++) {
          state = useGameStore.getState();
          const next = getCpuSummonPlan(state.cpu.hand.filter(c => !attempted.has(c.instanceId) && !getPlayRestriction(state, "CPU", c)), state.cpu.manaZone, state.cpu.field, state.player)[0];
          if (!next) break;
          attempted.add(next.card.instanceId); state.playCard("CPU", next.card.instanceId, next.position);
          await pause(450);
          await waitForEffects();
        }
        for (const source of useGameStore.getState().cpu.field) {
          if (!stillMain()) return;
          if (source.abilities?.some(a => a.trigger === "ACTIVATED") && !source.activatedThisTurn) {
            useGameStore.getState().activateAbility("CPU", source.instanceId); await pause(450); await waitForEffects();
          }
        }
        if (stillMain()) useGameStore.getState().nextPhase();
      })();
    }, 650);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [turn, phase, started, ended, pending]);
  return {};
};
