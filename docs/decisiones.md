# Decisiones de `@onview/shared`

Único archivo del repo autorizado a nombrar el origen del fork.

## Origen (2026-11-09)

- Copia de `OnPilot.cc/shared` en el commit `3b5f632` (paquete `@onpilot/shared`
  1.2.0), sin `.git`, `node_modules` ni artefactos.
- Renombrado por bytes, de más específica a más genérica:
  `@onpilot/shared→@onview/shared`, `OnPilot-cc/shared→OnView-cc/shared`,
  `OnPilot Identity→OnView Identity`, `OnPilot Admin→OnView Admin`,
  `onpilot.cc→onview.cc`, `ONPILOT→ONVIEW`, `OnPilot→OnView`,
  `onpilot→onview`.
- La versión vuelve a `1.0.0`: es el primer paquete de OnView.
- `platformOrigin()` en localhost apunta a `http://localhost:8900` (puerto de
  `wrangler pages dev` de onview; los puertos de la familia no se pisan: 5400
  vite de onview, 5401 admin, 4450 preview del admin, 8901 pages dev del admin,
  8902 onview-studio).

## Mundo visual provisional

El mundo que trae el fork es «Airglow» (el de OnPilot): página clara, noche en
paneles, acento violeta, Geist y Geist Mono, y el glifo del asistente de
OnPilot (`sky/ion-mark.ts`). Se queda tal cual, con sus nombres, hasta el
subproyecto 2 de OnView, que lo sustituye por **«Blue Hour»** (spec
`OnView.cc/docs/superpowers/specs/2026-11-08-onview-plataforma-design.md` §10).
Por eso todavía aparecen «Airglow» e «Ion» en `styles/` y `sky/`: no son
restos olvidados, son el mundo prestado.

Spec: `OnView.cc/docs/superpowers/specs/2026-11-08-onview-plataforma-design.md`.
- **Dominio temporal `arcade.lat` (2026-11-09).** Mientras el usuario compra
  `onview.cc`, el dominio está renombrado por bytes (`onview.cc` → `arcade.lat`)
  en los cuatro repos, salvo los `docs/decisiones.md` y los `.dev.vars`. Es la
  zona que usó Northstar del 2026-10-27 al 2026-11-04 y que quedó apagada (sin
  Pages ni CNAME; quedan su DMARC `p=reject` y el registro de rebote).
  Revertir: el mismo renombrado al revés (`arcade.lat` → `onview.cc`), y
  después mover dominios de Pages, webhook de Stripe, widget de Turnstile y
  redirects de OAuth (lista en `onview/docs/plataforma.md`).
- **Blue Hour sustituye a Airglow (2026-11-09, subproyecto 2).** Forma elegida
  por el usuario: la hoja de contactos con lápiz graso ámbar sobre el cielo de
  la hora azul (seed `5fce36d6`; contrato en
  `onview/.impeccable/surfaces/src-features-frontend-home-tsx.md`). Todo oscuro;
  un solo color de acción (ámbar `#f2a33a`); esquina de 2px; una familia
  (Archivo, ejes de peso y ancho). `styles/sky.css` se reescribe entero y sólo
  viste las 133 clases que el código vivo usa (las 129 muertas, de OnPilot, no
  vuelven); el puente `.site.sk` vive al final de `sky.css` y `styles/site.css`
  queda en la estructura del vocabulario heredado, con sus alias apuntando a
  los tokens. Fuera: `sky/airglow.ts`, `airglow-kit.tsx`, `sky-hours.tsx`,
  `ion-mark.ts` (el símbolo de la IA de OnPilot) y el lienzo WebGL
  `sky-canvas.tsx`; hasta que llega `BlueHourSky`, el cielo es el degradado de
  `.sk-hero-sky`. `theme-provider` fija `dark`.
- **v1.1.0 (2026-11-09): el kit de Blue Hour.** Tokens y piel (`styles/`), la
  marca (fotograma y lápiz graso, `sky/mark.ts`), Lumen (`sky/ai-mark.ts`), el
  cielo (`sky/blue-hour-sky.tsx`), la tira de contactos (`sky/contact-strip.tsx`),
  el lápiz graso (`sky/grease.tsx`) y los números que cambian de golpe
  (`sky/strike-number.tsx`). Los componentes de consola y página conservan su
  API; sólo cambian su piel (esquina de 2px, colores de los tokens). `package.json`
  pasa a 1.1.0 (se había quedado en 1.0.0 con el tag v1.0.1).
