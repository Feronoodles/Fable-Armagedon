"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import Cookies from "js-cookie";

// Traducciones completas
const translations = {
  es: {
    "card.volcanic_snail": "Caracol Volcánico",
    "card.desc.volcanic_snail": "Una pequeña alimaña protegida por una gruesa espiral de obsidiana ardiente.",
    "card.ability.final_ash_trail": "Último rastro de ceniza",
    "card.ability.final_ash_trail_desc": "Al morir: Puedes elegir 1 criatura de coste 2 de maná o menos de tu mazo y destruirla, enviándola al cementerio.",
    "card.flavor.volcanic_snail": "Hasta su último rastro deja algo bajo las cenizas.",
    "card.volcan_del_fin": "Volcán del fin",
    "card.desc.volcan_del_fin": "Un volcán que transforma sacrificios en maná y deja una última promesa entre sus cenizas.",
    "card.ability.crater_offering": "Ofrenda al cráter",
    "card.ability.crater_offering_desc": "Una vez por turno: Puedes sacrificar una criatura que controles; añade 1 Mana de Fuego de tu mazo a tu mano.",
    "card.ability.final_awakening": "El último despertar",
    "card.ability.final_awakening_desc": "Si esta carta es destruida: Destruye todas las criaturas y cartas de campo que controles. Después, busca 1 criatura DRAGON de tu mazo, a tu elección, y añádela a tu mano. Conservas tus fuentes de maná.",
    "card.ability.only_one_end": "Un solo fin",
    "card.ability.only_one_end_desc": "Solo puedes controlar 1 Volcán del fin activo.",
    "card.flavor.volcan_del_fin": "Cuando despierte, el fuego reclamará todo salvo su último heredero.",
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
    "menu.playDesc": "Juega contra la CPU",
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
    "menu.battleDesc": "¡Enfrenta a la CPU en batallas épicas! Usa tus mazos personalizados.",
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
    // Descripciones de cartas
    "card.desc.warrior_neandertal": "Un guerrero prehistórico mejorado con tecnología futurista.",
    "card.desc.drone_explorer": "Un dron que analiza el campo de batalla en busca de oportunidades.",
    "card.desc.fire_arrow": "Un hechizo de fuego pasado de generación en generación.",
    "card.desc.energy_field": "Un alterador que potencia las criaturas humanas.",
    "card.desc.metal_beetle": "Un insecto mecánico rescatado de ruinas olvidadas.",
    "card.desc.wasteland_warrior": "Un sobreviviente endurecido por las tierras devastadas.",
    "card.desc.earth_golem": "Un constructo elemental que protege las tierras antiguas.",
    "card.desc.dragon_knight": "Un caballero que domina la tecnología dragónica.",
    "card.desc.evolution_spell": "Manipula el tiempo para mejorar tus criaturas.",
    "card.desc.chaos_portal": "Un portal inestable que transforma la energía.",
    "card.desc.elf_engineer": "Un maestro elfo que comprende el flujo del tiempo.",
    "card.desc.orc_reborn": "Un orco resucitado y mejorado con magia de fuego.",
    "card.desc.volcanic_rex": "Un tiranosaurio fusionado con magma y tecnología.",
    "card.desc.ether_storm": "Un hechizo que desgarra la realidad misma.",
    "card.desc.ancestor_shrine": "Un lugar sagrado donde los antiguos otorgan sus bendiciones.",
    "card.desc.obsidian_dragon": "Un dragón forjado en los volcanes y mejorado con tecnología.",
    "card.desc.void_dino": "Un depredador prehistórico consumido por el vacío.",
    "card.desc.era_titan": "Una fusión de tecnología, magia y evolución prehistórica.",
    "card.desc.architect": "El creador de la colisión de mundos.",
    "card.desc.harmony": "La manifestación perfecta del equilibrio elemental.",
    // Flavor texts
    "card.flavor.warrior_neandertal": "La evolución no tiene límites cuando la tecnología se une con la naturaleza.",
    "card.flavor.drone_explorer": "Los ojos mecánicos ven lo que los mortales ignoran.",
    "card.flavor.fire_arrow": "El fuego que quemó a los antiguos aún arde en nuestras manos.",
    "card.flavor.energy_field": "La tierra recuerda a sus antiguos habitantes.",
    "card.flavor.metal_beetle": "Incluso los pequeños pueden ser resistentes.",
    "card.flavor.wasteland_warrior": "El yermo no perdona, pero tampoco deja de forjar guerreros.",
    "card.flavor.earth_golem": "La tierra se alza para proteger lo suyo.",
    "card.flavor.dragon_knight": "El fuego del pasado se encuentra con la tecnología del futuro.",
    "card.flavor.evolution_spell": "El tiempo es un recurso... si sabes cómo usarlo.",
    "card.flavor.chaos_portal": "El caos es solo orden que no entendemos... todavía.",
    "card.flavor.elf_engineer": "Los elfos siempre han sido longevos; ahora también son puntuales.",
    "card.flavor.orc_reborn": "La forja no solo crea armas; también crea guerreros.",
    "card.flavor.volcanic_rex": "El rey de los dinosaurios ha evolucionado... y está furioso.",
    "card.flavor.ether_storm": "El éter no distingue entre aliado y enemigo; solo obedece al poder.",
    "card.flavor.ancestor_shrine": "Los ancestros nunca abandonan a los suyos.",
    "card.flavor.obsidian_dragon": "El metal más negro contiene el fuego más brillante.",
    "card.flavor.void_dino": "El vacío reclama todo, incluso a los reyes prehistóricos.",
    "card.flavor.era_titan": "Donde pasado, presente y futuro colisionan, nace la destrucción absoluta.",
    "card.flavor.architect": "Yo vi el final de todas las eras y decidí que necesitaban unirse.",
    "card.flavor.harmony": "Cuando los ocho elementos cantan en armonía, los dioses escuchan.",
    // Nombres de habilidades
    "card.ability.synergy_prehistoric": "Sinergia Prehistórica",
    "card.ability.tactical_scan": "Escaneo Táctico",
    "card.ability.igneous_impact": "Impacto Ígneo",
    "card.ability.ancestral_energy": "Energía Ancestral",
    "card.ability.resistance": "Resistencia",
    "card.ability.defender": "Defensor",
    "card.ability.cyber_breath": "Aliento de Fuego Cibernético",
    "card.ability.accelerated_evolution": "Evolución Acelerada",
    "card.ability.chaotic_transmutation": "Transmutación Caótica",
    "card.ability.temporal_manipulation": "Manipulación Temporal",
    "card.ability.burning_wrath": "Ira Ardiente",
    "card.ability.intimidate": "Intimidar",
    "card.ability.final_eruption": "Erupción Final",
    "card.ability.dimensional_tear": "Desgarre Dimensional",
    "card.ability.ancestral_blessing": "Bendición Ancestral",
    "card.ability.ancient_protection": "Protección Antigua",
    "card.ability.molten_wings": "Alas de Acero Fundido",
    "card.ability.obsidian_armor": "Armadura de Obsidiana",
    "card.ability.void_touch": "Toque del Vacío",
    "card.ability.arcane_immunity": "Inmunidad Arcana",
    "card.ability.era_challenge": "Desafío de Eras",
    "card.ability.triple_synergy": "Sinergia Triple",
    "card.ability.world_collision": "Colisión de Mundos",
    "card.ability.absolute_reconstruction": "Reconstrucción Absoluta",
    "card.ability.diversity_mastery": "Maestría de la Diversidad",
    "card.ability.celestial_restriction": "Restricción Celestial",
    "card.ability.perfect_balance": "Equilibrio Perfecto",
    "card.ability.elemental_resonance": "Resonancia Elemental",
    // Descripciones de habilidades
    "card.ability.synergy_prehistoric_desc": "Si hay otra criatura HUMANO en campo, +1/+1",
    "card.ability.tactical_scan_desc": "Al entrar: Roba 1 carta",
    "card.ability.igneous_impact_desc": "Inflige 3 de daño a una criatura o jugador",
    "card.ability.ancestral_energy_desc": "Las criaturas HUMANAS cuestan 1 menos de mana",
    "card.ability.resistance_desc": "Esta criatura puede bloquear a una criatura adicional",
    "card.ability.defender_desc": "Esta criatura no puede atacar",
    "card.ability.cyber_breath_desc": "Al entrar: Inflige 2 de daño a todas las criaturas enemigas",
    "card.ability.accelerated_evolution_desc": "Transforma una criatura Común en tu mano en una versión Infrecuente aleatoria del mismo atributo",
    "card.ability.chaotic_transmutation_desc": "Una vez por turno, puedes pagar 1 mana de cualquier elemento para generar 1 mana de un elemento diferente al azar",
    "card.ability.temporal_manipulation_desc": "Al atacar: Puedes hacer que esta criatura no sea bloqueable este turno",
    "card.ability.burning_wrath_desc": "Cuando esta criatura recibe daño, gana +2/+0 hasta el final del turno",
    "card.ability.intimidate_desc": "Las criaturas enemigas con menos ataque no pueden bloquear",
    "card.ability.final_eruption_desc": "Al morir: Inflige 3 de daño a todos",
    "card.ability.dimensional_tear_desc": "Devuelve todas las criaturas enemigas con 3 o menos de ataque a la mano. Roba 1 carta por cada criatura devuelta",
    "card.ability.ancestral_blessing_desc": "Al inicio de tu turno, ganas 1 vida por cada criatura HUMANA que controles",
    "card.ability.ancient_protection_desc": "Tus criaturas HUMANAS tienen +0/+2",
    "card.ability.molten_wings_desc": "Puede atacar en el turno que entra",
    "card.ability.obsidian_armor_desc": "La primera vez que recibiría daño cada turno, niega ese daño",
    "card.ability.void_touch_desc": "Cuando hace daño de combate, el controlador pierde 2 vidas",
    "card.ability.arcane_immunity_desc": "Inmune a hechizos",
    "card.ability.era_challenge_desc": "Cuando ataca, elige hasta 3 criaturas enemigas; deben bloquear a este Titán si pueden",
    "card.ability.triple_synergy_desc": "Si hay criaturas DINOSAURIO, MECHA y HUMANO en tu campo, tiene 'Ataque Doble'",
    "card.ability.world_collision_desc": "Cuando entra al campo, destruye todos los Alteradores de Campo en juego",
    "card.ability.absolute_reconstruction_desc": "Luego, juega cualquier número de Alteradores de Campo desde tu mano sin pagar su costo",
    "card.ability.diversity_mastery_desc": "Tus criaturas ganan +2/+2 por cada subtipo diferente de criatura que controles",
    "card.ability.celestial_restriction_desc": "Solo funciona si tienes 3+ elementos diferentes en tu campo",
    "card.ability.perfect_balance_desc": "Todas tus criaturas ganan +3/+3 y habilidades de cada elemento presente",
    "card.ability.elemental_resonance_desc": "Al final de cada turno, ganas 1 vida por cada elemento diferente que controles",
    // Land card names
    "card.land_fire": "Tierra Básica de Fuego",
    "card.land_water": "Tierra Básica de Agua",
    "card.land_nature": "Tierra Básica de Naturaleza",
    "card.land_lightning": "Tierra Básica de Rayo",
    "card.land_void": "Tierra Básica de Vacío",
    "card.land_normal": "Tierra Básica Normal",
    "card.land_earth": "Tierra Básica de Tierra",
    "card.land_metal": "Tierra Básica de Metal",
    // Land card descriptions
    "card.desc.land_fire": "Una tierra ardiente que canaliza el poder del fuego.",
    "card.desc.land_water": "Una tierra acuática que canaliza el poder del agua.",
    "card.desc.land_nature": "Una tierra fértil que canaliza el poder de la naturaleza.",
    "card.desc.land_lightning": "Una tierra eléctrica que canaliza el poder del rayo.",
    "card.desc.land_void": "Una tierra oscura que canaliza el poder del vacío.",
    "card.desc.land_normal": "Una tierra común que canaliza mana sin elemento.",
    "card.desc.land_earth": "Una tierra sólida que canaliza el poder de la tierra.",
    "card.desc.land_metal": "Una tierra metálica que canaliza el poder del metal.",
    // Land flavor texts
    "card.flavor.land_fire": "El calor del núcleo del mundo fluye a través de esta tierra.",
    "card.flavor.land_water": "Las corrientes subterráneas nunca dejan de fluir.",
    "card.flavor.land_nature": "La vida brota de cada grano de esta tierra sagrada.",
    "card.flavor.land_lightning": "La electricidad estática nunca desaparece de estas tierras.",
    "card.flavor.land_void": "La ausencia misma tiene poder en estas tierras malditas.",
    "card.flavor.land_normal": "La simplicidad misma es una forma de poder.",
    "card.flavor.land_earth": "La roca madre es la base de todo.",
    "card.flavor.land_metal": "Los minerales raros brillan bajo la superficie.",
    // Land ability names
    "card.ability.generate_fire": "Generar Fuego",
    "card.ability.generate_water": "Generar Agua",
    "card.ability.generate_nature": "Generar Naturaleza",
    "card.ability.generate_lightning": "Generar Rayo",
    "card.ability.generate_void": "Generar Vacío",
    "card.ability.generate_colorless": "Generar Mana",
    "card.ability.generate_earth": "Generar Tierra",
    "card.ability.generate_metal": "Generar Metal",
    // Land ability descriptions
    "card.ability.generate_fire_desc": "Gasta esta carta para generar 1 mana de Fuego",
    "card.ability.generate_water_desc": "Gasta esta carta para generar 1 mana de Agua",
    "card.ability.generate_nature_desc": "Gasta esta carta para generar 1 mana de Naturaleza",
    "card.ability.generate_lightning_desc": "Gasta esta carta para generar 1 mana de Rayo",
    "card.ability.generate_void_desc": "Gasta esta carta para generar 1 mana de Vacío",
    "card.ability.generate_colorless_desc": "Gasta esta carta para generar 1 mana incoloro",
    "card.ability.generate_earth_desc": "Gasta esta carta para generar 1 mana de Tierra",
    "card.ability.generate_metal_desc": "Gasta esta carta para generar 1 mana de Metal",
    // Sanctuary (Legendary Land) names
    "card.sanctuary_fire": "Santuario de Fuego",
    "card.sanctuary_water": "Santuario de Agua",
    "card.sanctuary_nature": "Santuario de Naturaleza",
    "card.sanctuary_lightning": "Santuario de Rayo",
    "card.sanctuary_void": "Santuario de Vacío",
    "card.sanctuary_normal": "Santuario Normal",
    "card.sanctuary_earth": "Santuario de Tierra",
    "card.sanctuary_metal": "Santuario de Metal",
    // Sanctuary descriptions
    "card.desc.sanctuary": "Una tierra sagrada que puede generar mana para cartas legendarias.",
    // Throne (Celestial Land) names
    "card.throne_fire": "Trono de Fuego",
    "card.throne_water": "Trono de Agua",
    "card.throne_nature": "Trono de Naturaleza",
    "card.throne_lightning": "Trono de Rayo",
    "card.throne_void": "Trono de Vacío",
    "card.throne_normal": "Trono Normal",
    "card.throne_earth": "Trono de Tierra",
    "card.throne_metal": "Trono de Metal",
    // Throne descriptions
    "card.desc.throne": "El asiento de los dioses. Puede generar mana para cartas celestiales.",
  },
  en: {
    "card.volcanic_snail": "Volcanic Snail",
    "card.desc.volcanic_snail": "A small vermin protected by a thick spiral of burning obsidian.",
    "card.ability.final_ash_trail": "Final Ash Trail",
    "card.ability.final_ash_trail_desc": "On death: You may choose 1 creature costing 2 mana or less from your deck and destroy it, sending it to the graveyard.",
    "card.flavor.volcanic_snail": "Even its final trail leaves something beneath the ashes.",
    "card.volcan_del_fin": "Volcano of the End",
    "card.desc.volcan_del_fin": "A volcano that turns sacrifices into mana and leaves one final promise among its ashes.",
    "card.ability.crater_offering": "Offering to the Crater",
    "card.ability.crater_offering_desc": "Once per turn: You may sacrifice a creature you control; add 1 basic Fire Mana from your deck to your hand.",
    "card.ability.final_awakening": "The Final Awakening",
    "card.ability.final_awakening_desc": "If this card is destroyed: Destroy all creatures and field cards you control. Then choose 1 DRAGON creature from your deck and add it to your hand. Keep your mana sources.",
    "card.ability.only_one_end": "Only One End",
    "card.ability.only_one_end_desc": "You can only control 1 active Volcano of the End.",
    "card.flavor.volcan_del_fin": "When it awakens, the fire will claim everything except its final heir.",
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
    "menu.playDesc": "Battle against the CPU",
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
    "menu.battleDesc": "Face the CPU in epic battles! Use your custom decks.",
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
    // Card descriptions
    "card.desc.warrior_neandertal": "A prehistoric warrior enhanced with futuristic technology.",
    "card.desc.drone_explorer": "A drone that analyzes the battlefield for opportunities.",
    "card.desc.fire_arrow": "A fire spell passed down through generations.",
    "card.desc.energy_field": "A field alterer that empowers human creatures.",
    "card.desc.metal_beetle": "A mechanical insect rescued from forgotten ruins.",
    "card.desc.wasteland_warrior": "A survivor hardened by the devastated lands.",
    "card.desc.earth_golem": "An elemental construct that protects the ancient lands.",
    "card.desc.dragon_knight": "A knight who masters draconic technology.",
    "card.desc.evolution_spell": "Manipulates time to enhance your creatures.",
    "card.desc.chaos_portal": "An unstable portal that transforms energy.",
    "card.desc.elf_engineer": "An elf master who understands the flow of time.",
    "card.desc.orc_reborn": "An orc resurrected and enhanced with fire magic.",
    "card.desc.volcanic_rex": "A T-rex fused with magma and technology.",
    "card.desc.ether_storm": "A spell that tears through reality itself.",
    "card.desc.ancestor_shrine": "A sacred place where ancestors grant their blessings.",
    "card.desc.obsidian_dragon": "A dragon forged in volcanoes and enhanced with technology.",
    "card.desc.void_dino": "A prehistoric predator consumed by the void.",
    "card.desc.era_titan": "A fusion of technology, magic, and prehistoric evolution.",
    "card.desc.architect": "The creator of the world collision.",
    "card.desc.harmony": "The perfect manifestation of elemental balance.",
    // Flavor texts
    "card.flavor.warrior_neandertal": "Evolution has no limits when technology unites with nature.",
    "card.flavor.drone_explorer": "Mechanical eyes see what mortals ignore.",
    "card.flavor.fire_arrow": "The fire that burned the ancients still burns in our hands.",
    "card.flavor.energy_field": "The earth remembers its ancient inhabitants.",
    "card.flavor.metal_beetle": "Even the small can be resilient.",
    "card.flavor.wasteland_warrior": "The wasteland doesn't forgive, but it also keeps forging warriors.",
    "card.flavor.earth_golem": "The earth rises to protect what is hers.",
    "card.flavor.dragon_knight": "The fire of the past meets the technology of the future.",
    "card.flavor.evolution_spell": "Time is a resource... if you know how to use it.",
    "card.flavor.chaos_portal": "Chaos is just order we don't understand... yet.",
    "card.flavor.elf_engineer": "Elves have always been long-lived; now they are also punctual.",
    "card.flavor.orc_reborn": "The forge doesn't just create weapons; it also creates warriors.",
    "card.flavor.volcanic_rex": "The king of dinosaurs has evolved... and is furious.",
    "card.flavor.ether_storm": "Ether distinguishes between ally and enemy; it only obeys power.",
    "card.flavor.ancestor_shrine": "The ancestors never abandon their own.",
    "card.flavor.obsidian_dragon": "The blackest metal contains the brightest fire.",
    "card.flavor.void_dino": "The void claims everything, even prehistoric kings.",
    "card.flavor.era_titan": "Where past, present and future collide, absolute destruction is born.",
    "card.flavor.architect": "I saw the end of all ages and decided they needed to unite.",
    "card.flavor.harmony": "When the eight elements sing in harmony, the gods listen.",
    // Ability names
    "card.ability.synergy_prehistoric": "Prehistoric Synergy",
    "card.ability.tactical_scan": "Tactical Scan",
    "card.ability.igneous_impact": "Igneous Impact",
    "card.ability.ancestral_energy": "Ancestral Energy",
    "card.ability.resistance": "Resistance",
    "card.ability.defender": "Defender",
    "card.ability.cyber_breath": "Cybernetic Fire Breath",
    "card.ability.accelerated_evolution": "Accelerated Evolution",
    "card.ability.chaotic_transmutation": "Chaotic Transmutation",
    "card.ability.temporal_manipulation": "Temporal Manipulation",
    "card.ability.burning_wrath": "Burning Wrath",
    "card.ability.intimidate": "Intimidate",
    "card.ability.final_eruption": "Final Eruption",
    "card.ability.dimensional_tear": "Dimensional Tear",
    "card.ability.ancestral_blessing": "Ancestral Blessing",
    "card.ability.ancient_protection": "Ancient Protection",
    "card.ability.molten_wings": "Molten Wings",
    "card.ability.obsidian_armor": "Obsidian Armor",
    "card.ability.void_touch": "Void Touch",
    "card.ability.arcane_immunity": "Arcane Immunity",
    "card.ability.era_challenge": "Era Challenge",
    "card.ability.triple_synergy": "Triple Synergy",
    "card.ability.world_collision": "World Collision",
    "card.ability.absolute_reconstruction": "Absolute Reconstruction",
    "card.ability.diversity_mastery": "Diversity Mastery",
    "card.ability.celestial_restriction": "Celestial Restriction",
    "card.ability.perfect_balance": "Perfect Balance",
    "card.ability.elemental_resonance": "Elemental Resonance",
    // Ability descriptions
    "card.ability.synergy_prehistoric_desc": "If there's another HUMAN creature on the field, +1/+1",
    "card.ability.tactical_scan_desc": "On enter: Draw 1 card",
    "card.ability.igneous_impact_desc": "Deals 3 damage to a creature or player",
    "card.ability.ancestral_energy_desc": "HUMAN creatures cost 1 less mana",
    "card.ability.resistance_desc": "This creature can block an additional creature",
    "card.ability.defender_desc": "This creature cannot attack",
    "card.ability.cyber_breath_desc": "On enter: Deals 2 damage to all enemy creatures",
    "card.ability.accelerated_evolution_desc": "Transforms a Common creature in your hand into a random Uncommon version of the same attribute",
    "card.ability.chaotic_transmutation_desc": "Once per turn, you can pay 1 mana of any element to generate 1 mana of a different random element",
    "card.ability.temporal_manipulation_desc": "On attack: You can make this creature unblockable this turn",
    "card.ability.burning_wrath_desc": "When this creature takes damage, gains +2/+0 until end of turn",
    "card.ability.intimidate_desc": "Enemy creatures with less attack cannot block",
    "card.ability.final_eruption_desc": "On death: Deals 3 damage to all",
    "card.ability.dimensional_tear_desc": "Returns all enemy creatures with 3 or less attack to hand. Draw 1 card for each creature returned",
    "card.ability.ancestral_blessing_desc": "At the start of your turn, you gain 1 life for each HUMAN creature you control",
    "card.ability.ancient_protection_desc": "Your HUMAN creatures have +0/+2",
    "card.ability.molten_wings_desc": "Can attack the turn it enters",
    "card.ability.obsidian_armor_desc": "The first time it would take damage each turn, negate that damage",
    "card.ability.void_touch_desc": "When dealing combat damage, controller loses 2 life",
    "card.ability.arcane_immunity_desc": "Immune to spells",
    "card.ability.era_challenge_desc": "When attacking, choose up to 3 enemy creatures; they must block this Titan if able",
    "card.ability.triple_synergy_desc": "If there are DINOSAUR, MECHA and HUMAN creatures on your field, it has 'Double Strike'",
    "card.ability.world_collision_desc": "When entering the field, destroys all Field Alterers in play",
    "card.ability.absolute_reconstruction_desc": "Then, play any number of Field Alterers from your hand without paying their cost",
    "card.ability.diversity_mastery_desc": "Your creatures gain +2/+2 for each different creature subtype you control",
    "card.ability.celestial_restriction_desc": "Only works if you have 3+ different elements on your field",
    "card.ability.perfect_balance_desc": "All your creatures gain +3/+3 and abilities of each present element",
    "card.ability.elemental_resonance_desc": "At the end of each turn, you gain 1 life for each different element you control",
    // Land card names
    "card.land_fire": "Basic Fire Land",
    "card.land_water": "Basic Water Land",
    "card.land_nature": "Basic Nature Land",
    "card.land_lightning": "Basic Lightning Land",
    "card.land_void": "Basic Void Land",
    "card.land_normal": "Basic Normal Land",
    "card.land_earth": "Basic Earth Land",
    "card.land_metal": "Basic Metal Land",
    // Land card descriptions
    "card.desc.land_fire": "A burning land that channels the power of fire.",
    "card.desc.land_water": "An aquatic land that channels the power of water.",
    "card.desc.land_nature": "A fertile land that channels the power of nature.",
    "card.desc.land_lightning": "An electric land that channels the power of lightning.",
    "card.desc.land_void": "A dark land that channels the power of the void.",
    "card.desc.land_normal": "A common land that channels colorless mana.",
    "card.desc.land_earth": "A solid land that channels the power of earth.",
    "card.desc.land_metal": "A metallic land that channels the power of metal.",
    // Land flavor texts
    "card.flavor.land_fire": "The heat from the world's core flows through this land.",
    "card.flavor.land_water": "Underground currents never stop flowing.",
    "card.flavor.land_nature": "Life sprouts from every grain of this sacred land.",
    "card.flavor.land_lightning": "Static electricity never disappears from these lands.",
    "card.flavor.land_void": "Absence itself has power in these cursed lands.",
    "card.flavor.land_normal": "Simplicity itself is a form of power.",
    "card.flavor.land_earth": "The mother rock is the foundation of everything.",
    "card.flavor.land_metal": "Rare minerals shine beneath the surface.",
    // Land ability names
    "card.ability.generate_fire": "Generate Fire",
    "card.ability.generate_water": "Generate Water",
    "card.ability.generate_nature": "Generate Nature",
    "card.ability.generate_lightning": "Generate Lightning",
    "card.ability.generate_void": "Generate Void",
    "card.ability.generate_colorless": "Generate Mana",
    "card.ability.generate_earth": "Generate Earth",
    "card.ability.generate_metal": "Generate Metal",
    // Land ability descriptions
    "card.ability.generate_fire_desc": "Tap this card to generate 1 Fire mana",
    "card.ability.generate_water_desc": "Tap this card to generate 1 Water mana",
    "card.ability.generate_nature_desc": "Tap this card to generate 1 Nature mana",
    "card.ability.generate_lightning_desc": "Tap this card to generate 1 Lightning mana",
    "card.ability.generate_void_desc": "Tap this card to generate 1 Void mana",
    "card.ability.generate_colorless_desc": "Tap this card to generate 1 colorless mana",
    "card.ability.generate_earth_desc": "Tap this card to generate 1 Earth mana",
    "card.ability.generate_metal_desc": "Tap this card to generate 1 Metal mana",
    // Sanctuary (Legendary Land) names
    "card.sanctuary_fire": "Sanctuary of Fire",
    "card.sanctuary_water": "Sanctuary of Water",
    "card.sanctuary_nature": "Sanctuary of Nature",
    "card.sanctuary_lightning": "Sanctuary of Lightning",
    "card.sanctuary_void": "Sanctuary of Void",
    "card.sanctuary_normal": "Sanctuary Normal",
    "card.sanctuary_earth": "Sanctuary of Earth",
    "card.sanctuary_metal": "Sanctuary of Metal",
    // Sanctuary descriptions
    "card.desc.sanctuary": "A sacred land that can generate mana for legendary cards.",
    // Throne (Celestial Land) names
    "card.throne_fire": "Throne of Fire",
    "card.throne_water": "Throne of Water",
    "card.throne_nature": "Throne of Nature",
    "card.throne_lightning": "Throne of Lightning",
    "card.throne_void": "Throne of Void",
    "card.throne_normal": "Throne Normal",
    "card.throne_earth": "Throne of Earth",
    "card.throne_metal": "Throne of Metal",
    // Throne descriptions
    "card.desc.throne": "The seat of the gods. Can generate mana for celestial cards.",
  }
};

