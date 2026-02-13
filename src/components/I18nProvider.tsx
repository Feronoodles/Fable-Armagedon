"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import Cookies from "js-cookie";

// Traducciones completas
const translations = {
  es: {
    "common.appName": "Fable Armageddon",
    "common.loading": "Cargando...",
    "common.error": "Error",
    "common.close": "Cerrar",
    "common.search": "Buscar",
    "common.filter": "Filtrar",
    "auth.login": "Iniciar sesión",
    "auth.register": "Registrarse",
    "auth.logout": "Cerrar sesión",
    "auth.email": "Correo electrónico",
    "auth.password": "Contraseña",
    "auth.username": "Nombre de usuario",
    "auth.createAccount": "Crear cuenta",
    "menu.play": "Jugar",
    "menu.playDesc": "Busca una partida en línea",
    "menu.collection": "Colección",
    "menu.collectionDesc": "Gestiona tus cartas y mazos",
    "menu.packs": "Sobres",
    "menu.packsDesc": "Abre tus sobres de cartas",
    "menu.profile": "Perfil",
    "menu.profileDesc": "Ver estadísticas y logros",
    "menu.welcome": "¡Bienvenido, {{name}}!",
    "menu.level": "Nivel {{level}}",
    "menu.whatToDo": "¿Qué te gustaría hacer hoy?",
    "menu.news": "Noticias y Actualizaciones",
    "menu.new": "¡Nuevo!",
    "menu.update": "Actualización",
    "menu.comingSoon": "Próximamente",
    "menu.cardsImplemented": "¡Sistema de Cartas Implementado!",
    "menu.cardsDesc": "Ahora puedes abrir sobres y coleccionar cartas. ¡20 cartas únicas te esperan con 6 rarezas diferentes!",
    "menu.elementsAvailable": "8 Elementos Disponibles",
    "menu.elementsDesc": "Explora Fuego, Agua, Naturaleza, Rayo, Vacío, Normal, Tierra y Metal. ¡Crea estrategias únicas!",
    "menu.battleMode": "Modo Batalla",
    "menu.battleDesc": "El sistema de combate está en desarrollo. ¡Pronto podrás usar tus cartas en batallas épicas!",
    "cards.common": "Común",
    "cards.uncommon": "Infrecuente",
    "cards.rare": "Rara",
    "cards.epic": "Épica",
    "cards.legendary": "Legendaria",
    "cards.celestial": "Celestial",
    "cards.creature": "Criatura",
    "cards.spell": "Hechizo",
    "cards.field": "Alterador",
    "packs.openPack": "Abrir Sobre",
    "packs.opening": "Abriendo...",
    "packs.cardsObtained": "¡Cartas Obtenidas!",
    "packs.close": "Cerrar",
    "packs.myPacks": "Mis Sobres",
    "packs.quantity": "Cantidad",
    "packs.cardsPerPack": "Cartas por sobre",
    "packs.noPacks": "No tienes sobres disponibles",
    "packs.buyPacks": "Comprar Sobres",
    "collection.myCollection": "Mi Colección",
    "collection.totalCards": "Total de cartas",
    "collection.uniqueCards": "Cartas únicas",
    "collection.noCards": "No tienes cartas en tu colección",
    "collection.openPacks": "Abrir Sobres",
    "collection.filters": "Filtros",
    "collection.clearFilters": "Limpiar filtros",
    "collection.allRarities": "Todas las rarezas",
    "collection.allTypes": "Todos los tipos",
    "card.attack": "ATQ",
    "card.defense": "DEF",
    "card.cost": "Costo",
    "card.subtypes": "Subtipos",
    "card.abilities": "Habilidades",
    "card.flavorText": "Texto de ambientación",
    "card.description": "Descripción",
    // Nombres de cartas
    "card.warrior_neandertal": "Guerrero Neandertal Cibernético",
    "card.drone_explorer": "Dron Explorador Elemental",
    "card.fire_arrow": "Flecha de Fuego Ancestral",
    "card.energy_field": "Campo de Energía Primitiva",
    "card.metal_beetle": "Escarabajo de Metal Ancestral",
    "card.wasteland_warrior": "Guerrero Humano del Yermo",
    "card.earth_golem": "Golem de Tierra Despertado",
    "card.dragon_knight": "Caballero Dragón Mecha",
    "card.evolution_spell": "Hechizo de Evolución Temporal",
    "card.chaos_portal": "Portal Elemental Caótico",
    "card.elf_engineer": "Elfo Ingeniero Temporal",
    "card.orc_reborn": "Orco Renacido por la Forja",
    "card.volcanic_rex": "Rex Volcánico Biomecánico",
    "card.ether_storm": "Tormenta de Éter Arcano",
    "card.ancestor_shrine": "Santuario de los Ancestros",
    "card.obsidian_dragon": "Dragón Mecánico de Obsidiana",
    "card.void_dino": "Dinosaurio Alfa del Vacío",
    "card.era_titan": "Titán Colisionador de Eras",
    "card.architect": "El Arquitecto del Armagedón Fable",
    "card.harmony": "Armonía de los 8 Mundos",
  },
  en: {
    "common.appName": "Fable Armageddon",
    "common.loading": "Loading...",
    "common.error": "Error",
    "common.close": "Close",
    "common.search": "Search",
    "common.filter": "Filter",
    "auth.login": "Login",
    "auth.register": "Register",
    "auth.logout": "Logout",
    "auth.email": "Email",
    "auth.password": "Password",
    "auth.username": "Username",
    "auth.createAccount": "Create Account",
    "menu.play": "Play",
    "menu.playDesc": "Find an online match",
    "menu.collection": "Collection",
    "menu.collectionDesc": "Manage your cards and decks",
    "menu.packs": "Packs",
    "menu.packsDesc": "Open your card packs",
    "menu.profile": "Profile",
    "menu.profileDesc": "View stats and achievements",
    "menu.welcome": "Welcome, {{name}}!",
    "menu.level": "Level {{level}}",
    "menu.whatToDo": "What would you like to do today?",
    "menu.news": "News and Updates",
    "menu.new": "New!",
    "menu.update": "Update",
    "menu.comingSoon": "Coming Soon",
    "menu.cardsImplemented": "Card System Implemented!",
    "menu.cardsDesc": "Now you can open packs and collect cards. 20 unique cards await you with 6 different rarities!",
    "menu.elementsAvailable": "8 Elements Available",
    "menu.elementsDesc": "Explore Fire, Water, Nature, Lightning, Void, Normal, Earth and Metal. Create unique strategies!",
    "menu.battleMode": "Battle Mode",
    "menu.battleDesc": "The combat system is under development. Soon you will be able to use your cards in epic battles!",
    "cards.common": "Common",
    "cards.uncommon": "Uncommon",
    "cards.rare": "Rare",
    "cards.epic": "Epic",
    "cards.legendary": "Legendary",
    "cards.celestial": "Celestial",
    "cards.creature": "Creature",
    "cards.spell": "Spell",
    "cards.field": "Field Alterer",
    "packs.openPack": "Open Pack",
    "packs.opening": "Opening...",
    "packs.cardsObtained": "Cards Obtained!",
    "packs.close": "Close",
    "packs.myPacks": "My Packs",
    "packs.quantity": "Quantity",
    "packs.cardsPerPack": "Cards per pack",
    "packs.noPacks": "No packs available",
    "packs.buyPacks": "Buy Packs",
    "collection.myCollection": "My Collection",
    "collection.totalCards": "Total cards",
    "collection.uniqueCards": "Unique cards",
    "collection.noCards": "You don't have cards in your collection",
    "collection.openPacks": "Open Packs",
    "collection.filters": "Filters",
    "collection.clearFilters": "Clear filters",
    "collection.allRarities": "All rarities",
    "collection.allTypes": "All types",
    "card.attack": "ATK",
    "card.defense": "DEF",
    "card.cost": "Cost",
    "card.subtypes": "Subtypes",
    "card.abilities": "Abilities",
    "card.flavorText": "Flavor Text",
    "card.description": "Description",
    // Card names
    "card.warrior_neandertal": "Cybernetic Neanderthal Warrior",
    "card.drone_explorer": "Elemental Explorer Drone",
    "card.fire_arrow": "Ancient Fire Arrow",
    "card.energy_field": "Primitive Energy Field",
    "card.metal_beetle": "Ancient Metal Beetle",
    "card.wasteland_warrior": "Wasteland Human Warrior",
    "card.earth_golem": "Awakened Earth Golem",
    "card.dragon_knight": "Mecha Dragon Knight",
    "card.evolution_spell": "Temporal Evolution Spell",
    "card.chaos_portal": "Chaotic Elemental Portal",
    "card.elf_engineer": "Temporal Elf Engineer",
    "card.orc_reborn": "Forge Reborn Orc",
    "card.volcanic_rex": "Volcanic Biomechanical Rex",
    "card.ether_storm": "Arcane Ether Storm",
    "card.ancestor_shrine": "Ancestor Shrine",
    "card.obsidian_dragon": "Obsidian Mechanical Dragon",
    "card.void_dino": "Void Alpha Dinosaur",
    "card.era_titan": "Era Collision Titan",
    "card.architect": "The Fable Armageddon Architect",
    "card.harmony": "Harmony of the 8 Worlds",
  }
};