- **v1.2.0 (2026-11-09): la revisión de acabado de impeccable** (dos rondas,
  veredicto final ship). Dentro de la app la tinta es neutra casi negra (`.site.sk`
  redefine ground, mist, surface, haze, film y perf; `INSIDE_GROUND` en `day.ts`
  para el documento de las consolas); el azul queda fuera y en los vacíos. El lápiz
  graso es un contorno relleno que se afina (`grease-paths.ts`, generado una vez) y
  se dibuja con una máscara. La tira admite la cruz de la toma descartada, se coloca
  en la elegida al montarse, lleva el texto en pantalla arriba y centrado, y la celda
  elegida va por encima de sus vecinas. El cielo baja a cobalto con una línea cálida
  de horizonte.
- **v1.3.0 (2026-11-09): `worker/credit-settle`** (subproyecto 3, el estudio).
  `chargeReservation` y `releaseReservation` salen de `onview/functions/_lib/credits.ts`
  sin cambiar de comportamiento: onview reserva y el estudio cobra o devuelve con el
  id del trabajo, y los dos leen la misma base. onview las re-exporta. El test
  (`tests/credit-settle.test.ts`) usa `node:sqlite` con las tres tablas copiadas.

## v2.0.0: el mundo «Feed vertical» (subproyecto 8 de OnView, 2026-11-10)

- `styles/sky.css` cambia de mundo sin cambiar de nombres: los tokens `--sk-*` toman el casi negro (`#0a0a0b`) y la tinta (`#f4f4f2`); `--sk-accent` es la tinta (no hay color de acento). El único degradado es `--sk-scrim`; el único vidrio, `.sk-over-video`. Lo prueban `tests/feed-tokens.test.ts` y `tests/feed-world.test.ts`.
- Piezas nuevas en `sky/feed.tsx`: `VideoFrame`, `SheetFrame`, `StateTag`, `StoryBars` y `RailButton`. Hooks nuevos: `useReducedMotion` y `useStepKeys` (ignora las flechas dentro de un campo y con Alt, Ctrl o Meta).
- La marca es un marco 9:16 con el rótulo abajo a la izquierda (`mark.ts`); Lumen, un punto con halo que late con `AiMark thinking` (`ai-mark.ts` lleva sus colores escritos para que el script de marca lo cargue sin resolver módulos).
- Borrados: `blue-hour-sky`, `grease` (y `grease-paths`), `strike-number`, `contact-strip` y sus pruebas. `PageHero` ya no pinta el cielo.

## v2.1.0: `video/`, cómo se arma un video (subproyecto 5 de OnView, 2026-11-16)

- `video/compose.ts`: `composeVideo` convierte los datos de un proyecto, lo que decide su kit y los límites del plan en la **composición** (escenas con recorte, textos con su momento, logo, voces, música, efectos, cierre de 2 s, marca de agua, tamaño del cuadro). La usan el editor (con URL) y la exportación (con claves del almacén): por eso vive aquí y no en onview.
- `video/mix.ts`: `resolveAudio` resuelve con las duraciones reales lo que la composición no puede saber: la voz que no cabe se acelera hasta 1.15× y, si aun así no cabe, se corta con un fundido de 0.15 s; la música baja al 45 % bajo la voz con rampas de 0.25 s. El volumen de la música es una lista de puntos unidos por rectas, y esa lista es la verdad para el navegador y para ffmpeg.
- `video/brand.ts`: las reglas de qué marca, qué versión del logo y qué tipografía lleva un video salen de `onview/src/features/brand` sin cambiar; onview las re-exporta.
- Las fracciones del texto, del logo y de la marca de agua son del lado corto del cuadro y viven en `compose.ts`: el CSS del editor y la exportación leen las mismas.

## v2.4.0 (pendiente de etiquetar): todo con código (OnView, 2026-11-19)

Spec `../docs/superpowers/specs/2026-11-18-onview-todo-codigo-design.md`.

