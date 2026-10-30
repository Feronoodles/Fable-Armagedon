import type { PendingCombatChoice } from "@/stores/gameStore";

export function CombatChoiceModal({
  pending,
  onChoose,
  language,
}: {
  pending: PendingCombatChoice;
  onChoose: (value: boolean) => void;
  language: string;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-red-400/50 bg-gray-950 p-5 text-center shadow-2xl">
        <p className="text-xs uppercase tracking-[0.25em] text-red-300">
          {language === "en" ? "Attack choice" : "Decision de ataque"}
        </p>
        <h2 className="mt-2 text-xl font-bold text-white">{pending.card.name}</h2>
        <p className="mt-2 text-sm text-gray-400">
          {language === "en"
            ? "Make this attacker unblockable for this turn?"
            : "Quieres que esta criatura no pueda ser bloqueada este turno?"}
        </p>
        {pending.opponent && <p className="mt-2 text-xs text-gray-500">Objetivo: {pending.opponent.name}</p>}
        <div className="mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => onChoose(true)}
            className="rounded-xl bg-red-500 px-3 py-3 text-sm font-bold text-white hover:bg-red-400"
          >
            {language === "en" ? "Unblockable" : "No bloqueable"}
          </button>
          <button
            onClick={() => onChoose(false)}
            className="rounded-xl bg-gray-800 px-3 py-3 text-sm font-bold text-gray-200 hover:bg-gray-700"
          >
            {language === "en" ? "Normal attack" : "Ataque normal"}
          </button>
        </div>
      </div>
    </div>
  );
}
