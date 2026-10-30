"use client";

import { useRef, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import { ActionMenu } from "@/components/battle/ActionMenu";
import { CardDetailsSidebar } from "@/components/battle/CardDetailsSidebar";
import { CombatChoiceModal } from "@/components/battle/CombatChoiceModal";
import { CombatClash } from "@/components/battle/CombatClash";
import { DiscardForDrawModal } from "@/components/battle/DiscardForDrawModal";
import { EffectLogPanel } from "@/components/battle/EffectLogPanel";
import { BattleFeedback } from "@/components/battle/BattleFeedback";
import { useBattlePresentation } from "@/components/battle/useBattlePresentation";
import { EffectConnections } from "@/components/battle/EffectConnections";
import { EffectTargetModal } from "@/components/battle/EffectTargetModal";
import { BoardLane as FieldSlot } from "@/components/battle/BoardLane";
import { HandCard } from "@/components/battle/HandCard";
import { ManaZonePanel } from "@/components/battle/ManaZonePanel";
import { PhaseIndicator } from "@/components/battle/PhaseIndicator";
import { PlayerInfo } from "@/components/battle/PlayerInfo";
import { PositionSelectorModal } from "@/components/battle/PositionSelectorModal";
import { SupportZone } from "@/components/battle/SupportZone";
import { getPlayCondition, getPlayRestriction } from "@/game-engine/battle-actions";
import { getEffectiveCardStats, getEffectiveCost } from "@/game-engine/effects";
import { getLatestEffect } from "@/game-engine/effect-presentation";
import { getPresentedStat } from "@/game-engine/battle-presentation";
import { MAX_HAND_SIZE } from "@/game-engine/types";
import { useGameStore, GameCard } from "@/stores/gameStore";
import { useCPUAI } from "@/stores/cpuAI";
import { useBattleSetup } from "./useBattleSetup";


export default function BattleArenaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const deckId = searchParams.get("deckId");
  const { language } = useI18n();

  const [handSelectedCard, setHandSelectedCard] = useState<GameCard | null>(null);
  const [actionMenu, setActionMenu] = useState<{ card: GameCard; position: { x: number; y: number } } | null>(null);
  const [detailSelection, setDetailCard] = useState<GameCard | null>(null);
  const [positionSelectorCard, setPositionSelectorCard] = useState<GameCard | null>(null);

  const {
    gameStarted,
    gameEnded,
    winner,
    turn,
    phase,
    turnNumber,
    player: livePlayer,
    cpu: liveCpu,
    playedManaThisTurn,
    combatPosition,
    combatAnimation,
    isCombatAnimation,
    destroyingCards,
    pendingDiscard,
    pendingEffect,
    pendingCombatChoice,
    effectLog,
    startGame,
    playCard,
    nextPhase,
    discardCard,
    activateAbility,
    resolvePendingEffect,
    cancelPendingEffect,
    chooseCombatOption,
    resetGame,
  } = useGameStore();
  const { frame, paused, togglePause } = useBattlePresentation();
  const boardRef = useRef<HTMLDivElement>(null);
  const player = frame?.player ?? livePlayer, cpu = frame?.cpu ?? liveCpu;
  const presenting = Boolean(frame);
  const clashingIds = new Set(combatAnimation && !presenting ? [combatAnimation.attackerId, ...combatAnimation.blockerIds] : []);

  useCPUAI();
  const { loading, error, loadDeckAndStart } = useBattleSetup({
    status,
    session,
    deckId,
    gameStarted,
    language,
    startGame,
    onUnauthenticated: () => router.push("/login"),
    onMissingDeck: () => router.push("/battle"),
  });

  const handlePlayCard = (cardId: string, position?: number) => {
    if (turn !== "PLAYER" || phase !== "MAIN") return;
    playCard("PLAYER", cardId, position);
    setHandSelectedCard(null);
    setDetailCard(null);
    setActionMenu(null);
    setPositionSelectorCard(null);
  };

  const handleHandCardClick = (card: GameCard, event: React.MouseEvent) => {
    setHandSelectedCard(card);
    setDetailCard(card);
    setActionMenu({ card, position: { x: event.clientX, y: event.clientY } });
  };

  const handleSelectPosition = (position: number) => {
    if (positionSelectorCard) {
      handlePlayCard(positionSelectorCard.instanceId, position);
    }
  };

  const handleOpenPositionSelector = (card: GameCard) => {
    setActionMenu(null);
    if (getPlayCondition(card) && player.field.filter(c => c.cardType === "CRIATURA").length >= 6) {
      handlePlayCard(card.instanceId);
      return;
    }
    setPositionSelectorCard(card);
  };

  const handleFieldCardClick = (card: GameCard) => {
    setDetailCard(card);
  };

  const detailCard = detailSelection ? [...player.hand, ...player.field, ...player.manaZone, ...cpu.field, ...cpu.manaZone].find(c => c.instanceId === detailSelection.instanceId) ?? detailSelection : null;
  const latestEffect = getLatestEffect(frame?.events ?? effectLog);
  const frameDeaths = frame?.stage === "DESTRUCTION" ? frame.events.map(event => event.targetInstanceId) : [];

  const detailBelongsToPlayer = detailCard
    ? [...player.hand, ...player.field, ...player.manaZone].some((card) => card.instanceId === detailCard.instanceId)
    : false;
  const detailOwner = detailBelongsToPlayer ? player : cpu;
  const detailStats = detailCard?.cardType === "CRIATURA" ? getEffectiveCardStats(detailCard, detailOwner) : undefined;
  const getPlayDisabledReason = (card: GameCard) => {
    if (presenting) return language === "en" ? "Wait for the highlighted effect to finish" : "Espera a que termine el efecto resaltado";
    if (gameEnded) return language === "en" ? "The battle has ended" : "La batalla ha terminado";
    if (turn !== "PLAYER") return language === "en" ? "Wait for your turn" : "Espera tu turno";
    if (phase !== "MAIN" || isCombatAnimation) return language === "en" ? "Available in the main phase" : "Disponible en la fase principal";
    if (pendingEffect || pendingDiscard) return language === "en" ? "Resolve the pending choice first" : "Resuelve primero la elección pendiente";
    if ((card.cardType === "MANA" || card.cardType === "TIERRA") && playedManaThisTurn.PLAYER) return language === "en" ? "One mana card per turn" : "Solo un maná por turno";
    return getPlayRestriction({ player, cpu }, "PLAYER", card) ?? undefined;
  };

  const canPlayFromHand = (card: GameCard) => !getPlayDisabledReason(card);

  if (status === "loading" || loading) {
    return (
      <div className="era-stage flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">⚔️</div>
          <div className="text-white text-2xl">{language === "en" ? "Loading battle..." : "Cargando batalla..."}</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="era-stage flex min-h-screen items-center justify-center">
        <div className="text-center bg-gray-800 p-8 rounded-xl border border-red-500">
          <div className="text-6xl mb-4">❌</div>
          <div className="text-white text-xl mb-4">{error}</div>
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <button
              onClick={() => void loadDeckAndStart(true)}
              className="rounded-lg bg-yellow-500 px-6 py-3 font-bold text-gray-900"
            >
              {language === "en" ? "Retry" : "Reintentar"}
            </button>
            <button
              onClick={() => router.push("/battle")}
              className="rounded-lg bg-gray-700 px-6 py-3 font-bold text-white"
            >
              {language === "en" ? "Back to Deck Selection" : "Volver a Seleccion"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  if (!gameStarted) {
    return (
      <div className="era-stage flex min-h-screen items-center justify-center p-4">
        <div className="rounded-2xl border border-yellow-500/30 bg-gray-950/70 p-6 text-center text-gray-300 shadow-2xl">
          <p>{language === "en" ? "Battle could not be started." : "No se pudo iniciar la batalla."}</p>
          <button
            onClick={() => void loadDeckAndStart(true)}
            className="mt-4 rounded-lg bg-yellow-500 px-5 py-2 font-bold text-gray-950"
          >
            {language === "en" ? "Try again" : "Intentar de nuevo"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="battle-arena-shell">
      <header className="battle-topbar">
        <button type="button" onClick={() => {
          if (confirm(language === "en" ? "Leave this battle?" : "¿Salir de esta batalla?")) { resetGame(); router.push("/battle"); }
        }} className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-slate-300 hover:text-white">← {language === "en" ? "Exit" : "Salir"}</button>
        <div className="text-center"><span className="text-xs font-black tracking-[0.14em] text-amber-100">FABLE ARMAGEDDON</span><span className="ml-3 hidden text-[10px] text-slate-500 sm:inline">{language === "en" ? "Battle arena" : "Arena de batalla"}</span></div>
        <span className="rounded-full border border-white/10 px-3 py-1 text-[10px] text-slate-300">{language === "en" ? "Turn" : "Turno"} {turnNumber}</span>
      </header>
      <main className="battle-layout">
        <EffectLogPanel effectLog={effectLog} language={language} />
        <div ref={boardRef} className="battle-board" data-effects-paused={paused}>
          <EffectConnections frame={frame} boardRef={boardRef} />
          {combatAnimation && !presenting && <CombatClash key={combatAnimation.id} combat={combatAnimation} boardRef={boardRef} player={player} cpu={cpu} />}
          <div className="battle-player-row">
            <PlayerInfo name={cpu.name} life={cpu.life} maxLife={cpu.maxLife} deckCount={cpu.deck.length} handCount={cpu.hand.length} isOpponent language={language} events={frame?.events} paused={paused} />
            <PhaseIndicator phase={phase} turn={turn} />
          </div>
          <div className="battle-aux-row">
            <ManaZonePanel cards={cpu.manaZone} isOpponent language={language} onCardClick={setDetailCard} />
            <SupportZone cards={cpu.field.filter(c => c.cardType === "ALTERADOR")} isOpponent onCardClick={setDetailCard} language={language} events={frame?.events} />
          </div>
          <section className="battle-field-panel" aria-label={language === "en" ? "Opponent field" : "Campo oponente"}>
            <p>{language === "en" ? "OPPONENT FIELD" : "CAMPO OPONENTE"}</p>
            <div className="battle-field-grid">
              {[1, 2, 3, 4, 5, 6].map(pos => {
                const card = cpu.field.find(c => c.cardType === "CRIATURA" && c.position === pos);
                const stats = card ? getEffectiveCardStats(card, cpu) : undefined;
                return <FieldSlot key={pos} position={pos} card={card} isOpponent onClick={() => card && setDetailCard(card)}
                  isCombatPosition={combatPosition === pos} isClashing={card ? clashingIds.has(card.instanceId) : false}
                  isDestroying={card ? destroyingCards.includes(card.instanceId) || frameDeaths.includes(card.instanceId) : false}
                  displayAttack={card ? getPresentedStat(frame, card.instanceId, "ATTACK", stats?.attack) : undefined}
                  displayDefense={card ? getPresentedStat(frame, card.instanceId, "DEFENSE", stats?.remainingDefense) : undefined} effect={latestEffect} events={frame?.events} language={language} paused={paused} />;
              })}
            </div>
          </section>
          <BattleFeedback effectLog={effectLog} pendingEffect={presenting ? null : pendingEffect} turn={turn} combatPosition={combatPosition} language={language} frame={frame} paused={paused} onTogglePause={togglePause} />
          <section className="battle-field-panel" aria-label={language === "en" ? "Your field" : "Tu campo"}>
            <p>{language === "en" ? "YOUR FIELD" : "TU CAMPO"}</p>
            <div className="battle-field-grid">
              {[1, 2, 3, 4, 5, 6].map(pos => {
                const card = player.field.find(c => c.cardType === "CRIATURA" && c.position === pos);
                const stats = card ? getEffectiveCardStats(card, player) : undefined;
                return <FieldSlot key={pos} position={pos} card={card} onClick={() => card && handleFieldCardClick(card)}
                  isCombatPosition={combatPosition === pos} isClashing={card ? clashingIds.has(card.instanceId) : false}
                  isDestroying={card ? destroyingCards.includes(card.instanceId) || frameDeaths.includes(card.instanceId) : false}
                  displayAttack={card ? getPresentedStat(frame, card.instanceId, "ATTACK", stats?.attack) : undefined}
                  displayDefense={card ? getPresentedStat(frame, card.instanceId, "DEFENSE", stats?.remainingDefense) : undefined} effect={latestEffect} events={frame?.events} language={language} paused={paused} />;
              })}
            </div>
          </section>
          <div className="battle-aux-row">
            <ManaZonePanel cards={player.manaZone} language={language} onCardClick={setDetailCard} />
            <SupportZone cards={player.field.filter(c => c.cardType === "ALTERADOR")} onCardClick={setDetailCard} language={language} events={frame?.events} />
          </div>
          <div className="battle-player-row">
            <PlayerInfo name={player.name || "Jugador"} life={player.life} maxLife={player.maxLife} deckCount={player.deck.length} handCount={player.hand.length} language={language} events={frame?.events} paused={paused} />
            {turn === "PLAYER" && phase !== "DRAW" ? <button type="button" onClick={() => nextPhase()}
              disabled={presenting || isCombatAnimation || Boolean(pendingEffect) || Boolean(pendingDiscard) || gameEnded}
              className="rounded-xl bg-amber-400 px-4 py-2 text-xs font-black text-slate-950 transition hover:bg-amber-300 disabled:cursor-wait disabled:opacity-40">
              {phase === "END" ? (language === "en" ? "End turn" : "Terminar turno") :
                phase === "COMBAT" ? (language === "en" ? "Resolving…" : "Resolviendo…") :
                  (language === "en" ? "Go to combat →" : "Ir al combate →")}
            </button> : <span className="text-[10px] text-slate-400">{language === "en" ? "Preparing turn…" : "Preparando turno…"}</span>}
          </div>
          <section className="battle-hand-panel">
            <div className="battle-hand-label"><span>{language === "en" ? "YOUR HAND" : "TU MANO"} · {player.hand.length}/{MAX_HAND_SIZE}</span><span>{language === "en" ? "Select a card to play" : "Selecciona una carta para jugar"}</span></div>
            <div className="battle-hand-strip">
              {player.hand.map(card => <HandCard key={card.instanceId} card={card} onClick={event => handleHandCardClick(card, event)}
                isPlayable={canPlayFromHand(card)} canAfford={canPlayFromHand(card)}
                isSelected={handSelectedCard?.instanceId === card.instanceId} displayCost={getEffectiveCost(card, player.field)} />)}
              {!player.hand.length && <p className="self-center text-xs text-slate-500">{language === "en" ? "Empty hand" : "Mano vacía"}</p>}
            </div>
          </section>
        </div>
        <div className="battle-details-rail">
          <CardDetailsSidebar key={detailCard?.instanceId ?? "empty"} detailCard={detailCard} language={language}
            onClose={() => setDetailCard(null)} displayCost={detailCard ? getEffectiveCost(detailCard, detailOwner.field) : undefined}
            displayAttack={detailStats?.attack} displayDefense={detailStats?.remainingDefense}
            showPlayAction={Boolean(detailCard && player.hand.some(c => c.instanceId === detailCard.instanceId))}
            canPlay={Boolean(detailCard && canPlayFromHand(detailCard))}
            playDisabledReason={detailCard ? getPlayDisabledReason(detailCard) : undefined}
            onPlay={() => {
              if (!detailCard) return;
              if (detailCard.cardType === "CRIATURA") handleOpenPositionSelector(detailCard);
              else handlePlayCard(detailCard.instanceId);
            }}
            canActivate={Boolean(!presenting && detailCard && turn === "PLAYER" && phase === "MAIN" && !pendingEffect &&
              player.field.some(c => c.instanceId === detailCard.instanceId && !c.activatedThisTurn) &&
              detailCard.abilities?.some(a => a.trigger === "ACTIVATED"))}
            onActivate={() => { if (detailCard) activateAbility("PLAYER", detailCard.instanceId); }} />
        </div>
      </main>

      {!presenting && pendingDiscard === "PLAYER" && (
        <DiscardForDrawModal
          hand={player.hand}
          onDiscard={(cardId) => discardCard("PLAYER", cardId)}
          language={language}
        />
      )}

      {actionMenu && (
        <ActionMenu
          card={actionMenu.card}
          position={actionMenu.position}
          onPlay={() => handlePlayCard(actionMenu.card.instanceId)}
          onSelectPosition={() => handleOpenPositionSelector(actionMenu.card)}
          onClose={() => setActionMenu(null)}
          canPlay={canPlayFromHand(actionMenu.card)}
          disabledReason={getPlayDisabledReason(actionMenu.card)}
          language={language}
        />
      )}

      {positionSelectorCard && (
        <PositionSelectorModal
          card={positionSelectorCard}
          occupiedPositions={player.field.filter((card) => card.cardType === "CRIATURA").map(c => c.position || 0)}
          onSelectPosition={handleSelectPosition}
          onClose={() => setPositionSelectorCard(null)}
          language={language}
        />
      )}

      {!presenting && pendingEffect && (
        <EffectTargetModal
          key={pendingEffect.source.instanceId + pendingEffect.ability.effect + pendingEffect.kind}
          pending={pendingEffect}
          onSelect={resolvePendingEffect}
          onClose={cancelPendingEffect}
          language={language}
        />
      )}

      {!presenting && pendingCombatChoice?.controller === "PLAYER" && (
        <CombatChoiceModal pending={pendingCombatChoice} onChoose={chooseCombatOption} language={language} />
      )}

      {!presenting && gameEnded && winner && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
          <div className={`w-full max-w-md rounded-[28px] border-4 bg-gray-950/85 p-6 text-center shadow-2xl backdrop-blur-xl sm:p-8 ${
            winner === "PLAYER" ? "border-green-500" : "border-red-500"
          }`}>
            <div className="text-6xl mb-4">
              {winner === "DRAW" ? "⚖️" : winner === "PLAYER" ? "🏆" : "💀"}
            </div>
            <h2 className="text-4xl font-bold text-white mb-4">
              {winner === "DRAW" ? (language === "en" ? "Draw" : "Empate") : winner === "PLAYER"
                ? (language === "en" ? "Victory!" : "¡Victoria!")
                : (language === "en" ? "Defeat!" : "¡Derrota!")
              }
            </h2>
            <p className="text-gray-300 mb-6">
              {winner === "DRAW" ? (language === "en" ? "Both players lost their life." : "Ambos jugadores perdieron toda su vida.") : winner === "PLAYER"
                ? (language === "en" ? "You defeated the CPU!" : "¡Derrotaste a la CPU!")
                : (language === "en" ? "The CPU defeated you." : "La CPU te derrotó.")
              }
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  resetGame();
                   void loadDeckAndStart(true);
                }}
                className="flex-1 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 font-bold rounded-lg hover:from-yellow-400 hover:to-orange-400 transition-colors"
              >
                {language === "en" ? "Play Again" : "Jugar de Nuevo"}
              </button>
              <button
                onClick={() => {
                  resetGame();
                  router.push("/battle");
                }}
                className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-lg transition-colors"
              >
                {language === "en" ? "Change Deck" : "Cambiar Mazo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
