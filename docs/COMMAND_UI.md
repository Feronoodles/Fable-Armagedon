# Centro de mando

La interfaz fuera del combate comparte navegación, recursos y materiales: piedra oscura, metal envejecido, latón, bordes rectos y sombras duras. Los colores de elemento, tipo y rareza se conservan en las cartas.

## Recorridos

- Cuartel: una acción principal para entrar a la arena, un mazo preparado y un resumen del arsenal.
- Mis mazos: búsqueda, creación y entrada al taller. Preferir o eliminar un mazo aparece en su menú de opciones; eliminar conserva las cartas y requiere confirmación.
- Taller: colección y mazo juntos, guardado único, límites y copias disponibles, filtros avanzados desplegables, maná sugerido y vaciar/deshacer. La navegación del centro de mando avisa cuando hay cambios sin guardar.
- Colección: cartas propias o catálogo completo; búsqueda por nombre/efecto, filtros por tipo, elemento, rareza, subtipo y costo; visor compacto compartido.
- Sobres: inventario y armería separados. Se elige moneda y cantidad (1–100), con precio unitario, total y saldo insuficiente visibles. Volcán Dormido muestra el Dragón Volcánico como portada, sus probabilidades de rareza y las probabilidades base de sus cartas destacadas. Los resultados permiten inspeccionar cartas y volver al sobre abierto.
- Perfil: datos del jugador, resultados registrados, progreso real de colección, idioma y cierre de sesión.
- Preparación de batalla y mazos iniciales: selección clara y composición visible. El acceso y el registro usan los mismos materiales.

## Archivos

- `src/components/command/`: navegación, diálogos, tarjetas de catálogo y lecturas autenticadas cancelables. Las respuestas se asocian a la cuenta que las solicitó.
- `src/app/command-ui.css`: tema y adaptación a pantallas pequeñas, acotados para no cambiar la arena. Incluye foco visible, navegación por teclado y movimiento reducido.
- `src/app/api/player/route.ts`: lectura privada del jugador autenticado y agregados de su colección, mazos y sobres. No modifica datos ni requiere migración.
- `public/assets/ui/citadel-command.webp`: fondo original generado con la herramienta integrada ImageGen, comprimido a WebP (212.724 bytes).
- `docs/command-ui-art.json`: prompt final y ubicación del original conservado en `.artwork/ui/`.

## Comprobación

TypeScript, ESLint de los archivos de la interfaz y compilación de producción correctos. Se comprobaron por HTTP las páginas, redirecciones de acceso, estilos compilados, fondo y respuesta 401 del perfil sin sesión. No se consumieron sobres ni moneda para probar la interfaz.

La revisión visual e interactiva en navegador no pudo completarse por la limitación de acceso del entorno. Las estadísticas muestran los valores almacenados; esta interfaz no añade persistencia de resultados de combate.