// Mapeo de nombres de cartas a claves de traducción
const cardNameMapping: { [key: string]: string } = {
  "Caracol Volcánico": "card.volcanic_snail",
  "Volcán del fin": "card.volcan_del_fin",
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
  // Land cards
  "Tierra Básica de Fuego": "card.land_fire",
  "Tierra Básica de Agua": "card.land_water",
  "Tierra Básica de Naturaleza": "card.land_nature",
  "Tierra Básica de Rayo": "card.land_lightning",
  "Tierra Básica de Vacío": "card.land_void",
  "Tierra Básica Normal": "card.land_normal",
  "Tierra Básica de Tierra": "card.land_earth",
  "Tierra Básica de Metal": "card.land_metal",
  // Sanctuary cards
  "Santuario de Fuego": "card.sanctuary_fire",
  "Santuario de Agua": "card.sanctuary_water",
  "Santuario de Naturaleza": "card.sanctuary_nature",
  "Santuario de Rayo": "card.sanctuary_lightning",
  "Santuario de Vacío": "card.sanctuary_void",
  "Santuario Normal": "card.sanctuary_normal",
  "Santuario de Tierra": "card.sanctuary_earth",
  "Santuario de Metal": "card.sanctuary_metal",
  // Throne cards
  "Trono de Fuego": "card.throne_fire",
  "Trono de Agua": "card.throne_water",
  "Trono de Naturaleza": "card.throne_nature",
  "Trono de Rayo": "card.throne_lightning",
  "Trono de Vacío": "card.throne_void",
  "Trono Normal": "card.throne_normal",
  "Trono de Tierra": "card.throne_earth",
  "Trono de Metal": "card.throne_metal",
};

