import { GameCard } from "@/stores/gameStore";

export function ActionMenu({
  card,
  position,
  onPlay,
  onSelectPosition,
  onClose,
  canPlay,
  disabledReason,
  language,
}: {
  card: GameCard;
  position: { x: number; y: number };
  onPlay: () => void;
  onSelectPosition: () => void;
  onClose: () => void;
  canPlay: boolean;
  disabledReason?: string;
  language: string;
}) {
  const isCreature = card.cardType === "CRIATURA";

  return (
    <>
      <div className="fixed inset-0 z-40" onClick={onClose} />
      <div
        className="fixed z-50 overflow-hidden rounded-lg border border-gray-600 bg-gray-900 shadow-xl"
        style={{
          left: Math.min(position.x, window.innerWidth - 180),
          top: Math.min(position.y, window.innerHeight - 150),
        }}
      >
        <div className="border-b border-gray-700 bg-gray-800 px-3 py-2">
          <p className="max-w-[150px] truncate text-sm font-medium text-white">{card.name}</p>
        </div>
        <div className="py-1">
          <button
            onClick={() => {
              if (isCreature) {
                onSelectPosition();
              } else {
                onPlay();
              }
              onClose();
            }}
            disabled={!canPlay}
            className={`flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors ${
              canPlay ? "text-green-400 hover:bg-gray-800" : "cursor-not-allowed text-gray-500"
            }`}
          >
            {isCreature ? "📍" : "⚔️"} {language === "en" ? "Play" : "Jugar"}
            {!canPlay && <span className="text-xs text-red-400">(✗)</span>}
          </button>
          {!canPlay && disabledReason && <p className="px-4 py-1 text-[10px] text-amber-300">{disabledReason}</p>}
          <button
            onClick={onClose}
            className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-400 hover:bg-gray-800"
          >
            ✕ {language === "en" ? "Cancel" : "Cancelar"}
          </button>
        </div>
      </div>
    </>
  );
}