// Mapeo de nombres de cartas a claves de traducción
const cardNameMapping: { [key: string]: string } = {
  "Guerrero Neandertal Cibernético": "card.warrior_neandertal",
  "Dron Explorador Elemental": "card.drone_explorer",
  "Flecha de Fuego Ancestral": "card.fire_arrow",
  "Campo de Energía Primitiva": "card.energy_field",
  "Escarabajo de Metal Ancestral": "card.metal_beetle",
  "Guerrero Humano del Yermo": "card.wasteland_warrior",
  "Golem de Tierra Despertado": "card.earth_golem",
  "Caballero Dragón Mecha": "card.dragon_knight",
  "Hechizo de Evolución Temporal": "card.evolution_spell",
  "Portal Elemental Caótico": "card.chaos_portal",
  "Elfo Ingeniero Temporal": "card.elf_engineer",
  "Orco Renacido por la Forja": "card.orc_reborn",
  "Rex Volcánico Biomecánico": "card.volcanic_rex",
  "Tormenta de Éter Arcano": "card.ether_storm",
  "Santuario de los Ancestros": "card.ancestor_shrine",
  "Dragón Mecánico de Obsidiana": "card.obsidian_dragon",
  "Dinosaurio Alfa del Vacío": "card.void_dino",
  "Titán Colisionador de Eras": "card.era_titan",
  "El Arquitecto del Armagedón Fable": "card.architect",
  "Armonía de los 8 Mundos": "card.harmony",
};

