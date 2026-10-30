"use client";

import { getCardAppearance } from "@/lib/card-appearance";
import { getSubtypeLabel } from "@/game-engine/subtypes";
import { CardArt } from "./CardArt";
import { useI18n } from "@/components/I18nProvider";
import { GameAbility } from "@/game-engine/abilities";

export interface Card {
  id: string;
  name: string;
  description?: string;
  cost: number;
  attack?: number;
  defense?: number;
  cardType: string;
  rarity: string;
  manaTypes: string[];
  attribute: string;
  subtypes: string[];
  abilities?: GameAbility[];
  flavorText?: string;
  imageUrl?: string;
  picture?: string;
}

interface CardItemProps {
  card: Card;
  quantity?: number;
  deckQuantity?: number;
  showQuantity?: boolean;
  showDeckQuantity?: boolean;
  onClick?: () => void;
  onDoubleClick?: () => void;
  draggable?: boolean;
  onDragStart?: (event: React.DragEvent<HTMLDivElement>) => void;
  onAdd?: () => void;
  onRemove?: () => void;
  disabled?: boolean;
  size?: "small" | "medium" | "large";
}

// Iconos de elementos
const elementIcons: { [key: string]: string } = {
  "FUEGO": "🔥",
  "AGUA": "💧",
  "NATURALEZA": "🌿",
  "RAYO": "⚡",
  "VACIO": "🌑",
  "NORMAL": "⬜",
  "TIERRA": "🟤",
  "METAL": "⚙️"
};


export function getRarityColor(rarity: string) {
  switch (rarity) {
    case "COMUN": return "border-gray-400";
    case "INFRECUENTE": return "border-green-400";
    case "RARA": return "border-blue-400";
    case "EPICA": return "border-purple-400";
    case "LEGENDARIA": return "border-yellow-400";
    case "CELESTIAL": return "border-purple-200";
    default: return "border-gray-600";
  }
}

export function getRarityTextColor(rarity: string) {
  switch (rarity) {
    case "COMUN": return "text-gray-400";
    case "INFRECUENTE": return "text-green-400";
    case "RARA": return "text-blue-400";
    case "EPICA": return "text-purple-400";
    case "LEGENDARIA": return "text-yellow-400";
    case "CELESTIAL": return "bg-gradient-to-r from-purple-400 to-white bg-clip-text text-transparent";
    default: return "text-white";
  }
}

export function getRarityBgColor(rarity: string) {
  switch (rarity) {
    case "COMUN": return "bg-gray-500";
    case "INFRECUENTE": return "bg-green-500";
    case "RARA": return "bg-blue-500";
    case "EPICA": return "bg-purple-500";
    case "LEGENDARIA": return "bg-yellow-500";
    case "CELESTIAL": return "bg-gradient-to-r from-purple-500 to-white";
    default: return "bg-gray-600";
  }
}

