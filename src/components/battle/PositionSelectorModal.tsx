import { GameCard } from "@/stores/gameStore";

export function PositionSelectorModal({
  card,
  occupiedPositions,
  onSelectPosition,
  onClose,
  language,
}: {
  card: GameCard;
  occupiedPositions: number[];
  onSelectPosition: (position: number) => void;
  onClose: () => void;
  language: string;
}) {
  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 z-50 w-[calc(100vw-2rem)] max-w-[420px] -translate-x-1/2 -translate-y-1/2 transform rounded-xl border-2 border-yellow-500 bg-gray-900 p-4 shadow-2xl sm:p-6">
        <div className="mb-4 text-center">
          <p className="mb-1 text-lg font-bold text-yellow-400">{language === "en" ? "Select Position" : "Selecciona Posición"}</p>
          <p className="text-sm text-white">{card.name}</p>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((pos) => {
            const isOccupied = occupiedPositions.includes(pos);
            return (
              <button
                key={pos}
                onClick={() => !isOccupied && onSelectPosition(pos)}
                disabled={isOccupied}
                className={`flex h-16 w-full flex-col items-center justify-center rounded-lg border-2 transition-all sm:h-20 sm:w-14 ${
                  isOccupied
                    ? "cursor-not-allowed border-gray-600 bg-gray-700 opacity-50"
                    : "cursor-pointer border-yellow-500 bg-gray-800 hover:scale-105 hover:bg-yellow-500/20"
                }`}
              >
                <span className={`text-lg font-bold ${isOccupied ? "text-gray-500" : "text-yellow-400"}`}>{pos}</span>
                {isOccupied && <span className="mt-1 text-xs text-gray-500">✕</span>}
              </button>
            );
          })}
        </div>

        <button onClick={onClose} className="mt-4 w-full rounded-lg bg-gray-700 py-2 text-sm text-white hover:bg-gray-600">
          {language === "en" ? "Cancel" : "Cancelar"}
        </button>
      </div>
    </>
  );
}
