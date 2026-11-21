# @onview/shared — documentación

**El código común de las apps de OnView.** UI (`ui/`, `components/`), cliente
CRUD y helpers (`lib/`, `hooks/`), el mundo visual y sus piezas (`styles/`,
`sky/`, `ventana/`) y tres módulos de worker (`worker/response`, `worker/cookies` y
`worker/credit-settle`, el cobro y la devolución de una reserva de créditos que
usan onview y onview-studio desde v1.3.0). Envía TypeScript crudo: lo compila el bundler de la app que
lo consume.

`ui/`, `lib/`, `hooks/`, `components/` y `sky/` asumen el DOM; `worker/` asume
`@cloudflare/workers-types`. Nunca se importa cruzando esa frontera (hay dos
`tsconfig` por eso).

El pin es a un **tag** de git, no a master (`github:OnView-cc/shared#v1.0.0`;
consumidores: `onview` y `admin`). El repo es **público**: el CI de los
consumidores lo baja con `npm ci`, sin token. Para trabajar shared en local
contra una app, se enlaza con una junction y se quita con `rmdir` antes de
commitear.
El mundo visual vigente en cada pantalla es **«Feed vertical»** (`sky/`); el
sistema nuevo, **«Ventana»** (`ventana/`), llega pantalla a pantalla (sección
siguiente). La sección «Airglow» de más abajo es historia del fork. Ver
`decisiones.md` y lo que falta en `pendiente.md`. Las dependencias de runtime son
`peerDependencies`; cada consumidor las deduplica (`dedupe` en su
`vite.config.ts`) para que no haya dos React.

## Ventana: el mundo nuevo (v2.8.0, parte 1 de 5)

Un oscuro único, sin color de acento, con vidrio tipo Apple (Liquid Glass). Vive
en `ventana/` (componentes) y `styles/ventana/` (CSS), junto a Feed vertical
(`sky/`, `styles/sky.css`), que no se toca: ni un valor `--sk-*` cambia. Las
pantallas pasan una a una en las partes 2 a 5 de la serie (spec
`../../docs/superpowers/specs/2026-11-20-onview-ventana-sistema-design.md` §0:
sitio y acceso, app sin editor, editor, admin y correos); al cerrar la quinta se
borra `sky/`. Todo se ve en `/dev-preview/ventana` de `onview`.

### La regla del vidrio

El vidrio es la capa que flota (barra de navegación, barras de herramientas,
menús, hojas, diálogos, avisos, controles sobre un video). El contenido no es de
vidrio: listas, tablas, formularios y texto largo son sólidos, con la letra, las
curvas y el movimiento del sistema. El texto directo sobre un video lleva `Scrim`.