export function CardItem({
  card,
  quantity,
  deckQuantity,
  showQuantity = false,
  showDeckQuantity = false,
  onClick,
  onDoubleClick,
  draggable = false,
  onDragStart,
  onAdd,
  onRemove,
  disabled = false,
  size = "medium"
}: CardItemProps) {
  const { language, translateCardName, t } = useI18n();
  const appearance = getCardAppearance(card);

  const getSubtypeTranslation = (subtype: string) => {
    return getSubtypeLabel(subtype, language);
  };

  const getRarityTranslation = (rarity: string) => {
    switch (rarity) {
      case "COMUN": return t("cards.common");
      case "INFRECUENTE": return t("cards.uncommon");
      case "RARA": return t("cards.rare");
      case "EPICA": return t("cards.epic");
      case "LEGENDARIA": return t("cards.legendary");
      case "CELESTIAL": return t("cards.celestial");
      default: return rarity;
    }
  };

  const sizeClasses = {
    small: "p-2",
    medium: "p-4",
    large: "p-6"
  };

  const imageHeightClasses = {
    small: "h-16",
    medium: "h-24",
    large: "h-32"
  };

  return (
    <div
      onClick={disabled ? undefined : onClick}
      onDoubleClick={disabled ? undefined : onDoubleClick}
      draggable={!disabled && draggable}
      onDragStart={disabled ? undefined : onDragStart}
      style={appearance.style} data-card-type={card.cardType} data-rarity={card.rarity}
      className={`themed-card bg-gray-800 rounded-xl ${sizeClasses[size]} border-2 ${getRarityColor(card.rarity)}
        ${onClick && !disabled ? "cursor-pointer hover:scale-105" : ""}
        ${disabled ? "opacity-50" : ""}
        transition-transform relative`}
    >
      {/* Imagen de carta */}
      <div className={`${imageHeightClasses[size]} bg-gray-700 rounded-lg mb-3 flex items-center justify-center relative`}>
        <div className="absolute inset-0 overflow-hidden rounded-lg"><CardArt card={card} /></div>

        {/* Costo de mana */}
        <div className="absolute top-1 right-1 flex items-center gap-1 bg-gray-900/80 px-2 py-1 rounded-full">
          {card.manaTypes.slice(0, 2).map((mana, idx) => (
            <span key={idx} className={size === "small" ? "text-xs" : "text-sm"}>
              {elementIcons[mana]}
            </span>
          ))}
          <span className={`text-white font-bold ${size === "small" ? "text-xs" : "text-xs"}`}>
            {card.cost}
          </span>
        </div>

        {/* Cantidad en deck (si aplica) */}
        {showDeckQuantity && deckQuantity !== undefined && deckQuantity > 0 && (
          <div className={`absolute top-1 left-1 ${getRarityBgColor(card.rarity)} text-gray-900 font-bold px-2 py-1 rounded-full text-xs`}>
            {deckQuantity}x
          </div>
        )}
      </div>

      <span className="card-type-badge mb-2">{appearance.type.icon} {appearance.type[language === "en" ? "en" : "es"]}</span>
      {/* Nombre de carta */}
      <h4 className={`font-bold ${size === "small" ? "text-xs" : "text-sm"} mb-1 ${getRarityTextColor(card.rarity)} line-clamp-2`}>
        {translateCardName(card.name)}
      </h4>

      {/* Subtipos */}
      {card.subtypes && card.subtypes.length > 0 && (
        <p className={`text-gray-500 mb-1 ${size === "small" ? "text-[10px]" : "text-xs"}`}>
          {card.subtypes.slice(0, 2).map(st => getSubtypeTranslation(st)).join(", ")}
        </p>
      )}

      {/* Info inferior */}
      <div className={`flex justify-between items-center text-gray-400 ${size === "small" ? "text-[10px]" : "text-xs"}`}>
        <span>{getRarityTranslation(card.rarity)}</span>

        <div className="flex items-center gap-2">
          {/* Cantidad disponible */}
          {showQuantity && quantity !== undefined && (
            <span className="bg-gray-700 px-2 py-1 rounded-full">
              {quantity}x
            </span>
          )}

          {/* Botones de agregar/quitar */}
          {(onAdd || onRemove) && (
            <div className="flex items-center gap-1">
              {onRemove && deckQuantity !== undefined && deckQuantity > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="w-6 h-6 bg-red-600 hover:bg-red-500 text-white rounded flex items-center justify-center text-xs font-bold"
                >
                  -
                </button>
              )}
              {onAdd && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd();
                  }}
                  disabled={disabled}
                  className="w-6 h-6 bg-green-600 hover:bg-green-500 disabled:bg-gray-600 text-white rounded flex items-center justify-center text-xs font-bold"
                >
                  +
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats de ataque/defensa */}
      {card.cardType === "CRIATURA" && card.attack !== undefined && card.defense !== undefined && (
        <p className={`text-gray-300 mt-2 ${size === "small" ? "text-[10px]" : "text-xs"}`}>
          {card.attack}/{card.defense}
        </p>
      )}
    </div>
  );
}