// Mapeo de descripciones de cartas (español -> clave de traducción)
const cardDescriptionMapping: { [key: string]: string } = {
  "Una pequeña alimaña protegida por una gruesa espiral de obsidiana ardiente.": "card.desc.volcanic_snail",
  "Un volcán que transforma sacrificios en maná y deja una última promesa entre sus cenizas.": "card.desc.volcan_del_fin",
  "Un guerrero prehistórico mejorado con tecnología futurista.": "card.desc.warrior_neandertal",
  "Un dron que analiza el campo de batalla en busca de oportunidades.": "card.desc.drone_explorer",
  "Un hechizo de fuego pasado de generación en generación.": "card.desc.fire_arrow",
  "Un alterador que potencia las criaturas humanas.": "card.desc.energy_field",
  "Un insecto mecánico rescatado de ruinas olvidadas.": "card.desc.metal_beetle",
  "Un sobreviviente endurecido por las tierras devastadas.": "card.desc.wasteland_warrior",
  "Un constructo elemental que protege las tierras antiguas.": "card.desc.earth_golem",
  "Un caballero que domina la tecnología dragónica.": "card.desc.dragon_knight",
  "Manipula el tiempo para mejorar tus criaturas.": "card.desc.evolution_spell",
  "Un portal inestable que transforma la energía.": "card.desc.chaos_portal",
  "Un maestro elfo que comprende el flujo del tiempo.": "card.desc.elf_engineer",
  "Un orco resucitado y mejorado con magia de fuego.": "card.desc.orc_reborn",
  "Un tiranosaurio fusionado con magma y tecnología.": "card.desc.volcanic_rex",
  "Un hechizo que desgarra la realidad misma.": "card.desc.ether_storm",
  "Un lugar sagrado donde los antiguos otorgan sus bendiciones.": "card.desc.ancestor_shrine",
  "Un dragón forjado en los volcanes y mejorado con tecnología.": "card.desc.obsidian_dragon",
  "Un depredador prehistórico consumido por el vacío.": "card.desc.void_dino",
  "Una fusión de tecnología, magia y evolución prehistórica.": "card.desc.era_titan",
  "El creador de la colisión de mundos.": "card.desc.architect",
  "La manifestación perfecta del equilibrio elemental.": "card.desc.harmony",
  // Land descriptions
  "Una tierra ardiente que canaliza el poder del fuego.": "card.desc.land_fire",
  "Una tierra acuática que canaliza el poder del agua.": "card.desc.land_water",
  "Una tierra fértil que canaliza el poder de la naturaleza.": "card.desc.land_nature",
  "Una tierra eléctrica que canaliza el poder del rayo.": "card.desc.land_lightning",
  "Una tierra oscura que canaliza el poder del vacío.": "card.desc.land_void",
  "Una tierra común que canaliza mana sin elemento.": "card.desc.land_normal",
  "Una tierra sólida que canaliza el poder de la tierra.": "card.desc.land_earth",
  "Una tierra metálica que canaliza el poder del metal.": "card.desc.land_metal",
};