- **Sin clips, calidad ni resolución** (`motion/`, `video/`): `BlockKind` es `text | icons | ui | product | logo`; la composición siempre a 1080 en el lado corto; `template: { id, voice }` sólo decide si hay voces.
- **Templates que se adaptan**: `motion/types.ts` dice qué material pide cada template y cada momento (`consumes`, `repeat`, `onMissing`, `expandable`, `shared`); `motion/adapt.ts` (`adaptTemplate`) arma el video con el material de la persona y la duración del plan, sin repetir claves (`clave#n`) y dejando fuera lo opcional que no cabe.
- **La biblioteca de la entrega 1** (`motion/templates.ts`, `TEMPLATE_IDS`): Lanzamiento de software, Novedades, Integraciones, Producto, Catálogo, Cómo se usa, Oferta e Historia de marca, con nombre y descripción en en/es/pt, cuándo elegirlo (para Lumen) y muestras genéricas (nunca el texto de una marca).
- **Material con tipo** (`MaterialKind`: captura, foto de producto, logo, otra; `parseMaterialKind` lee lo desconocido como «otra»).
- **Pulido tras la comparación con Arcade** (tarea 0b del plan): ver el commit `6a55d16`.

## v2.5.0: estilos (OnView, 2026-11-19)

Spec `../docs/superpowers/specs/2026-11-19-onview-estilos-y-referencias-design.md`, plan `../docs/superpowers/plans/2026-11-19-onview-estilos-y-referencias.md` (tareas 1–9).

- **Template = estructura + estilo** (`motion/styles.ts`): 8 estilos (Arcade, Changelog, Órbita, Escaparate, Bloques, Paso a paso, Impacto, Cine), uno por template. El kit pone la familia, los colores y los logos; el estilo, el fondo, el peso, la escala, la entrada de la letra, el tempo, las transiciones, la cámara, el marco del producto y la energía de la música. `resolveStyle` es la única puerta (template → `style_id` → retoques) y nunca lanza; el tempo no se retoca aquí (vive en `tempo_bpm`).
- **Arcade no cambia ni un cuadro**: su ficha es el aspecto de antes (cielo quieto, peso del kit hasta 500, `blur`), y la línea base del estudio (`render/test/arcade-baseline.int.test.ts`, PSNR ≥ 45 dB) lo comprueba en cada cambio.
- **La transición vacía es la del estilo** (`compose.ts`): la del momento anterior a un cierre `logo`, `transitions.close`; la del último, un corte. Un momento del template sólo la fija a propósito (el `push` de la ráfaga de Arcade y el `cut` del cierre).
- **Fondos** (`background.ts`): `sky`, `dark`, `brand` (con `saturate`), `paper`, `photo`, `auto`; `inkOn` elige la tinta (≥ 4.5) y sobre el cielo es la de siempre. `cycle` (Bloques) pinta cada momento de otro color del kit con su tinta.
- **Transiciones nuevas** (`transitions.ts`): `wipe`, `slide`, `punch` y `fade` (dos golpes). **Cámara** (`camera.ts`): dos envolturas (`camera` y `hit`) para el acercamiento lento, el paralaje y los golpes; si algo se mueve, el fondo sobra 6 u por lado.
- **La letra** (`type.ts`): `phraseWeight` fija el peso del estilo con el más cercano que tenga la letra (`Face.weights`), `SCALE`, mayúsculas y espaciado; el motor carga la letra a ese peso antes de medir. Entradas `groups` (Arcade), `slam`, `rise`, `fade` y `type`; sitio `center`, `corner` o `lower`.
- **Producto**: marcos `shadow`, `plinth` (base y reflejo) y `bleed`; `wide` dobla el movimiento. **Cierre**: sobre fondo claro con el logo para fondos claros; sobre oscuro, con el de cierre si el color de cierre es casi el del fondo; si no, la tarjeta de siempre.
- Lo que enseñaron las muestras (tarea 8) y Bloques (tarea 9) está en el registro del plan.

## v2.6.0: el video de referencia (OnView, 2026-11-19)

Spec `../docs/superpowers/specs/2026-11-19-onview-estilos-y-referencias-design.md` §7 (tareas 19–24 del plan).

- `video/reference.ts`: los topes (90 s, 100 MB, 12 cuadros, 30 días), los tipos (`ReferenceAnalysis`, estado y motivo) y `referenceLine`, la línea con las medidas que lee Lumen junto a los cuadros. La medición vive en el Container del estudio (`render/src/analyze.ts`), que no importa shared y repite los topes.

