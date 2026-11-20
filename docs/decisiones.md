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
