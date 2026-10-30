# Sobres y armería

Volcán Dormido usa `public/assets/cards/dragon-volcanico-v2.webp` como portada. Contiene diez cartas y garantiza al menos una rara o superior.

Probabilidades base por carta: común 44%, infrecuente 30%, rara 15%, épica 7%, legendaria 3% y celestial 1%. Primero se sortea la rareza; las cartas elegibles de esa rareza tienen el mismo peso. La garantía solo se aplica a la última carta si no salió ninguna rara o superior y sortea entre las rarezas rara, épica, legendaria y celestial con sus pesos relativos.

Hay 25 cartas elegibles del catálogo actual: las 23 cartas de la expansión y dos fuentes especiales de Fuego, sin mover estas fuentes de su expansión original. Dominus Volcánico Astravor y Trono de Fuego comparten el 1% celestial: 0,5% base para cada uno. Santuario de Fuego comparte el 3% legendario con otras tres cartas: 0,75% base. El maná especial ocupa una de las diez posiciones; el maná básico y las fuentes de otros elementos quedan excluidos. Los demás sobres conservan su filtro de expansión y su exclusión de maná.

La armería calcula las probabilidades destacadas usando las cartas realmente presentes en PostgreSQL. Las reglas y probabilidades se comparten en `src/lib/packs.ts`; el seed y `npm run sync:volcan-pack` usan la misma configuración. La sincronización específica conserva precios, cantidades de sobres, cuentas y monedas del jugador.

La compra acepta de 1 a 100 sobres enteros y mantiene compatibilidad con peticiones anteriores sin cantidad (equivalen a uno). Descontar el costo total y añadir todos los sobres es una sola transacción. Un descuento condicional impide gastar dos veces el mismo saldo con peticiones simultáneas. La apertura también es una transacción: consume una unidad, entrega exactamente las cartas indicadas y guarda todas sus copias; los errores revierten el conjunto. Los registros a cero se conservan para coordinar aperturas y compras concurrentes y se ocultan del inventario.

Pruebas: `npm run test:packs` verifica elegibilidad, porcentajes, sorteo de las cartas destacadas, garantía y cantidades válidas. `node_modules/.bin/tsx --test tests/pack-transactions.test.ts` verifica en PostgreSQL compras con oro/gemas, falta de saldo, concurrencia, entrega de diez cartas y reversión ante errores. Las pruebas de integración crean cuentas y sobres temporales y los eliminan al terminar; no consumen recursos de cuentas existentes.
