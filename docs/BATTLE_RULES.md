# Reglas del motor y verificación

El catálogo compartido está en src/game-engine/catalog.ts. El seed utiliza ese mismo catálogo y la clasificación común de expansiones en src/game-engine/expansions.ts. Hay 95 cartas, incluidos Volcán del fin y Caracol Volcánico. Para añadir o actualizar una carta en una base existente, ejecutar npm run sync:card -- "Nombre de la carta"; los atajos sync:volcan-del-fin y sync:caracol-volcanico se mantienen disponibles. La sincronización vincula los sobres a su expansión sin modificar probabilidades ni precios.

## Efectos

- Los hechizos ejecutan todas sus habilidades instantáneas en orden. Los efectos de entrada, muerte, daño, ataque, sacrificio, inicio y final de turno se resuelven mediante una cola.
- El controlador humano elige objetivos, búsquedas, cartas para resucitar, sacrificios y hasta tres bloqueadores cuando corresponde. La CPU toma sus propias decisiones.
- En Ritual de Incineración Total cada jugador elige su sacrificio. Ambos se retiran juntos y ambos jugadores reciben 2 de daño por cada criatura sacrificada.
- Las condiciones de invocación se comprueban antes de gastar maná. Los sacrificios liberan posiciones incluso cuando las seis estaban ocupadas.
- Astravor ofrece una respuesta a efectos enemigos. Negar consume su uso del turno y destruye la fuente cuando sigue en el campo. Su protección limita los objetivos seleccionables; los efectos de área conservan su área.
- Las habilidades que roban varias cartas no pierden robos al superar siete cartas. Se roba el conjunto y después el jugador descarta hasta quedarse con siete.
- Una búsqueda específica sin coincidencias no roba otra carta. Intentar robar desde un mazo agotado sí hace perder la partida.
- Una habilidad desconocida produce un mensaje explícito y no se considera implementada.
- Volcán del fin es un campo épico de Volcán Dormido y cuesta dos unidades de Fuego. Una vez por turno permite sacrificar cualquier criatura propia y buscar un Mana de Fuego básico para la mano. Si no queda ese maná, la búsqueda no hace perder por mazo vacío.
- Al destruir Volcán del fin, se destruyen primero todas las criaturas y campos de su controlador; se conservan las fuentes de maná. Después se elige cualquier criatura DRAGON del mazo para la mano. La destrucción ocurre aunque no haya dragones. Solo puede haber una copia activa por controlador, también al jugar campos gratis.
- Caracol Volcánico es una criatura rara de Fuego, coste 1, ATQ 1 / DEF 4, del nuevo subtipo ALIMANA (Alimaña). Al morir permite elegir cero o una criatura del propio mazo de coste impreso 2 o inferior, de cualquier elemento, y destruirla. Hechizos, campos y maná no son objetivos válidos. El selector incluye la opción No usar habilidad; sin criaturas elegibles se omite sin bloquear la partida ni causar una derrota por robo.
- Destruir una criatura desde el mazo la lleva al cementerio y activa sus habilidades Al morir, además de las respuestas a destrucción de Fuego cuando corresponda. Destruir el Huevo con el Caracol activa Herencia Ígnea y busca un Dragón Volcánico. No se activan habilidades Al invocar ni de sacrificio. Cada copia destruida sale del mazo una sola vez; otra copia del Caracol puede continuar la cadena con su propia elección opcional.
- Los diez subtipos de criaturas y sus etiquetas se comparten en src/game-engine/subtypes.ts; Alimaña aparece en fichas, detalle de combate y filtros del taller al tener una copia en la colección.

## Combate