## Ventana: las dos densidades del vidrio (parte 1, tarea 16b, 2026-11-20)

Spec `../docs/superpowers/specs/2026-11-20-onview-ventana-sistema-design.md` §4.2, «Dos densidades de vidrio». Decisión de quien lo encargó al ver la muestra: el vidrio ahumado, sobre una escena oscura, parece un panel gris y no el vidrio luminoso de la maqueta que eligió.

- **Cuál toca lo decide lo que hay detrás.** **Ahumado** (el de por defecto, sin cambios): sobre lo que no controlamos, el video o las imágenes de una persona; su garantía es sobre blanco puro. **Luminoso**: sobre fondos que controlamos (el video de demostración del sitio, el resplandor de `Glow`); su garantía es sobre un techo declarado.
- **Cómo se activa.** Por zona, no pieza a pieza: la clase `vn-lit` (o `Lit` de `ventana/glass.tsx`, que sólo la añade) en la página o en una parte. Las piezas no cambian. El ámbito **sólo redefine variables** (los «valores vivos» del vidrio, que `tokens.css` declara en regla aparte): nunca fondo, filtro, borde ni sombra, así que no puede pisar el material ni sus respaldos. Lo prueba `tests/ventana-tokens.test.ts`.
- **La receta.** Sin humo. El filtro del vidrio termina en `brightness(var(--vn-glass-dim, 1))`, que fuera de una zona luminosa vale 1; dentro atenúa lo de detrás por grado (`--vn-lit-dim-*`: 0.8 el claro, 0.7 el fino, 0.58 el grueso). Atenuar en el filtro conserva el color (un humo lo agrisa), y eso es lo que hace luminosa la lámina. La capa plana del relleno, que en el ahumado es el humo, es una **escarcha** (`--vn-lit-frost`, 6 % de blanco): sin ella un vidrio que sólo atenúa es negro sobre un fondo oscuro. Con el brillo (`--vn-lit-sheen`, 10 %) da el relleno de la maqueta elegida: de un 16 % de blanco arriba a un 6 %. Y satura al 140 % (`--vn-lit-saturate`), no al 180 % del ahumado: sin humo que la temple, esa saturación volvía rojo el naranja de la marca de demostración.
- **Por qué aquí sí vale depender del filtro.** La pasada de diseño (tarea 16) descartó oscurecer en el filtro para el ahumado: su garantía tiene que valer sin `backdrop-filter`. El luminoso sólo va sobre fondos que controlamos y, sin filtro, no hay vidrio luminoso: hay el mismo sólido de respaldo que en el ahumado (transparencia reducida, contraste alto, sin soporte, `vn-glass--solid`). Comprobado en Chrome con las preferencias emuladas: el estilo calculado de un vidrio de dentro y otro de fuera es idéntico con transparencia reducida, con contraste alto y con `vn-glass--solid` (el caso sin soporte no se puede emular: lo sostiene la prueba de la hoja).
- **El techo.** Por grado, el gris neutro más claro sobre el que la tinta aún llega al umbral (3:1 el claro, 4.5:1 fino y grueso): `--vn-lit-ceiling-*` = `#949494`, `#777777` y `#909090`. No se eligen: salen del modelo, capa a capa, `brillo sobre (escarcha sobre (atenuación × gris))`, redondeando cada capa hacia arriba y con una holgura de 2 niveles: el techo es el gris más claro que pasa aun tomando el fondo 2 niveles más claro. Fino, techo 119: con el fondo en 121, 0.7 × 121 = 84.7 → 85; con la escarcha, 95.2 → 96; con el brillo, 111.9 → 112, que da 4.55:1. Con el gris siguiente (120, fondo en 122): 86, 97 y 113, que da 4.48:1. El gris declarado, sin holgura, deja 111 bajo el texto (4.62:1): el techo ya no depende de un redondeo. La prueba recorre los 256 grises y afirma que el techo es el único salto. Si cambia la atenuación, la escarcha o el brillo, cambian los techos, nunca el umbral ni la holgura.
- **La cuenta es una cota, no una simulación** (revisión de la tarea 16b): nunca devuelve algo más oscuro que lo que pinta un navegador. Tres cosas la hacen conservadora. Cada capa redondea hacia arriba. Entre `saturate()` y `brightness()` no recorta: un canal que la saturación saca de rango (el rojo de `#ff0000` llega a 335) se atenúa tal cual y sólo al final del filtro se recorta a 0..255; Chrome recorta entre los dos pasos y da un resultado igual o más oscuro, pero un motor que funda las dos matrices (WebKit está sin comprobar) no, y con la cuenta que recortaba el rojo puro «pasaba» en fino con 5.5:1 cuando sin recorte da 3.9:1. Y `passesOnGlass` prueba el fondo `GLASS.margin` (2) niveles más claro por canal. La holgura sale de una medida: en Chrome, bajo un chip fino luminoso sobre cada color liso de la marca y por debajo del brillo, el píxel sale hasta 2 niveles por encima de la cuenta sin holgura (naranja `#ab350f` medido y `#ac3410` la cuenta, un nivel de más en el verde; crema `#b5ab9b` y `#b4aa99`, hasta dos de más) y nunca por encima de la cuenta con holgura.
- **La cuenta, para quien lo usa:** `ventana/glass-contrast.ts` (puro, sin DOM): `underGlass(fondo, grado, densidad)` da el color que queda bajo el texto, `glassContrast` el contraste de la tinta y `passesOnGlass` si llega al umbral. Lleva los mismos números que los tokens (la prueba de tokens los compara uno a uno). Quien pone vidrio luminoso sobre un fondo prueba con ella los colores más claros que ese fondo enseña bajo el vidrio; donde alguno no pasa, va el ahumado. `underGlass` y `glassContrast` dan la cuenta de ese color exacto; **para decidir si un fondo vale se usa `passesOnGlass`**, que es la que lleva la holgura. Con la marca de demostración, en fino: el naranja `#c2410c` pasa (4.9:1; con la holgura, 4.8:1), el casi negro pasa (10.7:1) y la crema `#f5ead8` no (1.9:1).
- **El modelo cuenta la saturación del filtro.** `saturate()` deja igual los grises pero aviva los colores, y un color vivo queda más claro de lo que diría sólo la atenuación (el naranja daría 5.5:1 sin contarla). El desenfoque no se cuenta a propósito: promedia, así que el peor caso es el color más claro sin desenfocar.
- **Islas ahumadas dentro de una zona luminosa** (vuelven a declarar los valores vivos): toda raíz `.vn`, y eso son las hojas, los avisos y los paneles que Radix monta en un portal (llevan más texto y no se sabe sobre qué caen; las hojas y los avisos pueden estar dentro de la zona en el DOM, y siguen ahumados por llevar `.vn`); un vidrio dentro de otro, también cuando la clase del ámbito va en el propio vidrio de fuera (en Chrome el de dentro no ve el fondo, sólo a su padre: el filtro no lo protegería); lo que flota sobre un `VideoFrame` (el video de la persona); y el pulgar del segmentado (va sobre su riel sólido). Para dejar ahumada otra parte basta envolverla en un elemento con la clase `vn`. La barra de navegación también es raíz `.vn`, pero es justo lo que flota sobre el fondo: el ámbito la nombra (`.vn-lit .vn-nav__bar`), y una barra metida en una raíz `.vn` de dentro de la zona vuelve al ahumado como lo demás.
- **Sobre vidrio luminoso, sólo tinta primaria**, en todo grado. La secundaria (`--vn-ink-2-glass`) y el peligro de vidrio (`--vn-danger-glass`) son del grueso ahumado.
- **Estados sobre vidrio luminoso**: como en el fino ahumado, una píldora más oscura o un filete por dentro, nunca un relleno más claro (la página actual de la barra se sigue leyendo: visto en la muestra).
- **Lo que no hace:** no hay scrim luminoso. El `Scrim` sigue garantizando el texto sobre blanco puro, y un vidrio luminoso que caiga sobre su meseta (0.72 de negro) queda sobre un fondo casi negro. La muestra usa el scrim del sistema en las dos densidades; con `?scrim=40` (sólo en zona luminosa) baja el de su escena al 40 % y lo dice mientras está puesto. Si la portada necesita un scrim más claro, es una decisión de la parte 2 (ver `pendiente.md`).

