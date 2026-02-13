"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import LanguageSelector from "@/components/LanguageSelector";

interface Card {
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
  abilities?: any[];
  flavorText?: string;
}

interface PlayerCard {
  id: string;
  quantity: number;
  card: Card;
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

// Traducciones de subtipos
const subtypeTranslations: { [key: string]: { es: string; en: string } } = {
  "DINOSAURIO": { es: "Dinosaurio", en: "Dinosaur" },
  "DRAGON": { es: "Dragón", en: "Dragon" },
  "HUMANO": { es: "Humano", en: "Human" },
  "MECHA": { es: "Mecha", en: "Mecha" },
  "ELFO": { es: "Elfo", en: "Elf" },
  "ORCO": { es: "Orco", en: "Orc" },
  "RENACIDO": { es: "Renacido", en: "Reborn" },
  "VEILBORN": { es: "The Veilborn", en: "The Veilborn" },
  "TITAN": { es: "Titán", en: "Titan" }
};

// Traducciones de elementos
const elementTranslations: { [key: string]: { es: string; en: string } } = {
  "FUEGO": { es: "Fuego", en: "Fire" },
  "AGUA": { es: "Agua", en: "Water" },
  "NATURALEZA": { es: "Naturaleza", en: "Nature" },
  "RAYO": { es: "Rayo", en: "Lightning" },
  "VACIO": { es: "Vacío", en: "Void" },
  "NORMAL": { es: "Normal", en: "Normal" },
  "TIERRA": { es: "Tierra", en: "Earth" },
  "METAL": { es: "Metal", en: "Metal" }
};

export default function CollectionPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, language, translateCardName } = useI18n();
  const [collection, setCollection] = useState<PlayerCard[]>([]);
  const [allCards, setAllCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [filters, setFilters] = useState({
    rarity: "",
    cardType: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchCollection();
    }
  }, [session, filters]);

  const fetchCollection = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (filters.rarity) queryParams.append("rarity", filters.rarity);
      if (filters.cardType) queryParams.append("cardType", filters.cardType);

      const response = await fetch(`/api/collection?${queryParams}`);
      const data = await response.json();

      if (response.ok) {
        setCollection(data.collection);
        setAllCards(data.allCards);
      }
    } catch (err) {
      console.error("Error loading collection:", err);
    } finally {
      setLoading(false);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "COMUN": return "border-gray-400";
      case "INFRECUENTE": return "border-green-400";
      case "RARA": return "border-blue-400";
      case "EPICA": return "border-purple-400";
      case "LEGENDARIA": return "border-yellow-400";
      case "CELESTIAL": return "border-purple-200";
      default: return "border-gray-600";
    }
  };

  const getRarityTextColor = (rarity: string) => {
    switch (rarity) {
      case "COMUN": return "text-gray-400";
      case "INFRECUENTE": return "text-green-400";
      case "RARA": return "text-blue-400";
      case "EPICA": return "text-purple-400";
      case "LEGENDARIA": return "text-yellow-400";
      case "CELESTIAL": return "bg-gradient-to-r from-purple-400 to-white bg-clip-text text-transparent";
      default: return "text-white";
    }
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

  const getSubtypeTranslation = (subtype: string) => {
    return subtypeTranslations[subtype]?.[language as keyof typeof subtypeTranslations["DINOSAURIO"]] || subtype;
  };

  const getElementTranslation = (element: string) => {
    return elementTranslations[element]?.[language as keyof typeof elementTranslations["FUEGO"]] || element;
  };

  const totalUnique = collection.length;
  const totalCards = collection.reduce((sum, pc) => sum + pc.quantity, 0);

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-2xl">{t("common.loading")}</div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500">
              {t("common.appName")}
            </h1>
            <div className="flex items-center gap-4">
              <LanguageSelector />
              <nav className="flex gap-4">
                <button
                  onClick={() => router.push("/menu")}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t("menu.play")}
                </button>
                <button
                  onClick={() => router.push("/packs")}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t("menu.packs")}
                </button>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-4xl font-bold text-white">{t("collection.myCollection")}</h2>
          <div className="text-right">
            <p className="text-gray-300">
              {t("collection.uniqueCards")}: <span className="text-yellow-400 font-bold">{totalUnique}</span> / {allCards.length}
            </p>
            <p className="text-gray-300 text-sm">
              {t("collection.totalCards")}: <span className="text-yellow-400 font-bold">{totalCards}</span>
            </p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 mb-8 border border-gray-700">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <select
              value={filters.rarity}
              onChange={(e) => setFilters({ ...filters, rarity: e.target.value })}
              className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-yellow-500 focus:outline-none"
            >
              <option value="">{t("collection.allRarities")}</option>
              <option value="COMUN">{t("cards.common")}</option>
              <option value="INFRECUENTE">{t("cards.uncommon")}</option>
              <option value="RARA">{t("cards.rare")}</option>
              <option value="EPICA">{t("cards.epic")}</option>
              <option value="LEGENDARIA">{t("cards.legendary")}</option>
              <option value="CELESTIAL">{t("cards.celestial")}</option>
            </select>

            <select
              value={filters.cardType}
              onChange={(e) => setFilters({ ...filters, cardType: e.target.value })}
              className="bg-gray-700 text-white rounded-lg px-3 py-2 border border-gray-600 focus:border-yellow-500 focus:outline-none"
            >
              <option value="">{t("collection.allTypes")}</option>
              <option value="CRIATURA">{t("cards.creature")}</option>
              <option value="HECHIZO">{t("cards.spell")}</option>
              <option value="ALTERADOR">{t("cards.field")}</option>
            </select>

            <button
              onClick={() => setFilters({ rarity: "", cardType: "" })}
              className="bg-gray-700 hover:bg-gray-600 text-white rounded-lg px-3 py-2 border border-gray-600 transition-colors"
            >
              {t("collection.clearFilters")}
            </button>
          </div>
        </div>

        {/* Modal de detalle de carta */}
        {selectedCard && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto border-2 border-gray-600">
              {/* Header de la carta */}
              <div className={`p-6 rounded-xl border-2 ${getRarityColor(selectedCard.rarity)} bg-gray-700 mb-4`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`text-2xl font-bold ${getRarityTextColor(selectedCard.rarity)}`}>
                    {translateCardName(selectedCard.name)}
                  </h3>
                  <div className="flex items-center gap-1 bg-gray-800 px-3 py-1 rounded-full">
                    {selectedCard.manaTypes.map((mana, idx) => (
                      <span key={idx} className="text-xl" title={getElementTranslation(mana)}>
                        {elementIcons[mana] || "✨"}
                      </span>
                    ))}
                    <span className="text-white font-bold ml-1">{selectedCard.cost}</span>
                  </div>
                </div>

                {/* Stats para criaturas */}
                {selectedCard.attack !== undefined && (
                  <div className="flex gap-4 mb-4">
                    <div className="bg-gray-800 px-4 py-2 rounded-lg">
                      <span className="text-gray-400 text-sm">{t("card.attack")}</span>
                      <p className="text-white font-bold text-xl">{selectedCard.attack}</p>
                    </div>
                    <div className="bg-gray-800 px-4 py-2 rounded-lg">
                      <span className="text-gray-400 text-sm">{t("card.defense")}</span>
                      <p className="text-white font-bold text-xl">{selectedCard.defense}</p>
                    </div>
                  </div>
                )}

                {/* Descripción */}
                <p className="text-gray-300 mb-4">{selectedCard.description}</p>

                {/* Subtipos */}
                {selectedCard.subtypes && selectedCard.subtypes.length > 0 && (
                  <div className="mb-4">
                    <p className="text-gray-400 text-sm mb-2">{t("card.subtypes")}:</p>
                    <div className="flex flex-wrap gap-2">
                      {selectedCard.subtypes.map((subtype, idx) => (
                        <span key={idx} className="bg-gray-800 text-yellow-400 px-3 py-1 rounded-full text-sm">
                          {getSubtypeTranslation(subtype)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Habilidades */}
                {selectedCard.abilities && selectedCard.abilities.length > 0 && (
                  <div className="mb-4">
                    <p className="text-yellow-400 font-semibold mb-2">{t("card.abilities")}:</p>
                    <div className="space-y-2">
                      {selectedCard.abilities.map((ability, idx) => (
                        <div key={idx} className="bg-gray-800/50 p-3 rounded-lg">
                          <p className="text-white font-medium">{ability.name}</p>
                          <p className="text-gray-400 text-sm">{ability.description}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Texto de ambientación */}
                {selectedCard.flavorText && (
                  <p className="text-gray-500 italic text-sm mt-4 border-t border-gray-600 pt-3">
                    "{selectedCard.flavorText}"
                  </p>
                )}

                {/* Footer info */}
                <div className="mt-4 pt-4 border-t border-gray-600 flex justify-between items-center">
                  <span className="text-gray-400 text-sm">
                    {getRarityTranslation(selectedCard.rarity)}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {selectedCard.cardType === "CRIATURA" ? t("cards.creature") : 
                     selectedCard.cardType === "HECHIZO" ? t("cards.spell") : t("cards.field")}
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedCard(null)}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 font-bold rounded-lg hover:from-yellow-400 hover:to-orange-400 transition-colors"
              >
                {t("packs.close")}
              </button>
            </div>
          </div>
        )}

        {/* Grid de cartas */}
        {collection.length === 0 ? (
          <div className="text-center text-gray-400 text-xl py-12">
            <p className="mb-4">{t("collection.noCards")}</p>
            <button
              onClick={() => router.push("/packs")}
              className="px-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 font-bold rounded-lg hover:from-yellow-400 hover:to-orange-400 transition-colors"
            >
              {t("collection.openPacks")}
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {collection.map((playerCard) => (
              <div
                key={playerCard.id}
                onClick={() => setSelectedCard(playerCard.card)}
                className={`bg-gray-800 rounded-xl p-4 border-2 ${getRarityColor(playerCard.card.rarity)} cursor-pointer hover:scale-105 transition-transform`}
              >
                <div className="h-24 bg-gray-700 rounded-lg mb-3 flex items-center justify-center relative">
                  <span className="text-4xl">🎴</span>
                  {/* Costo de mana */}
                  <div className="absolute top-1 right-1 flex items-center gap-1 bg-gray-900/80 px-2 py-1 rounded-full">
                    {playerCard.card.manaTypes.slice(0, 2).map((mana, idx) => (
                      <span key={idx} className="text-sm">{elementIcons[mana]}</span>
                    ))}
                    <span className="text-white text-xs font-bold">{playerCard.card.cost}</span>
                  </div>
                </div>
                <h4 className={`font-bold text-sm mb-1 ${getRarityTextColor(playerCard.card.rarity)}`}>
                  {translateCardName(playerCard.card.name)}
                </h4>
                {/* Subtipos */}
                {playerCard.card.subtypes && playerCard.card.subtypes.length > 0 && (
                  <p className="text-xs text-gray-500 mb-1">
                    {playerCard.card.subtypes.slice(0, 2).map(st => getSubtypeTranslation(st)).join(", ")}
                  </p>
                )}
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>{getRarityTranslation(playerCard.card.rarity)}</span>
                  <span className="bg-gray-700 px-2 py-1 rounded-full">
                    x{playerCard.quantity}
                  </span>
                </div>
                {playerCard.card.attack !== undefined && (
                  <p className="text-xs text-gray-300 mt-2">
                    {playerCard.card.attack}/{playerCard.card.defense}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}