interface I18nContextType {
  language: string;
  changeLanguage: (lang: string) => void;
  t: (key: string, options?: any) => string;
  translateCardName: (cardName: string) => string;
  ready: boolean;
}

const I18nContext = createContext<I18nContextType | null>(null);

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return context;
}

export default function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState("es");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Load saved language from cookie
    const savedLang = Cookies.get("language") || "es";
    if (savedLang === "es" || savedLang === "en") {
      setLanguage(savedLang);
    }
    setReady(true);
  }, []);

  const changeLanguage = (lang: string) => {
    if (lang === "es" || lang === "en") {
      setLanguage(lang);
      // Save to cookie with 1 year expiration
      Cookies.set("language", lang, { expires: 365, path: "/" });
    }
  };

  const t = (key: string, options?: any): string => {
    const currentTranslations = translations[language as keyof typeof translations] || translations.es;
    let text = currentTranslations[key as keyof typeof currentTranslations] || key;
    
    // Reemplazar variables
    if (options) {
      Object.keys(options).forEach((key) => {
        text = text.replace(`{{${key}}}`, String(options[key]));
      });
    }
    
    return text;
  };

  const translateCardName = (cardName: string): string => {
    const translationKey = cardNameMapping[cardName];
    if (translationKey) {
      return t(translationKey);
    }
    return cardName;
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <I18nContext.Provider value={{ language, changeLanguage, t, translateCardName, ready }}>
      {children}
    </I18nContext.Provider>
  );
}