// Mapeo de descripciones de habilidades (español -> clave de traducción)
const abilityDescriptionMapping: { [key: string]: string } = {
  "Al morir: Puedes elegir 1 criatura de coste 2 de maná o menos de tu mazo y destruirla, enviándola al cementerio.": "card.ability.final_ash_trail_desc",
  "Una vez por turno: Puedes sacrificar una criatura que controles; añade 1 Mana de Fuego de tu mazo a tu mano.": "card.ability.crater_offering_desc",
  "Si esta carta es destruida: Destruye todas las criaturas y cartas de campo que controles. Después, busca 1 criatura DRAGON de tu mazo, a tu elección, y añádela a tu mano. Conservas tus fuentes de maná.": "card.ability.final_awakening_desc",
  "Solo puedes controlar 1 Volcán del fin activo.": "card.ability.only_one_end_desc",
  "Si hay otra criatura HUMANO en campo, +1/+1": "card.ability.synergy_prehistoric_desc",
  "Al entrar: Roba 1 carta": "card.ability.tactical_scan_desc",
  "Inflige 3 de daño a una criatura o jugador": "card.ability.igneous_impact_desc",
  "Las criaturas HUMANAS cuestan 1 menos de mana": "card.ability.ancestral_energy_desc",
  "Esta criatura puede bloquear a una criatura adicional": "card.ability.resistance_desc",
  "Esta criatura no puede atacar": "card.ability.defender_desc",
  "Al entrar: Inflige 2 de daño a todas las criaturas enemigas": "card.ability.cyber_breath_desc",
  "Transforma una criatura Común en tu mano en una versión Infrecuente aleatoria del mismo atributo": "card.ability.accelerated_evolution_desc",
  "Una vez por turno, puedes pagar 1 mana de cualquier elemento para generar 1 mana de un elemento diferente al azar": "card.ability.chaotic_transmutation_desc",
  "Al atacar: Puedes hacer que esta criatura no sea bloqueable este turno": "card.ability.temporal_manipulation_desc",
  "Cuando esta criatura recibe daño, gana +2/+0 hasta el final del turno": "card.ability.burning_wrath_desc",
  "Las criaturas enemigas con menos ataque no pueden bloquear": "card.ability.intimidate_desc",
  "Al morir: Inflige 3 de daño a todos": "card.ability.final_eruption_desc",
  "Devuelve todas las criaturas enemigas con 3 o menos de ataque a la mano. Roba 1 carta por cada criatura devuelta": "card.ability.dimensional_tear_desc",
  "Al inicio de tu turno, ganas 1 vida por cada criatura HUMANA que controles": "card.ability.ancestral_blessing_desc",
  "Tus criaturas HUMANAS tienen +0/+2": "card.ability.ancient_protection_desc",
  "Puede atacar en el turno que entra": "card.ability.molten_wings_desc",
  "La primera vez que recibiría daño cada turno, niega ese daño": "card.ability.obsidian_armor_desc",
  "Cuando hace daño de combate, el controlador pierde 2 vidas": "card.ability.void_touch_desc",
  "Inmune a hechizos": "card.ability.arcane_immunity_desc",
  "Cuando ataca, elige hasta 3 criaturas enemigas; deben bloquear a este Titán si pueden": "card.ability.era_challenge_desc",
  "Si hay criaturas DINOSAURIO, MECHA y HUMANO en tu campo, tiene 'Ataque Doble'": "card.ability.triple_synergy_desc",
  "Cuando entra al campo, destruye todos los Alteradores de Campo en juego": "card.ability.world_collision_desc",
  "Luego, juega cualquier número de Alteradores de Campo desde tu mano sin pagar su costo": "card.ability.absolute_reconstruction_desc",
  "Tus criaturas ganan +2/+2 por cada subtipo diferente de criatura que controles": "card.ability.diversity_mastery_desc",
  "Solo funciona si tienes 3+ elementos diferentes en tu campo": "card.ability.celestial_restriction_desc",
  "Todas tus criaturas ganan +3/+3 y habilidades de cada elemento presente": "card.ability.perfect_balance_desc",
  "Al final de cada turno, ganas 1 vida por cada elemento diferente que controles": "card.ability.elemental_resonance_desc",
  // Land ability descriptions
  "Gasta esta carta para generar 1 mana de Fuego": "card.ability.generate_fire_desc",
  "Gasta esta carta para generar 1 mana de Agua": "card.ability.generate_water_desc",
  "Gasta esta carta para generar 1 mana de Naturaleza": "card.ability.generate_nature_desc",
  "Gasta esta carta para generar 1 mana de Rayo": "card.ability.generate_lightning_desc",
  "Gasta esta carta para generar 1 mana de Vacío": "card.ability.generate_void_desc",
  "Gasta esta carta para generar 1 mana incoloro": "card.ability.generate_colorless_desc",
  "Gasta esta carta para generar 1 mana de Tierra": "card.ability.generate_earth_desc",
  "Gasta esta carta para generar 1 mana de Metal": "card.ability.generate_metal_desc",
};

