import { useI18n } from "@/components/I18nProvider";
import { GamePhase } from "@/stores/gameStore";

export function PhaseIndicator({ phase, turn }: { phase: GamePhase; turn: string }) {
  const { language } = useI18n();
  const phases: Record<string, { es: string; en: string }> = {
    DRAW: { es: "Robar", en: "Draw" },
    MAIN: { es: "Principal", en: "Main" },
    COMBAT: { es: "Combate", en: "Combat" },
    END: { es: "Fin", en: "End" },
  };

  return (
    <div className="battle-phase-indicator rounded-lg border border-gray-600 bg-gray-800/90 px-3 py-1.5">
      <p className="text-xs text-gray-400">{language === "en" ? `${turn === "PLAYER" ? "Your" : "CPU"} Turn` : `Turno de ${turn === "PLAYER" ? "Jugador" : "CPU"}`}</p>
      <p className="text-center font-bold text-yellow-400">{phases[phase]?.[language === "en" ? "en" : "es"] || phase}</p>
    </div>
  );
}
