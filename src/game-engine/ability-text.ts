import type { GameAbility } from "./abilities";
export const getAbilityDescription = (ability: GameAbility, language = "es") => {
  if (ability.effect === "DOUBLE_ATTACK_IF_DRAGON") return language === "en"
    ? "While you control another Dragon besides this card, this card can attack twice per turn."
    : "Mientras controles otro Dragón además de esta carta, esta carta puede atacar dos veces por turno.";
  if (ability.effect !== "MASS_BUFF_AND_ABILITIES") return ability.description;
  return language === "en"
    ? "With at least 3 elements, your creatures gain +3/+3. Each element on your field adds: Fire — haste; Water — prevent first damage each turn; Nature — block an additional creature; Lightning — two attacks; Void — intimidate; Earth — +2 defense; Metal — spell immunity; Normal — +1 attack."
    : "Con 3 o más elementos, tus criaturas ganan +3/+3. Cada elemento en tu campo añade: Fuego — prisa; Agua — evita el primer daño de cada turno; Naturaleza — bloquea una criatura adicional; Rayo — dos ataques; Vacío — intimidar; Tierra — +2 DEF; Metal — inmunidad a hechizos; Normal — +1 ATQ.";
};