// Mapeo de nombres de habilidades (español -> clave de traducción)
const abilityNameMapping: { [key: string]: string } = {
  "Último rastro de ceniza": "card.ability.final_ash_trail",
  "Ofrenda al cráter": "card.ability.crater_offering",
  "El último despertar": "card.ability.final_awakening",
  "Un solo fin": "card.ability.only_one_end",
  "Sinergia Prehistórica": "card.ability.synergy_prehistoric",
  "Escaneo Táctico": "card.ability.tactical_scan",
  "Impacto Ígneo": "card.ability.igneous_impact",
  "Energía Ancestral": "card.ability.ancestral_energy",
  "Resistencia": "card.ability.resistance",
  "Defensor": "card.ability.defender",
  "Aliento de Fuego Cibernético": "card.ability.cyber_breath",
  "Evolución Acelerada": "card.ability.accelerated_evolution",
  "Transmutación Caótica": "card.ability.chaotic_transmutation",
  "Manipulación Temporal": "card.ability.temporal_manipulation",
  "Ira Ardiente": "card.ability.burning_wrath",
  "Intimidar": "card.ability.intimidate",
  "Erupción Final": "card.ability.final_eruption",
  "Desgarre Dimensional": "card.ability.dimensional_tear",
  "Bendición Ancestral": "card.ability.ancestral_blessing",
  "Protección Antigua": "card.ability.ancient_protection",
  "Alas de Acero Fundido": "card.ability.molten_wings",
  "Armadura de Obsidiana": "card.ability.obsidian_armor",
  "Toque del Vacío": "card.ability.void_touch",
  "Inmunidad Arcana": "card.ability.arcane_immunity",
  "Desafío de Eras": "card.ability.era_challenge",
  "Sinergia Triple": "card.ability.triple_synergy",
  "Colisión de Mundos": "card.ability.world_collision",
  "Reconstrucción Absoluta": "card.ability.absolute_reconstruction",
  "Maestría de la Diversidad": "card.ability.diversity_mastery",
  "Restricción Celestial": "card.ability.celestial_restriction",
  "Equilibrio Perfecto": "card.ability.perfect_balance",
  "Resonancia Elemental": "card.ability.elemental_resonance",
  // Land ability names
  "Generar Fuego": "card.ability.generate_fire",
  "Generar Agua": "card.ability.generate_water",
  "Generar Naturaleza": "card.ability.generate_nature",
  "Generar Rayo": "card.ability.generate_lightning",
  "Generar Vacío": "card.ability.generate_void",
  "Generar Mana": "card.ability.generate_colorless",
  "Generar Tierra": "card.ability.generate_earth",
  "Generar Metal": "card.ability.generate_metal",
};

