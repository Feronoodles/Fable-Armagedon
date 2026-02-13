"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useI18n } from "@/components/I18nProvider";
import LanguageSelector from "@/components/LanguageSelector";

interface Pack {
  id: string;
  quantity: number;
  packType: {
    name: string;
    description: string;
    cardsPerPack: number;
    commonChance: number;
    uncommonChance: number;
    rareChance: number;
    epicChance: number;
    legendaryChance: number;
  };
}

interface Card {
  id: string;
  name: string;
  rarity: string;
  cardType: string;
  cost: number;
  attack?: number;
  defense?: number;
  manaTypes: string[];
  subtypes: string[];
  abilities?: any[];
  description?: string;
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

export default function PacksPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t, language, translateCardName } = useI18n();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [openingPack, setOpeningPack] = useState<string | null>(null);
  const [openedCards, setOpenedCards] = useState<Card[] | null>(null);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (session) {
      fetchPacks();
    }
  }, [session]);

  const fetchPacks = async () => {
    try {
      const response = await fetch("/api/packs");
      const data = await response.json();
      
      if (response.ok) {
        setPacks(data.packs);
      } else {
        setError(data.message || "Error");
      }
    } catch (err) {
      setError("Connection error");
    } finally {
      setLoading(false);
    }
  };

  const openPack = async (packId: string) => {
    setOpeningPack(packId);
    setError("");

    try {
      const response = await fetch("/api/packs/open", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ packId }),
      });

      const data = await response.json();

      if (response.ok) {
        setOpenedCards(data.cards);
        await fetchPacks();
      } else {
        setError(data.message || "Error");
      }
    } catch (err) {
      setError("Connection error");
    } finally {
      setOpeningPack(null);
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "COMUN": return "text-gray-400";
      case "INFRECUENTE": return "text-green-400";
      case "RARA": return "text-blue-400";
      case "EPICA": return "text-purple-400";
      case "LEGENDARIA": return "text-yellow-400";
      case "CELESTIAL": return "bg-gradient-to-r from-purple-500 to-white bg-clip-text text-transparent";
      default: return "text-white";
    }
  };

  const getRarityBorder = (rarity: string) => {
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
                  onClick={() => router.push("/collection")}
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  {t("menu.collection")}
                </button>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-4xl font-bold text-white mb-8 text-center">
          {t("packs.myPacks")}
        </h2>

        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300 text-center">
            {error}
          </div>
        )}

        {/* Modal de detalle de carta */}
        {selectedCard && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl p-6 max-w-lg w-full border-2 border-gray-600">
              <div className={`p-6 rounded-xl border-2 ${getRarityBorder(selectedCard.rarity)} bg-gray-700`}>
                <div className="flex justify-between items-start mb-2">
                  <h3 className={`text-2xl font-bold ${getRarityColor(selectedCard.rarity)}`}>
                    {translateCardName(selectedCard.name)}
                  </h3>
                  <div className="flex items-center gap-1 bg-gray-800 px-3 py-1 rounded-full">
                    {selectedCard.manaTypes.map((mana, idx) => (
                      <span key={idx} className="text-xl">{elementIcons[mana]}</span>
                    ))}
                    <span className="text-white font-bold ml-1">{selectedCard.cost}</span>
                  </div>
                </div>

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

                <p className="text-gray-300 mb-4">{selectedCard.description}</p>

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
              </div>

              <button
                onClick={() => setSelectedCard(null)}
                className="w-full mt-6 py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 font-bold rounded-lg hover:from-yellow-400 hover:to-orange-400 transition-colors"
              >
                {t("packs.close")}
              </button>
            </div>
          </div>
        )}

        {/* Modal de cartas abiertas */}
        {openedCards && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-gray-800 rounded-2xl p-8 max-w-5xl w-full max-h-[90vh] overflow-y-auto">
              <h3 className="text-3xl font-bold text-white mb-6 text-center">
                {t("packs.cardsObtained")}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {openedCards.map((card, index) => (
                  <div
                    key={index}
                    onClick={() => setSelectedCard(card)}
                    className={`bg-gray-700 rounded-xl p-4 text-center hover:scale-105 transition-transform cursor-pointer border-2 ${getRarityBorder(card.rarity)}`}
                  >
                    <div className="h-28 bg-gray-600 rounded-lg mb-3 flex items-center justify-center relative">
                      <span className="text-4xl">🎴</span>
                      <div className="absolute top-1 right-1 flex items-center gap-1 bg-gray-900/80 px-2 py-1 rounded-full">
                        {card.manaTypes.slice(0, 2).map((mana, idx) => (
                          <span key={idx} className="text-sm">{elementIcons[mana]}</span>
                        ))}
                        <span className="text-white text-xs font-bold">{card.cost}</span>
                      </div>
                    </div>
                    <h4 className={`font-bold text-sm mb-1 ${getRarityColor(card.rarity)}`}>
                      {translateCardName(card.name)}
                    </h4>
                    {card.subtypes && card.subtypes.length > 0 && (
                      <p className="text-xs text-gray-500 mb-1">
                        {card.subtypes.slice(0, 2).map(st => getSubtypeTranslation(st)).join(", ")}
                      </p>
                    )}
                    <p className="text-xs text-gray-400">{getRarityTranslation(card.rarity)}</p>
                    {card.attack !== undefined && (
                      <p className="text-xs text-gray-300 mt-1">
                        ATK:{card.attack} DEF:{card.defense}
                      </p>
                    )}
                    {card.abilities && card.abilities.length > 0 && (
                      <p className="text-xs text-yellow-400 mt-1">
                        {card.abilities.length} {t("card.abilities")}
                      </p>
                    )}
                  </div>
                ))}
              </div>
              <button
                onClick={() => setOpenedCards(null)}
                className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-gray-900 font-bold rounded-lg hover:from-yellow-400 hover:to-orange-400 transition-colors"
              >
                {t("packs.close")}
              </button>
            </div>
          </div>
        )}

        {/* Lista de sobres */}
        {packs.length === 0 ? (
          <div className="text-center text-gray-400 text-xl">
            {t("packs.noPacks")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {packs.map((pack) => (
              <div
                key={pack.id}
                className="bg-gray-800/80 backdrop-blur-sm rounded-2xl p-6 border border-gray-600 hover:border-yellow-500 transition-all duration-300"
              >
                <div className="text-center mb-4">
                  <div className="text-6xl mb-3">📦</div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {pack.packType.name}
                  </h3>
                  <p className="text-gray-400 text-sm mb-4">
                    {pack.packType.description}
                  </p>
                </div>

                <div className="space-y-2 mb-4 text-sm">
                  <div className="flex justify-between text-gray-300">
                    <span>{t("packs.quantity")}:</span>
                    <span className="font-bold text-yellow-400">{pack.quantity}</span>
                  </div>
                  <div className="flex justify-between text-gray-300">
                    <span>{t("packs.cardsPerPack")}:</span>
                    <span>{pack.packType.cardsPerPack}</span>
                  </div>
                </div>

                <button
                  onClick={() => openPack(pack.id)}
                  disabled={openingPack === pack.id || pack.quantity <= 0}
                  className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-gray-900 font-bold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {openingPack === pack.id ? t("packs.opening") : t("packs.openPack")}
                </button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}