- Ambos jugadores empiezan con 25 de vida y un máximo de 25. La curación se limita a ese máximo. Sus contadores incluyen una barra pequeña que acompaña los cambios de vida y cambia de verde a ámbar y rojo al bajar.
- Atacan las criaturas del jugador activo. Las recién invocadas esperan al siguiente turno, salvo prisa. El primer turno del jugador no tiene combate.
- Los bloqueadores corresponden a la misma posición, a un bloqueo obligatorio o a la habilidad de bloquear una criatura adicional.
- El daño de combate es simultáneo y se marca hasta el final del turno. Una criatura muere cuando el daño alcanza su defensa efectiva, también en caso de igualdad.
- En un bloqueo múltiple el ataque disponible se asigna en orden a los bloqueadores; estos responden simultáneamente. No hay daño sobrante al jugador sin una habilidad que lo permita.
- Un doble ataque tiene dos ataques como máximo. Un bloqueador superviviente puede seguir bloqueando al mismo atacante en su segundo ataque.
- Asalto Dragón de General Volcánico Kharzeth requiere otra criatura DRAGON en el campo de su controlador; él mismo no cumple la condición. Otra copia de Kharzeth sí cuenta. La condición es continua: al salir el otro dragón se pierde el segundo ataque pendiente, salvo que otra habilidad independiente conceda doble ataque.
- La prevención de daño se consume únicamente cuando evita un daño positivo y se restablece al cambiar de turno. La inmunidad a hechizos se aplica también al daño de área de hechizos.
- Los bonos permanentes se conservan entre turnos. Los temporales y el daño marcado se eliminan al cambiar de turno. Abandonar el campo elimina ambos tipos de bonos.
- Si al desaparecer un aura el daño marcado pasa a ser letal, también mueren las criaturas afectadas.
- Si ambos jugadores llegan a cero vidas, el resultado es empate.

## Maná

Cada carta de maná disponible paga una sola unidad, elegida entre sus alternativas impresas. Un santuario puede pagar su elemento o maná legendario; un trono, su elemento o maná celestial. Una fuente no se cuenta dos veces.

El costo impreso es el total a pagar: se reserva una unidad por tipo específico y, cuando corresponde, una unidad legendaria o celestial. El resto del costo es genérico. Una carta de costo 10 que requiere Fuego y Legendario consume diez fuentes en total, incluyendo al menos una que pueda pagar Legendario y otra que pueda pagar Fuego.

En la arena, las fuentes especiales conservan una marca L dorada o C violeta aunque se agoten al pagar un costo elemental o genérico. Los contadores Legendario/Celestial muestran disponibles/totales e incluyen fuentes ya contadas en el total general. Pulsar cualquier fuente abre sus alternativas y estado en los detalles. La ficha de cartas legendarias/celestiales incluye el requisito especial de su rareza aunque no aparezca escrito en `manaTypes`.

Al jugarlas desde la mano, las cartas especiales actuales requieren:

| Carta | Costo total y fuentes incluidas | Condición adicional |
| --- | --- | --- |
| Emperador Volcánico Ignathor | 10: Fuego + Legendario + 8 cualesquiera | Sacrificar un Dragón de Guerra Volcánico propio. |
| Sumo Hierofante Pyrothar | 10: Fuego + Legendario + 8 cualesquiera | Sacrificar dos criaturas propias de Fuego. |
| Juramento del Trono Ígneo | 5: Fuego + Legendario + 3 cualesquiera | Controlar un Dragón de Guerra Volcánico y tener a Ignathor o Astravor en el mazo para buscarlo. Máximo uno por turno. Es un hechizo. |
| Dominus Volcánico Astravor | 10: Fuego + Celestial + 8 cualesquiera | Sacrificar un Dragón de Guerra Volcánico propio. |
| El Arquitecto del Armagedón Fable | 8: Fuego + Agua + Naturaleza + Rayo + Legendario + 3 cualesquiera | Sin sacrificio; requiere una posición de criatura libre. |
| Armonía de los 8 Mundos | 6: Fuego + Agua + Naturaleza + Celestial + 2 cualesquiera | Tres elementos distintos entre criaturas, campos y fuentes de maná propios. Es una carta de campo. |

Los símbolos de cada pago requieren fuentes diferentes. Un santuario no paga a la vez Fuego y Legendario ni un trono Fuego y Celestial. Santuarios y tronos se juegan como otras fuentes: uno por turno y sin costo de maná. Los sacrificios de invocación liberan posiciones del campo.

## Decisiones para textos que no especificaban todos los detalles

- Ignathor destruye las otras criaturas al entrar y gana el bono por cada una destruida; se conserva a sí mismo para poder recibir ese bono.
- Armonía exige tres elementos diferentes en campo. Al estar activa, otorga +3/+3 y los beneficios de los elementos presentes: Fuego, prisa; Agua, primera prevención de daño del turno; Naturaleza, bloqueo adicional; Rayo, dos ataques; Vacío, intimidar; Tierra, +2 DEF; Metal, inmunidad a hechizos; Normal, +1 ATQ. Estos beneficios se detallan también en la inspección de la carta.

## Ilustraciones y diseño