// Mapeo de flavor texts (español -> clave de traducción)
const flavorTextMapping: { [key: string]: string } = {
  "Hasta su último rastro deja algo bajo las cenizas.": "card.flavor.volcanic_snail",
  "Cuando despierte, el fuego reclamará todo salvo su último heredero.": "card.flavor.volcan_del_fin",
  "La evolución no tiene límites cuando la tecnología se une con la naturaleza.": "card.flavor.warrior_neandertal",
  "Los ojos mecánicos ven lo que los mortales ignoran.": "card.flavor.drone_explorer",
  "El fuego que quemó a los antiguos aún arde en nuestras manos.": "card.flavor.fire_arrow",
  "La tierra recuerda a sus antiguos habitantes.": "card.flavor.energy_field",
  "Incluso los pequeños pueden ser resistentes.": "card.flavor.metal_beetle",
  "El yermo no perdona, pero tampoco deja de forjar guerreros.": "card.flavor.wasteland_warrior",
  "La tierra se alza para proteger lo suyo.": "card.flavor.earth_golem",
  "El fuego del pasado se encuentra con la tecnología del futuro.": "card.flavor.dragon_knight",
  "El tiempo es un recurso... si sabes cómo usarlo.": "card.flavor.evolution_spell",
  "El caos es solo orden que no entendemos... todavía.": "card.flavor.chaos_portal",
  "Los elfos siempre han sido longevos; ahora también son puntuales.": "card.flavor.elf_engineer",
  "La forja no solo crea armas; también crea guerreros.": "card.flavor.orc_reborn",
  "El rey de los dinosaurios ha evolucionado... y está furioso.": "card.flavor.volcanic_rex",
  "El éter no distingue entre aliado y enemigo; solo obedece al poder.": "card.flavor.ether_storm",
  "Los ancestros nunca abandonan a los suyos.": "card.flavor.ancestor_shrine",
  "El metal más negro contiene el fuego más brillante.": "card.flavor.obsidian_dragon",
  "El vacío reclama todo, incluso a los reyes prehistóricos.": "card.flavor.void_dino",
  "Donde pasado, presente y futuro colisionan, nace la destrucción absoluta.": "card.flavor.era_titan",
  "Yo vi el final de todas las eras y decidí que necesitaban unirse.": "card.flavor.architect",
  "Cuando los ocho elementos cantan en armonía, los dioses escuchan.": "card.flavor.harmony",
  // Land flavor texts
  "El calor del núcleo del mundo fluye a través de esta tierra.": "card.flavor.land_fire",
  "Las corrientes subterráneas nunca dejan de fluir.": "card.flavor.land_water",
  "La vida brota de cada grano de esta tierra sagrada.": "card.flavor.land_nature",
  "La electricidad estática nunca desaparece de estas tierras.": "card.flavor.land_lightning",
  "La ausencia misma tiene poder en estas tierras malditas.": "card.flavor.land_void",
  "La simplicidad misma es una forma de poder.": "card.flavor.land_normal",
  "La roca madre es la base de todo.": "card.flavor.land_earth",
  "Los minerales raros brillan bajo la superficie.": "card.flavor.land_metal",
};