## Ventana: el sistema en `shared` (v2.8.0, parte 1 de 5, 2026-11-20)

Spec `../../docs/superpowers/specs/2026-11-20-onview-ventana-sistema-design.md`. Lo que sigue es el porqué de lo que no se ve en el código; las dos densidades del vidrio tienen su sección propia más arriba.

- **Vidrio ahumado, y por qué.** El blanco translúcido del boceto (de un 16 % de blanco a un 6 %) no llega a AA sobre un cuadro claro: la tinta sobre el naranja de la marca de demostración queda en unos 3.5:1 y sobre su crema en 1.1:1, y en las partes 3 y 4 el vidrio flotará sobre el video de la persona, donde el peor caso es blanco puro. Por eso todo vidrio con texto lleva bajo el brillo una capa oscura propia y la prueba afirma el contraste con aritmética sobre los tokens, con blanco puro detrás (como `tests/feed-tokens.test.ts` en Feed vertical).
- **La pasada de diseño levantó el humo.** El primer humo era casi negro (de 10 a 14 de 255 sobre negro): sobre una escena oscura, una tarjeta negra. Ahora es un gris frío levantado (claro `rgba(58,58,64,.64)`, fino `rgba(44,44,50,.74)`, grueso `rgba(32,32,37,.84)`), con luz en un canto de 1px que el humo no cubre. Peor caso sobre blanco puro: claro 3.2, fino 4.8, grueso 7.5. Se descartó oscurecer con `contrast()` y `brightness()` en el filtro para el ahumado: da los mismos píxeles que un humo (los dos son el mismo mapa lineal del fondo) y haría depender la garantía de `backdrop-filter`, que en Chrome un vidrio dentro de otro no ve más allá de su padre.
- **Tres grados.** Claro (sólo íconos, 3:1), fino (texto, 4.5:1) y grueso (texto, 4.5:1). El texto manda sobre el brillo: el grosor lo fija el contraste, no el gusto.
- **Tinta secundaria sobre vidrio.** `--vn-ink-2` (#a1a1a6) es sólo para fondo sólido. Sobre vidrio grueso va `--vn-ink-2-glass` (#c7c7cc), que llega a 4.8:1 con blanco puro detrás; #a1a1a6 no pasa AA ahí sin dejar el vidrio casi opaco. Sobre vidrio fino y luminoso no hay texto secundario. Igual el peligro: `--vn-danger-glass` (#ffb8ad, 4.9:1 sobre el grueso); `--vn-danger` es para sólido. En una fila resaltada de vidrio todo el texto va en tinta primaria, porque el resalte baja el contraste de la secundaria a unos 4.4:1.
- **Lo elegido sobre vidrio oscurece o lleva filete, nunca aclara.** El vidrio fino sólo da unos 4.8:1 a la tinta, así que un relleno más claro bajo el texto lo rompería. La página actual de la barra es una píldora más oscura con filete; el hover y el foco sólo mueven el filete.
- **Firmas conservadas.** Las piezas siguen las firmas de `sky/` y `ui/` donde servían (`SheetDialog`, `Select`, `Alert`, `Section`, `Tabs`), para que las partes 2 a 5 migren cambiando el import. Tras la pasada de diseño no cambió ninguna firma. `Button` e `IconButton` aceptan `ref`; `className` de un campo va al `<input>` o `<textarea>`, como en `sky/`.
- **Material por variables, nunca por declaración.** El material del vidrio se ajusta por pieza sólo con `--vn-glass-r`, `--vn-glass-shadow` y `--vn-glass-rim` (y `--vn-glass-elevation` es la sombra entera ya resuelta); el relleno no se toca porque de él sale el contraste. Una regla `.vn .vn-…` tiene más especificidad que `.vn-glass` y, si declaraba `background`, `backdrop-filter`, `border` o `box-shadow`, borraba el material y sus respaldos. La prueba escanea las hojas; `SOLID_PIECES` es la lista explícita (clases exactas, por el compuesto sujeto del selector) de piezas sólidas exentas, separada de las variantes de botón con fondo. Olvidar una pieza falla en alto, que es la dirección segura.
- **Portales en `.vn`.** Todo lo que Radix monta en un portal va envuelto en `<div className="vn" style={{ display: "contents" }}>`: el portal cae fuera de la raíz y perdería los tokens. Lo hacen las piezas; los consumidores, con las suyas.
- **`<dialog>` nativo para la hoja.** `Sheet` es `<dialog>` con `showModal()`: foco atrapado y devuelto, Escape y capa superior sin librería. El contenido se monta con `open` y se desmonta al acabar la salida (`transitionend`, con respaldo por tiempo): la salida animada es nueva respecto a `sky/`. No hay una pieza `Dialog` aparte: la hoja es el diálogo (sube en el teléfono, escala en escritorio).
- **Muelles generados.** Los muelles son datos (`ventana/springs.ts`) y `npm run springs` escribe `styles/ventana/motion.css` con `linear()`; no se edita a mano y una prueba comprueba que casa con su generador. El suave llegó con rebote y dejaba 2px de hueco bajo una hoja: ahora sin rebote, a 95 % en unos 280ms y asentado en 500ms. La presión usa el vivo.
- **Las dos densidades y el techo.** Ver la sección anterior: aquí sólo la regla de trabajo. Quien use vidrio luminoso prueba sus colores con `passesOnGlass`; `underGlass(..., "smoked")` también redondea hacia arriba (blanco bajo fino: `#6d6d72`, 4.73:1), así que la función es una cota en las dos densidades y la garantía del ahumado se cumple (3.20, 4.73, 7.38).
- **Foco.** Anillo de tinta de 2px con 2px de separación en toda pieza; sobre vidrio es `outline` más un anillo oscuro, sin perder la sombra del material. Dentro de un contenedor con scroll es un anillo interior, nunca exterior (el exterior se recortaba).
- **Esquinas continuas como mejora progresiva.** `corner-shape: superellipse(1.5)` con el radio ×1.35 en paneles y marcos, y `corner-shape: round` en cápsulas y botones redondos (con `squircle` Chrome los volvía cajas). Safari no lo tiene: esquinas redondas al radio nominal, que es el respaldo previsto.
- **El scrim sólo garantiza AA en su borde.** Meseta de 0.72 de negro sobre el 40 % pegado al borde y 0.5 hasta el 60 % (texto grande, 3:1). Un titular va en esa franja. El rótulo del `VideoFrame` lleva su propio scrim, medido por el texto y no por el marco, con la letra escalando con el marco.
- **Espectro sólo de Iris.** El único color propio de la interfaz es el espectro de Iris (`AI_SPECTRUM`); ninguna otra pieza lo usa. Una prueba exige que ninguna hoja de `styles/ventana/` contenga uno de esos colores, y por eso el aro se arma en JavaScript (`spectrumGradient()`), no en CSS. Opacidades por tono: `night` 0.42 el marco de atrás y 0.4 el aro plano, `paper` 0.5 y 0.5, para que el gráfico llegue a 3:1 sobre papel.
- **La IA se llama Iris** (elegido por el usuario el 2026-11-20 entre Iris, Lux, Prisma y seguir con Lumen). `AI_NAME = "Iris"` en `ventana/ai-mark.ts`; `sky/ai-mark.ts` sigue diciendo **Lumen** hasta la parte 2, que cambia de una vez lo que la gente lee. La voz de narración «Iris» del catálogo (`015_voices.sql`, id `iris`) tiene que cambiar de nombre antes de ese cambio; su id no cambia.
- **Piezas más allá de la tabla del plan.** `TooltipGroup` (un solo proveedor por app: así entre tooltips seguidos no hay espera; fuera de un grupo, `Tooltip` monta el suyo), `Lit` (el ámbito luminoso) y `Status` (aviso en línea). `Select` cae en `ventana/select.tsx`, `TextField` y `TextArea` hacen de `Field`, `Input` y `Textarea`, y `Check` acompaña a `Switch`.
- **Se importa en una capa.** `@import "@onview/shared/styles/ventana.css" layer(components);`: sin capa, lo que no tiene capa gana a las utilidades de Tailwind v4 y un `className` del consumidor no podría con las reglas de Ventana. En `onview` funciona y las reglas quedan dentro de `@layer components`.
- **Aviso para las partes 2 a 5.** Montar un `TooltipGroup` en cada app. Un `vn-arrive` va en un envoltorio, no en un botón (`vn-press` y las transiciones de `.vn-btn` lo pisan). Cada parte puede añadir piezas con estas mismas reglas.