Se generó una ilustración individual por carta con la herramienta integrada image_gen, siguiendo su nombre, descripción, elemento y rareza, en un estilo común de fantasía y tecnología.

- Archivos utilizados por el juego: public/assets/cards/*.webp (95 cartas ilustradas, además de versiones revisadas).
- Originales conservados: .artwork/cards/*.png (excluidos de Git y Docker).
- Prompts y correspondencia entre cartas y archivos: docs/card-art-prompts.json.
- Ilustración de Volcán del fin: public/assets/cards/volcan-del-fin.webp; prompt y herramienta en docs/volcan-del-fin-art.json.
- Ilustración de Caracol Volcánico: public/assets/cards/caracol-volcanico.webp; prompt y herramienta en docs/caracol-volcanico-art.json.
- La arena reserva filas de altura limitada para maná y cartas de campo. Ambos campos de seis posiciones y la mano comparten el espacio restante de la ventana. Solo las listas auxiliares, detalles e historial se desplazan internamente.
- El creador de mazos muestra colección y lista de mazo juntas, controles de cantidad, disponibilidad de copias, filtros, curva de maná, estado de guardado y sugerencias de maná básico.
- La inspección de cartas distribuye ilustración y reglas en dos columnas, con cabecera y botones fijos. En pantallas estrechas, la ilustración pasa a una fila compacta. Ajusta arte y espaciado a la altura disponible para evitar desplazar la ficha.
- El elemento tiñe el fondo y el coste; la rareza identifica el borde y sus gemas. Las insignias de tipo distinguen criaturas (rosa), hechizos (violeta), campos (turquesa) y maná (azul). Las fuentes de maná también muestran el color de su elemento.

## Rival CPU

Legión de Brasa usa 40 cartas principales (28 criaturas, 8 hechizos y 4 campos) y 22 manás básicos de Fuego. Incluye criaturas de coste 1–3, sinergias de dragones, estandartes y fanáticos para los rituales; dos copias de Kharzeth cierran la curva en coste 6. Respeta los límites de copias y no necesita fuentes legendarias ni celestiales. Se baraja con las mismas reglas que el jugador.

La CPU calcula los pagos antes de planificar varias jugadas, busca hechizos o campos cuando las seis posiciones están ocupadas y prioriza daño letal y refuerzos útiles. Sus elecciones automáticas conservan criaturas valiosas y aprovechan las habilidades al sacrificar.

## Lectura de los cambios durante la batalla

Los cambios de ATQ, DEF restante y vida muestran el valor anterior, el nuevo y su diferencia. Los campos y los bonos que terminan también generan avisos. El daño simultáneo resalta a todos sus objetivos en un mismo paso.

Cada cambio importante permanece 2,4 segundos (3 segundos cuando afecta a varios valores). Si una criatura muere, primero se mantiene visible el daño y después se muestra su destrucción durante 1,6 segundos. La CPU, los siguientes ataques y las cadenas de habilidades esperan estos pasos. El control Pausar / Seguir permite leerlos sin límite de tiempo; las animaciones reducidas conservan los números y las pausas. La pantalla de resultado espera al último aviso de daño letal.

Los números de las cartas, del aviso ampliado y de la vida se animan desde el valor anterior hasta el nuevo: la activación conserva el valor durante 400 ms, el conteo tarda 650 ms y el número se agranda antes de volver a su tamaño normal. Pausar congela también el conteo, los pulsos y la energía en movimiento. Con movimiento reducido se muestra el valor final sin desplazamientos.

La carta que activa el efecto emite un pulso. Una trayectoria de energía conecta su origen con el objetivo: daño, mejoras, curación y protección tienen señales distintas. Los campos también se iluminan al actuar. Un hechizo o una habilidad de una carta que ya salió del campo muestra su ilustración en el aviso central como origen. El lanzamiento de hechizos y las habilidades sin cambios numéricos disponen de un paso de activación de 1,4 segundos antes de continuar la cadena.

## Comprobaciones

Ejecutar npm run test:game para las pruebas del catálogo y de escenarios del motor.

La revisión incluye comprobación de tipos, ESLint de los módulos del juego, compilación de producción y solicitudes HTTP a las páginas y a las ilustraciones. La herramienta de revisión visual de Brave no pudo verificar la URL del navegador; no se pudo completar una prueba visual de una partida iniciada en esa ventana. El proveedor de idiomas conserva tres errores previos de ESLint (dos usos de any y la inicialización del idioma en un efecto).