interface I18nContextType {
  language: string;
  changeLanguage: (lang: string) => void;
  t: (key: string, options?: any) => string;
  translateCardName: (cardName: string) => string;
  translateCardDescription: (description: string) => string;
  translateAbilityDescription: (description: string) => string;
  translateAbilityName: (name: string) => string;
  translateFlavorText: (flavorText: string) => string;
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

  const translateCardDescription = (description: string): string => {
    const translationKey = cardDescriptionMapping[description];
    if (translationKey) {
      return t(translationKey);
    }
    return description;
  };

  const translateAbilityDescription = (description: string): string => {
    const translationKey = abilityDescriptionMapping[description];
    if (translationKey) {
      return t(translationKey);
    }
    return description;
  };

  const translateAbilityName = (name: string): string => {
    const translationKey = abilityNameMapping[name];
    if (translationKey) {
      return t(translationKey);
    }
    return name;
  };

  const translateFlavorText = (flavorText: string): string => {
    const translationKey = flavorTextMapping[flavorText];
    if (translationKey) {
      return t(translationKey);
    }
    return flavorText;
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900">
        <div className="text-white text-2xl">Loading...</div>
      </div>
    );
  }

  return (
    <I18nContext.Provider value={{ language, changeLanguage, t, translateCardName, translateCardDescription, translateAbilityDescription, translateAbilityName, translateFlavorText, ready }}>
      {children}
    </I18nContext.Provider>
  );
}