**El texto manda sobre el brillo.** Tres grados (`GlassGrade`): `clear` (sólo
íconos, 3:1), `thin` (texto, 4.5:1) y `thick` (hojas, menús, diálogos; 4.5:1).
La tinta es `--vn-ink` (#f5f5f7). La secundaria `--vn-ink-2` (#a1a1a6) es sólo
para fondo sólido; sobre vidrio grueso se usa `--vn-ink-2-glass` (#c7c7cc) y el
peligro va en `--vn-danger-glass` (`--vn-danger` es para sólido); sobre vidrio
fino no hay texto secundario. Lo elegido o actual sobre vidrio se marca
oscureciendo o con filete, nunca aclarando el relleno bajo el texto.

### Las dos densidades

Cuál toca lo decide lo que hay detrás.

| | Ahumado (por defecto) | Luminoso (dentro de `vn-lit` o `Lit`) |
|---|---|---|
| Sobre qué | lo que no controlamos: el video o las imágenes de una persona | fondos nuestros: el video de demostración, el resplandor de `Glow` |
| Material | gris frío levantado (humo) bajo el brillo, con un canto de luz de 1px | sin humo: el filtro atenúa lo de detrás (`brightness`), con una escarcha del 6 % y el brillo |
| Garantía | sobre blanco puro detrás: claro 3.2, fino 4.7, grueso 7.4 | sobre un techo declarado por grado: `#949494` claro, `#777777` fino, `#909090` grueso |
| Sin `backdrop-filter` | su sólido (igual que con transparencia reducida y contraste alto) | el mismo sólido: no hay vidrio luminoso sin filtro |

**Cómo se usa lo luminoso.** Se activa por zona, nunca pieza a pieza:
`<Lit>…</Lit>` (de `ventana/glass.tsx`; sólo añade la clase) o la clase `vn-lit`
en la página o en una parte. El ámbito sólo redefine variables, nunca el
material. Siguen ahumados, porque llevan más texto y no se sabe sobre qué caen:
todo lo que monta una raíz `.vn` (paneles en portal, hojas, avisos), un vidrio
dentro de otro, lo que flota sobre un `VideoFrame` y el pulgar del `Segmented`
(las «islas ahumadas»). Para dejar ahumada otra parte basta envolverla en un
elemento con la clase `vn`. Sobre vidrio luminoso, sólo tinta primaria.

**Cómo prueba un consumidor sus colores.** `ventana/glass-contrast.ts` (puro, sin
DOM) lleva la cuenta: `underGlass(fondo, grado, densidad)` da el color que queda
bajo el texto, `glassContrast(...)` el contraste de la tinta con él y
`passesOnGlass(fondo, grado, densidad)` si llega al umbral del grado. Quien pone
vidrio luminoso sobre un fondo prueba, con `passesOnGlass`, cada uno de los
colores más claros que ese fondo enseña bajo el vidrio (las fotos también
cuentan); donde alguno no pasa, esa parte va ahumada. Para decidir si un fondo
vale se usa `passesOnGlass`, no `glassContrast` a mano: la primera lleva la
holgura. El modelo es una cota conservadora: cada capa redondea hacia arriba, no
recorta entre `saturate()` y `brightness()`, y se prueba el fondo 2 niveles más
claro (2 niveles de fondo, que cubrieron el exceso medido en la salida en tres
colores). Con la marca de demostración, en fino: el naranja `#c2410c` pasa, el
casi negro pasa y la crema `#f5ead8` no.

### Ajustar el vidrio de una pieza

Sólo por variables: `--vn-glass-r` (radio), `--vn-glass-shadow` (sombra de fuera)
y `--vn-glass-rim` (filete). `--vn-glass-elevation` es la sombra entera ya
resuelta, para quien necesite leerla. Una regla `.vn .vn-…` que pueda casar con
un elemento que lleve `vn-glass` nunca declara `background`, `backdrop-filter`,
`border` ni `box-shadow`: `tests/ventana-tokens.test.ts` escanea las hojas y
falla si lo hace. `SOLID_PIECES`, en esa prueba, es la lista explícita de piezas
sólidas exentas del escaneo; olvidar una falla en alto.

### Cómo se importa

```css
@import "@onview/shared/styles/ventana.css" layer(components);
```

Va en la capa de cascada `components` para que las utilidades de Tailwind que el
consumidor pasa por `className` (tamaños de marcas, anchos de campos) ganen a
las piezas: lo que no tiene capa gana a `@layer utilities`, y sin capa esas
clases no podrían con las reglas de Ventana. La fuente es `-apple-system,
BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter Tight Variable",
sans-serif`: SF nunca se sirve como archivo y la app instala
`@fontsource-variable/inter-tight`. Cada app monta **un** `TooltipGroup` para
que entre tooltips seguidos no haya espera. Todo lo que Radix monta en un portal
va envuelto en `<div className="vn" style={{ display: "contents" }}>` (las
piezas de aquí ya lo hacen; hazlo con las tuyas).

### Las piezas

| Pieza | Archivo | Qué es |
|---|---|---|
| `Glass`, `Lit`, `Scrim`, `Glow` | `ventana/glass.tsx` | superficie de vidrio (`grade`, `solid`), ámbito luminoso, oscurecimiento bajo texto sobre video, resplandor quieto con los colores del contenido |
| `Button`, `IconButton` | `ventana/button.tsx` | primaria (cápsula blanca), vidrio, sin fondo y peligro; aceptan `ref` |
| `TextField`, `TextArea` | `ventana/field.tsx` | campos sólidos con etiqueta, ayuda y error; el textarea crece |
| `Select` | `ventana/select.tsx` | desplegable de vidrio propio, con teclado completo |
| `Segmented` | `ventana/segmented.tsx` | control segmentado con pulgar que se desliza |
| `Switch`, `Check` | `ventana/toggle.tsx` | interruptor y casilla |
| `Chip`, `StateChip` | `ventana/chip.tsx` | chip elegible o etiqueta; etiqueta de estado de una toma |
| `Menu`, `Popover`, `Tooltip`, `TooltipGroup` | `ventana/overlay.tsx` | lo que flota junto a un botón (vidrio grueso, sobre Radix) |
| `Sheet` | `ventana/sheet.tsx` | hoja y diálogo sobre `<dialog>` nativo: sube en el teléfono, escala en escritorio |
| `Toaster` | `ventana/toast.tsx` | avisos con `sonner` y el estilo del sistema |
| `NavBar` | `ventana/nav-bar.tsx` | la barra flotante en cápsula |
| `Section`, `Row`, `Skeleton`, `Alert`, `Status`, `Tabs`, `Progress`, `Accordion`, `Monogram` | `ventana/content.tsx` | lo sólido: contenido sobre el suelo |
| `VideoFrame` | `ventana/video-frame.tsx` | marco de video 9:16, 1:1 o 16:9 con su rótulo y su propio scrim |
| `Mark`, `Wordmark`, `AiMark` | `ventana/marks.tsx` | las marcas: OnView («Dos capas») e Iris («El prisma»; pensando, el aro gira) |
| `MARK`, `markSvg` | `ventana/mark.ts` | la marca de OnView como datos (la usa `onview/scripts/render-brand.mjs`) |
| `AI_NAME`, `AI_SPECTRUM`, `AI_MARK`, `aiMarkSvg` | `ventana/ai-mark.ts` | Iris como datos |
| `GLASS`, `underGlass`, `glassContrast`, `passesOnGlass` | `ventana/glass-contrast.ts` | la cuenta del contraste sobre vidrio |
| `SPRINGS`, `springLinear` | `ventana/springs.ts` | los muelles; `npm run springs` regenera `styles/ventana/motion.css`, que no se edita a mano |

El CSS: `tokens.css` (tokens `--vn-*` y valores vivos del vidrio), `type.css`
(la escala: `vn-display`, `vn-title-1`, `vn-title-2`, `vn-title-3`, `vn-body`,
`vn-small`, `vn-label`, `vn-num`, `vn-wrap`, `vn-link`, `vn-prose`), `glass.css`,
`motion.css` (`vn-arrive` y `vn-press`: la llegada va en un envoltorio, no en una
pieza con su propia transición), `controls.css`, `content.css` y `overlays.css`.
El espectro de Iris es lo único con color propio de la interfaz y no aparece en
ninguna hoja de estilos: el aro se arma en JavaScript desde `AI_SPECTRUM`.

### La IA se llama Iris

`AI_NAME = "Iris"` en `ventana/ai-mark.ts`. `sky/ai-mark.ts` sigue diciendo
**Lumen** hasta la parte 2, que cambia de una vez lo que la gente lee (el
diccionario, `/lumen` a `/iris`, los legales, los correos, las etiquetas del
admin y las instrucciones con que la IA se presenta). Tablas, columnas,
constantes y nombres de archivo no se renombran. Antes de ese cambio, la voz de
narración del catálogo que también se llama «Iris» tiene que cambiar de nombre
(decisión pendiente del usuario; ver `pendiente.md`).

## Airglow: el mundo de OnView

El cielo de la casa visto desde arriba: la página clara (`#f5f5fa`), la noche
sólo en los paneles de cielo, un solo acento violeta (`#5b3fd9`), la banda de
la ionosfera (`#a99bff`) sólo dentro del cielo, Geist para todo y Geist Mono
sólo en lo que mide el agente (`.sk-mono`). `styles/sky.css` se re-basó sobre
el de Northstar («Polar Night»), que ya era «página clara + noche en paneles»
con el mismo vocabulario de clases. Las piezas:

| Qué | Dónde | Quién lo consume |
|---|---|---|
| El mundo: tokens, tipografía, píldoras, tarjetas, vidrio, paneles de cielo y su respaldo `.sk-band`, páginas interiores, el **bloque de consola** (el vocabulario del mapa reinterpretado en Airglow), la barra lateral y las piezas de Airglow | `styles/sky.css` (sobre `styles/site.css`) | onview y admin, desde su `index.css` |
| La marca «Órbita con hueco» como datos (`MARK`, `MARK_COLORS`, `markSvg`) y en React (`Mark`, `Wordmark`); la píldora y la flecha | `sky/mark.ts`, `sky/kit.tsx` | onview, admin; `markSvg` lo copia `onview/scripts/render-brand.mjs` |
| El cielo «Lectura»: la lógica sin DOM (horas, brillo por carga, pulso, subida, `DEMO_DAY`), el shader y las horas en Geist Mono | `sky/airglow.ts`, `sky/sky-canvas.tsx`, `sky/sky-hours.tsx` | onview (sitio y puerta) |
| Las piezas de Airglow: `ItemLabel` (herramienta · tipo · hora), `DayLine` (la frase del día), `ExampleSeam` (la costura de ejemplo) | `sky/airglow-kit.tsx` | onview |
| El kit de página: cabecera en panel de cielo, sección, aro, recorrido en pasos, preguntas, control segmentado, cierre; el documento de día | `sky/page.tsx`, `sky/day.ts`, `sky/hooks.ts` | onview (envuelto en `features/frontend/sky/page.tsx`) |
| El marco de consola: barra lateral con destinos, barra superior con el rastro y la cuenta, salida por `#signout` | `sky/console-frame.tsx` | admin |
| Las piezas de consola: `Section`, `CallingAt`, `Masthead`, `Stamp`, campos, `StatusBox`, `Note`, `SaveRow`, `SheetDialog`… | `sky/console.tsx`, `lib/use-copy.ts` | onview (área con sesión), admin |
| El cliente de plataforma: `platformOrigin()` (`VITE_PLATFORM_ORIGIN`; localhost → `:8800`), `api()` con credenciales, `fetchMe()`, `signInUrl()`, `signOutAndGo()` | `lib/platform-client.ts` | admin |

Reglas que las piezas ya cumplen y que un consumidor no debe deshacer (están
en la cabecera de `sky.css` y en el `DESIGN.md` de `onview`): sólo claro, con
la noche dentro de los paneles de cielo; el violeta como único acento; la banda
sólo dentro del cielo; Geist, y Geist Mono sólo en lo que mide el agente;
sombra o línea, nunca las dos; vidrio sólo donde algo flota; toda carga
inventada lleva su costura de ejemplo. Los iconos se tipan por su forma
(`IconComponent`) porque cada consumidor trae su propia copia de lucide-react.

## Módulos

<!-- BEGIN generated:modules -->
<!-- No edites aquí: lo reescribe `npm run docs`. -->

Módulos de las carpetas publicadas (54), con la primera línea de su comentario de cabecera.

| Archivo | Qué hace |
| --- | --- |
| [`components/confirm-delete-modal.tsx`](../components/confirm-delete-modal.tsx) | «¿Seguro?» antes de un borrado, igual en toda la plataforma. |
| [`components/form-modal.tsx`](../components/form-modal.tsx) | El envoltorio de cualquier formulario en diálogo: título, descripción y hueco. |
| [`components/theme-provider.tsx`](../components/theme-provider.tsx) | El mundo Feed vertical es oscuro entero (subproyecto 8): el mismo casi negro fuera y dentro. |
| [`lib/crud-api.ts`](../lib/crud-api.ts) | El cliente CRUD que se repetía en cada feature, escrito una vez. |
| [`lib/crud-hooks.ts`](../lib/crud-hooks.ts) | Los hooks de React Query que van encima de `crud-api.ts`. |
| [`lib/initials.ts`](../lib/initials.ts) | Dos letras en lugar de alguien que todavía no tiene avatar. |
| [`lib/platform-client.ts`](../lib/platform-client.ts) | Hablar con el control plane desde una consola que vive en otro origen (admin., partners., developers. |
| [`lib/use-copy.ts`](../lib/use-copy.ts) | Copiar, hecho una sola vez para todo el proyecto: la misma implementación que partners y developers, la que usa `CopyTicket` en `console.tsx`. |
| [`lib/utils.ts`](../lib/utils.ts) | `cn` — juntar clases de Tailwind sin que se peleen entre ellas. |
| [`lib/vite-env.d.ts`](../lib/vite-env.d.ts) | Las variables de build que lee el paquete (`import.meta.env`). |
| [`sky/ai-mark.test.ts`](../sky/ai-mark.test.ts) | Lumen, la IA de OnView: su nombre y su símbolo, un punto blanco con halo. |
| [`sky/ai-mark.ts`](../sky/ai-mark.ts) | Lumen, la IA de OnView (nombre elegido por el usuario el 2026-11-09): la que escribe el guion y genera las tomas. |
| [`sky/console-frame.tsx`](../sky/console-frame.tsx) | El marco de consola del admin, en el mundo «Feed vertical»: la forma de una app de trabajo, la misma que el área con sesión de onview. |
| [`sky/console.tsx`](../sky/console.tsx) | Las piezas de la consola, en el mundo «Feed vertical» (2026-11-09). |
| [`sky/day.test.tsx`](../sky/day.test.tsx) | El documento del mundo: mientras se ve una página de OnView, `<html>` y la barra del navegador llevan el casi negro del mundo Feed vertical, y al salir vuelven a lo que… |
| [`sky/day.ts`](../sky/day.ts) | El documento entero lleva el casi negro del mundo Feed vertical mientras se ve una página de OnView: el fondo de `<html>` (lo que asoma en el rebote del scroll) y el… |
| [`sky/feed.test.tsx`](../sky/feed.test.tsx) | Las piezas del mundo Feed vertical (spec §3.5 y §4): el marco de video en su formato, la lámina sin imagen, la etiqueta de estado, las barras de avance, el botón del… |
| [`sky/feed.tsx`](../sky/feed.tsx) | Las piezas del mundo Feed vertical (subproyecto 8, spec §3.5 y §4): el marco de video en su formato, la lámina sin imagen, la etiqueta de estado de una toma, las barras… |
| [`sky/hooks.ts`](../sky/hooks.ts) | Hooks de scroll y de montaje contra los que se animan las páginas de Clear Sky, y los tres que usan las piezas de consola de `console.tsx` (`useFlash`, `useDismiss`,… |
| [`sky/kit.tsx`](../sky/kit.tsx) | Las piezas de marca del mundo de OnView («Feed vertical»): la marca, el símbolo de Lumen, el logotipo, el botón como enlace y la flecha. |
| [`sky/mark.test.ts`](../sky/mark.test.ts) | La marca del mundo Feed vertical: un marco 9:16 redondeado con el rótulo macizo en su tercio bajo. |
| [`sky/mark.ts`](../sky/mark.ts) | La marca de OnView en el mundo Feed vertical, como datos: **un marco vertical 9:16 redondeado con el rótulo macizo en su tercio bajo**, el texto que va abajo a la… |
| [`sky/page.tsx`](../sky/page.tsx) | Las piezas de página del mundo de OnView («Feed vertical»), las del sitio de onview: la cabecera de página, el encabezado de sección, el aro de icono, el recorrido en… |
| [`sky/platform-client.test.ts`](../sky/platform-client.test.ts) | El cliente de plataforma: la URL de entrada, las credenciales en cada llamada, la frase del servidor y un solo refresh. |
| [`sky/platform-origin-local.test.ts`](../sky/platform-origin-local.test.ts) | En local, una consola habla con el `wrangler pages dev` de onview (puerto 8900). |
| [`sky/platform-origin.test.ts`](../sky/platform-origin.test.ts) | Sin `VITE_PLATFORM_ORIGIN`, una consola en un subdominio habla con el apex de producción. |
| [`sky/select.tsx`](../sky/select.tsx) | El desplegable del mundo de OnView («Feed vertical»), sobre Radix: el disparador es un campo (`variant="field"`) o una píldora de la caja de «Nuevo video»… |
| [`ui/alert-dialog.tsx`](../ui/alert-dialog.tsx) | El diálogo de consecuencias: el mismo papel que `Dialog`, pero no se cierra al pulsar fuera y el foco empieza en «Cancel», el lado que no hace nada. |
| [`ui/avatar.tsx`](../ui/avatar.tsx) | La cara de alguien es su monograma: su foto, o sus iniciales en el corte condensado, dentro de un cuadrado con el trazo del mundo. |
| [`ui/badge.tsx`](../ui/badge.tsx) | El sello: un estado impreso en una caja con el trazo del mundo. |
| [`ui/button.tsx`](../ui/button.tsx) | El billete: la única forma de botón del mundo del mapa (ver `styles/site.css`, «billetes y botones»). |
| [`ui/card.tsx`](../ui/card.tsx) | En el mundo del mapa no hay tarjetas: hay paradas. |
| [`ui/checkbox.tsx`](../ui/checkbox.tsx) | La casilla del mundo: un cuadrado con el trazo de 3px que se llena de tinta. |
| [`ui/command.tsx`](../ui/command.tsx) | La paleta de órdenes sobre cmdk: el campo de búsqueda cerrado por el filete grueso, los grupos con rótulo de andén y las filas del panel de papel. |
| [`ui/dialog.tsx`](../ui/dialog.tsx) | El diálogo de papel sobre Radix: el trazo de 3px sobre papel, la única penumbra del mundo detrás (tinta al 70 %), una cabecera cerrada por el filete grueso, el aspa… |
| [`ui/dropdown-menu.tsx`](../ui/dropdown-menu.tsx) | El menú de acciones sobre Radix: un panel de papel con el trazo del mundo (`menu-paper`, en `styles/product.css`), filas en negrita que se tintan al pasar, rótulos de… |
| [`ui/hover-card.tsx`](../ui/hover-card.tsx) | La ficha que se abre al pasar el ratón: el mismo panel de papel que un popover. |
| [`ui/input.tsx`](../ui/input.tsx) | El campo del mundo: el trazo de 3px sobre papel, la única tinta clara al enfocar. |
| [`ui/label.tsx`](../ui/label.tsx) | El rótulo de un campo: el rótulo de andén, en bloque, con medio renglón debajo. |
| [`ui/popover.tsx`](../ui/popover.tsx) | Un panel de papel con contenido, anclado a lo que lo abre; sin radio ni sombra. |
| [`ui/progress.tsx`](../ui/progress.tsx) | Una vía con el trazo del mundo que se rellena de tinta hasta donde llega el valor. |
| [`ui/select.tsx`](../ui/select.tsx) | El desplegable sobre Radix: el disparador es un campo del mundo con su chevrón, y las opciones un panel de papel con filas en negrita. |
| [`ui/separator.tsx`](../ui/separator.tsx) | El filete fino del mundo, en horizontal o en vertical. |
| [`ui/sheet.tsx`](../ui/sheet.tsx) | La hoja lateral: un pliego de papel que entra desde un borde de la pantalla, con el trazo del mundo en el canto que da a la página y la penumbra detrás. |
| [`ui/skeleton.tsx`](../ui/skeleton.tsx) | El hueco de carga: la forma de lo que viene, en la única tinta clara, quieto. |
| [`ui/sonner.tsx`](../ui/sonner.tsx) | Las notificaciones: una hoja de niebla con el filete del mundo y la esquina de 2px (la piel va en `styles/sky.css`, `.site.sk [data-sonner-toast]`). |
| [`ui/switch.tsx`](../ui/switch.tsx) | El interruptor: una vía cuadrada con el trazo del mundo y un mando de tinta que la cruza; encendido, la vía se entinta y el mando pasa a papel. |
| [`ui/table.tsx`](../ui/table.tsx) | Una lista es una tabla de tarifas (`.fare`, en `styles/site.css`): el corte condensado con cifras tabulares, las cabeceras como rótulos de andén cerradas por el filete… |
| [`ui/tabs.tsx`](../ui/tabs.tsx) | Las pestañas son el riel de páginas del mundo: los destinos en negrita sobre un filete fino, el actual en tinta con la barra de 3px en el color de la línea que se viaja. |
| [`ui/textarea.tsx`](../ui/textarea.tsx) | El campo de varias líneas, con el trazo del mundo; lo mide su `rows`. |
| [`ui/tooltip.tsx`](../ui/tooltip.tsx) | La nota al pie de un control: tinta sobre papel, en el corte condensado, sin flecha ni radio. |
| [`worker/cookies.ts`](../worker/cookies.ts) | Lectura de cookies, y nada más. |
| [`worker/credit-settle.ts`](../worker/credit-settle.ts) | Cobrar o devolver una reserva de créditos: la mitad del libro de créditos que hace falta en los dos lados. |
| [`worker/response.ts`](../worker/response.ts) | Las tres respuestas JSON que devuelve cualquier handler de Pages Functions. |

<!-- END generated:modules -->

## Configuración

<!-- BEGIN generated:config -->
<!-- No edites aquí: lo reescribe `npm run docs`. -->

_Sin `wrangler.toml`: este proyecto no se despliega por su cuenta._

### Bindings

_Nada que listar._

### Variables (`[vars]`, públicas)

_Nada que listar._

### Secretos

_Ninguno declarado en `wrangler.toml` ni en `.dev.vars.example`._

### Cron

_Sin cron propio._

### Scripts de npm

| Script | Comando |
| --- | --- |
| `npm run check:neutral` | `node scripts/check-neutral.mjs` |
| `npm run test` | `vitest run` |
| `npm run typecheck` | `tsc -p tsconfig.ui.json --noEmit && tsc -p tsconfig.worker.json --noEmit` |
| `npm run springs` | `node --experimental-strip-types scripts/gen-springs.mjs` |
| `npm run docs` | `node scripts/gen-docs.mjs` |
| `npm run docs:check` | `node scripts/gen-docs.mjs --check` |
| `npm run docs:gaps` | `node scripts/gen-docs.mjs --gaps` |

<!-- END generated:config -->
