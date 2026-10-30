export type LocalizedText = {
  es: string;
  en: string;
};

export type StarterDeckCard = {
  name: string;
  quantity: number;
};

export type StarterDeckDefinition = {
  key: string;
  name: LocalizedText;
  description: LocalizedText;
  difficulty: LocalizedText;
  focus: LocalizedText;
  elements: string[];
  mainCards: StarterDeckCard[];
  lands: StarterDeckCard[];
};

// Starter lists use only core commons and uncommons so new players can learn
// the basics before chasing expansion and high-rarity cards.
export const STARTER_DECKS: StarterDeckDefinition[] = [
  {
    key: "volcanic-oath",
    name: { es: "Pacto del Volcán", en: "Volcanic Oath" },
    description: {
      es: "Dragones y guerreros de fuego que presionan desde los primeros turnos.",
      en: "Dragons and fire warriors that apply pressure from the first turns.",
    },
    difficulty: { es: "Fácil", en: "Easy" },
    focus: { es: "Ataque directo y criaturas de fuego", en: "Direct attacks and fire creatures" },
    elements: ["FUEGO"],
    mainCards: [
      { name: "Flecha de Fuego Ancestral", quantity: 4 },
      { name: "Aprendiz de la Primera Llama", quantity: 4 },
      { name: "Dragón de Chispa", quantity: 4 },
      { name: "Estandarte de la Primera Llama", quantity: 4 },
      { name: "Orco Renacido por la Forja", quantity: 4 },
      { name: "Soldado de Ceniza", quantity: 4 },
      { name: "Cría de Brasa", quantity: 4 },
      { name: "Cazador de Chispas", quantity: 4 },
      { name: "Guerrero de la Aurora Roja", quantity: 4 },
      { name: "Forja de la Brasa", quantity: 4 },
    ],
    lands: [
      { name: "Mana de Fuego", quantity: 16 },
    ],
  },
  {
    key: "chronal-forge",
    name: { es: "Forja Cronal", en: "Chronal Forge" },
    description: {
      es: "Mechas, inventores y energía metálica para aprender a construir ventaja.",
      en: "Mechs, inventors and metallic energy for learning how to build advantage.",
    },
    difficulty: { es: "Fácil", en: "Easy" },
    focus: { es: "Ritmo, tecnología y adaptación", en: "Tempo, technology and adaptation" },
    elements: ["METAL", "RAYO"],
    mainCards: [
      { name: "Escarabajo de Metal Ancestral", quantity: 4 },
      { name: "Dron Explorador Elemental", quantity: 4 },
      { name: "Mecánico de la Fractura", quantity: 4 },
      { name: "Dron de Reparación", quantity: 4 },
      { name: "Núcleo de Sobrecarga", quantity: 4 },
      { name: "Elfo Ingeniero Temporal", quantity: 4 },
      { name: "Autómata de Cobre", quantity: 4 },
      { name: "Guardia de Titanio", quantity: 4 },
      { name: "Piloto de la Fisura", quantity: 4 },
      { name: "Batería de la Fisura", quantity: 4 },
    ],
    lands: [
      { name: "Mana de Metal", quantity: 10 },
      { name: "Mana de Rayo", quantity: 6 },
    ],
  },
  {
    key: "ancestral-bastion",
    name: { es: "Bastión Ancestral", en: "Ancestral Bastion" },
    description: {
      es: "Humanos y guardianes que enseñan a proteger el campo y ganar tiempo.",
      en: "Humans and guardians that teach you to protect the field and buy time.",
    },
    difficulty: { es: "Fácil", en: "Easy" },
    focus: { es: "Defensa, vida y criaturas humanas", en: "Defense, life and human creatures" },
    elements: ["NATURALEZA", "TIERRA"],
    mainCards: [
      { name: "Guerrero Neandertal Cibernético", quantity: 4 },
      { name: "Campo de Energía Primitiva", quantity: 4 },
      { name: "Guardián de la Raíz Temporal", quantity: 4 },
      { name: "Muro de Raíces Temporales", quantity: 4 },
      { name: "Golem de Tierra Despertado", quantity: 4 },
      { name: "Consejera del Bosque Partido", quantity: 4 },
      { name: "Hechizo de Evolución Temporal", quantity: 4 },
      { name: "Recolector de Raíces", quantity: 4 },
      { name: "Vigía del Bosque Partido", quantity: 4 },
      { name: "Muro de Arcilla", quantity: 4 },
    ],
    lands: [
      { name: "Mana de Naturaleza", quantity: 12 },
      { name: "Mana de Tierra", quantity: 4 },
    ],
  },
  {
    key: "void-fissure",
    name: { es: "Fisura del Vacío", en: "Void Fissure" },
    description: {
      es: "Depredadores y portales que introducen el control sin depender de cartas supremas.",
      en: "Predators and portals that introduce control without relying on ultimate cards.",
    },
    difficulty: { es: "Intermedia", en: "Intermediate" },
    focus: { es: "Control, rebote y criaturas del vacío", en: "Control, bounce and void creatures" },
    elements: ["VACIO", "RAYO"],
    mainCards: [
      { name: "Larva del Vacío", quantity: 4 },
      { name: "Eco del Abismo", quantity: 4 },
      { name: "Portal Elemental Caótico", quantity: 4 },
      { name: "Oráculo de la Fisura", quantity: 4 },
      { name: "Dron Explorador Elemental", quantity: 4 },
      { name: "Elfo Ingeniero Temporal", quantity: 4 },
      { name: "Sombra de la Fisura", quantity: 4 },
      { name: "Depredador del Umbral", quantity: 4 },
      { name: "Relámpago de la Fisura", quantity: 4 },
      { name: "Cartógrafo del Abismo", quantity: 4 },
    ],
    lands: [
      { name: "Mana de Vacío", quantity: 12 },
      { name: "Mana de Rayo", quantity: 4 },
    ],
  },
];

export const getStarterDeck = (key: string) =>
  STARTER_DECKS.find((starterDeck) => starterDeck.key === key);

export const getStarterDeckCardEntries = (starterDeck: StarterDeckDefinition) => [
  ...starterDeck.mainCards,
  ...starterDeck.lands,
];

export const getStarterDeckMainCardCount = (starterDeck: StarterDeckDefinition) =>
  starterDeck.mainCards.reduce((total, card) => total + card.quantity, 0);

export const getStarterDeckLandCount = (starterDeck: StarterDeckDefinition) =>
  starterDeck.lands.reduce((total, card) => total + card.quantity, 0);

export const getStarterDeckTotalCardCount = (starterDeck: StarterDeckDefinition) =>
  getStarterDeckMainCardCount(starterDeck) + getStarterDeckLandCount(starterDeck);
