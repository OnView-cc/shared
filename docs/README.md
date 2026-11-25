# @onview/shared — documentación

**El código común de las apps de OnView.** El mundo visual y sus piezas
(`ventana/`, `styles/`), el cliente de la plataforma (`lib/`), el proveedor de
tema (`components/`), el motor de animación y el video (`motion/`, `video/`) y
tres módulos de worker (`worker/response`, `worker/cookies` y
`worker/credit-settle`, el cobro y la devolución de una reserva de créditos que
usan onview y onview-studio desde v1.3.0). Envía TypeScript crudo: lo compila el
bundler de la app que lo consume.

`ventana/`, `lib/` y `components/` asumen el DOM; `worker/` asume
`@cloudflare/workers-types`. Nunca se importa cruzando esa frontera (hay dos
`tsconfig` por eso).

El pin es a un **tag** de git, no a master (`github:OnView-cc/shared#vX.Y.Z`;
consumidores: `onview`, `admin` y `onview-studio`). El repo es **público**: el
CI de los consumidores lo baja con `npm ci`, sin token. Para trabajar shared en
local contra una app, se enlaza con una junction y se quita con `rmdir` antes de
commitear.
El mundo visual de OnView es **«Ventana»** (`ventana/`), en todas las pantallas
desde la v3.0.0 (escenas con código desde la v3.1.0). Ver `decisiones.md` y lo que falta en `pendiente.md`. Las
dependencias de runtime son `peerDependencies`; cada consumidor las deduplica
(`dedupe` en su `vite.config.ts`) para que no haya dos React.

## Ventana: el mundo de OnView (v2.8.0 a v3.0.0)

Un oscuro único, sin color de acento, con vidrio tipo Apple (Liquid Glass). Vive
en `ventana/` (componentes) y `styles/ventana/` (CSS). Llegó en cinco partes
(spec `../../docs/superpowers/specs/2026-11-20-onview-ventana-sistema-design.md`
§0: sistema, sitio y acceso, app sin editor, editor, admin y correos); al cerrar
la quinta (v3.0.0) se borró Feed vertical (`sky/`, `styles/sky.css`,
`styles/site.css`) y los restos de shadcn (`ui/`). Todo se ve en
`/dev-preview/ventana` de `onview`.

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
oscureciendo o con filete, nunca aclarando el relleno bajo el texto. Las piezas
del sistema dentro de un vidrio (el pie de un campo en una hoja, una pestaña, un
botón de peligro) no tienen que elegir: cada grado reasigna `--vn-ink-2` y
`--vn-danger` por cascada (ver `decisiones.md`). Sobre vidrio fino el peligro sólo
vale para un icono. Lo que se pinta sobre una caja sólida aunque la pieza viva
dentro de un vidrio (el texto de ejemplo de un campo, el botón del interruptor
apagado) usa `--vn-ink-2-solid` (#a1a1a6), que ningún vidrio reasigna: así un
campo vacío no parece escrito.

**Chips dentro de un vidrio.** Un chip sólido dentro de una lámina es una
píldora casi negra, y uno de vidrio sería un vidrio dentro de otro (vuelve al
ahumado). Para eso está `Chip tone="line"`: sólo filete, sin relleno; elegido,
el filete pasa a tinta y engorda, nunca aclara.

**La garantía del luminoso pide que el vidrio vea su fondo.** Un antepasado entre
el vidrio y el fondo con `opacity` menor que 1, `filter`, `mask`, `clip-path` o
`mix-blend-mode` (o `will-change` de alguna) le quita la atenuación. Anima la
propia pieza, nunca un envoltorio; o envuelve ese contenido en `.vn`, que vuelve
al ahumado.

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

**Lo que tiene que ganar a una hoja ajena sin capa lleva `!important`.** Con la
hoja en `@layer components`, cualquier declaración normal SIN capa le gana, pese a
la especificidad: es el caso de sonner, que inyecta su CSS sin capa. Una
`!important` con capa gana a una normal sin capa (y sigue valiendo si alguien
importa la hoja sin capa). En Ventana son sólo tres, las del aviso (el contorno y
la sombra del foco y el color de la descripción); `tests/ventana-tokens.test.ts`
lee la hoja de sonner y las enumera. Una pieza nueva sobre otra librería con CSS
sin capa hace lo mismo y lo prueba igual.

**Una hoja sin capa gana a las de Ventana.** Mientras convivió con Feed vertical
(hasta la v3.0.0), `.sk :focus-visible` y `.sk a` pisaban el foco y los enlaces
de toda pieza montada dentro de `.sk`. Feed vertical ya no existe, pero la regla
sigue: una hoja de un consumidor sin `@layer` y con un selector más fuerte gana
a la pieza. Una pantalla es Ventana por su raíz (`.vn`), no
metiendo piezas nuevas dentro de la vieja.

**Qué sirve de disparador** de `Menu`, `Popover` y `Tooltip`: algo que acepte un
`ref` y reparta sus props en el elemento que pinta, porque Radix le pasa los
suyos (`asChild`). Un `Button`, un `IconButton` o un elemento nativo (`<button>`,
`<a>`). Un `Chip` no.

**Dentro de una hoja.** `Sheet` y la hoja estrecha de `NavBar` son `<dialog>`
modales (capa superior, el resto inerte). Dan su diálogo por un contexto
(`ventana/portal-host.ts`) y los paneles de `Select`, `Menu`, `Popover` y
`Tooltip` se montan dentro de él, no en `body`. Una pieza tuya sobre Radix que
pueda abrirse dentro de una hoja pasa `usePortalHost()` como `container` de su
`Portal`.

### Las piezas

| Pieza | Archivo | Qué es |
|---|---|---|
| `Glass`, `Lit`, `Scrim`, `Glow` | `ventana/glass.tsx` | superficie de vidrio (`grade`, `solid`), ámbito luminoso, oscurecimiento bajo texto sobre video, resplandor quieto con los colores del contenido |
| `Button`, `IconButton` | `ventana/button.tsx` | primaria (cápsula blanca), vidrio, sin fondo, sólo filete (`line`, para ir dentro de un vidrio) y peligro; aceptan `ref` |
| `TextField`, `TextArea` | `ventana/field.tsx` | campos sólidos con etiqueta, ayuda y error; el textarea crece |
| `Select` | `ventana/select.tsx` | desplegable de vidrio propio, con teclado completo |
| `Segmented` | `ventana/segmented.tsx` | control segmentado con pulgar que se desliza |
| `Switch`, `Check` | `ventana/toggle.tsx` | interruptor y casilla |
| `Chip`, `StateChip` | `ventana/chip.tsx` | chip elegible o etiqueta, en tres tonos (`solid`, `glass` sobre un video, `line` dentro de un vidrio); etiqueta de estado de una toma |
| `Menu`, `Popover`, `Tooltip`, `TooltipGroup` | `ventana/overlay.tsx` | lo que flota junto a un botón (vidrio grueso, sobre Radix); `Menu` y `Popover` admiten `open` y `onOpenChange` |
| `PortalHost`, `usePortalHost` | `ventana/portal-host.ts` | el `<dialog>` de la hoja que contiene una pieza, para montar ahí sus paneles de Radix |
| `Sheet` | `ventana/sheet.tsx` | hoja y diálogo sobre `<dialog>` nativo: sube en el teléfono, escala en escritorio |
| `Toaster` | `ventana/toast.tsx` | avisos con `sonner` y el estilo del sistema |
| `NavBar` | `ventana/nav-bar.tsx` | la barra flotante en cápsula |
| `Section`, `Row`, `Skeleton`, `Alert`, `Status`, `Tabs`, `Progress`, `Accordion`, `Monogram` | `ventana/content.tsx` | lo sólido: contenido sobre el suelo; `Row chevron` pinta la flecha de Ajustes |
| `Panel`, `RowGroup` | `ventana/content.tsx` | la lámina sólida (superficie, filete y radio de hoja; `raised`, el escalón más claro) y el grupo de filas como Ajustes (rótulo encima, filete sólo entre filas) |
| `SaveRow`, `ConfirmRow`, `CopyButton` | `ventana/form-rows.tsx` | el pie de un formulario, cancelar y confirmar un acto y copiar un valor; todo el texto por props (`words`, `cancelLabel`, `copiedLabel`) |
| `Dock`, `DockItem` | `ventana/dock.tsx` | la navegación de la app: cápsula de vidrio ahumado abajo y al centro; en estrecho, iconos y el + redondo; `compact` y `hidden` los decide quien lo monta |
| `LinkLike` | `ventana/link.ts` | el enlace que reciben `Dock` y `AppFrame` por `linkAs` (el del enrutador de quien los monta; por defecto un `<a>`) |
| `AppFrame` | `ventana/app-frame.tsx` | el armazón de la app: raíz `.vn` (nunca luminosa), resplandor del kit, marca y cuenta arriba (o la vuelta en cápsula con `back`), el hueco del dock y el pie |
| `SideFrame`, `SideNavItem`, `SIDE_NARROW` | `ventana/side-frame.tsx` | el armazón de la consola de administración: barra lateral de vidrio ahumado grueso a la izquierda (marca, secciones con su cifra, cuenta); por debajo de 64rem, la `NavBar` con las secciones en su hoja |
| `Tag` | `ventana/data.tsx` | la etiqueta de estado de una fila o ficha: sólida, `neutral` (filete), `solid`, `alert` (rojo de peligro) y `live` (con punto) |
| `DataTable`, `Column`, `Stat` | `ventana/data.tsx` | la tabla (una `<table>` con nombre que se desplaza dentro de su lámina; `empty`, `loading` y fila que se abre con un botón de verdad) y la cifra grande tabular con su rótulo y detalle; sólidas |
| `useNarrow`, `useReducedMotion`, `useStepKeys`, `useFlash`, `useScrollToStop` | `ventana/hooks.ts` | los hooks que sobreviven a Feed vertical |
| `VideoFrame` | `ventana/video-frame.tsx` | marco de video 9:16, 1:1 o 16:9 con su rótulo y su propio scrim |
| `Mark`, `Wordmark`, `AiMark` | `ventana/marks.tsx` | las marcas: OnView («Dos capas») e Iris («El prisma»; pensando, el aro gira) |
| `MARK`, `markSvg`, `markGlassSvg` | `ventana/mark.ts` | la marca de OnView como datos (la usa `onview/scripts/render-brand.mjs`): el dibujo plano y el de vidrio, que sólo va grande sobre el casi negro (icono de app, imagen para compartir) |
| `AI_NAME`, `AI_SPECTRUM`, `AI_MARK`, `aiMarkSvg` | `ventana/ai-mark.ts` | Iris como datos |
| `GLASS`, `underGlass`, `glassContrast`, `passesOnGlass` | `ventana/glass-contrast.ts` | la cuenta del contraste sobre vidrio |
| `SPRINGS`, `springLinear` | `ventana/springs.ts` | los muelles; `npm run springs` regenera `styles/ventana/motion.css`, que no se edita a mano |

El CSS: `tokens.css` (tokens `--vn-*` y valores vivos del vidrio), `type.css`
(la escala: `vn-display`, `vn-title-1`, `vn-title-2`, `vn-title-3`, `vn-lead`, `vn-body`,
`vn-small`, `vn-label`, `vn-num`, `vn-wrap`, `vn-link`, `vn-prose`), `glass.css`,
`frame.css` (el armazón y el dock), `motion.css` (`vn-arrive` y `vn-press`: la llegada es una animación de fotogramas
y va **en la propia pieza, nunca en un envoltorio de un vidrio**; convive con
`vn-press` y con la transición de cualquier pieza), `controls.css`, `content.css`
y `overlays.css`.
El espectro de Iris es lo único con color propio de la interfaz y no aparece en
ninguna hoja de estilos: el aro se arma en JavaScript desde `AI_SPECTRUM`.

### La IA se llama Iris

`AI_NAME = "Iris"` en `ventana/ai-mark.ts` (hasta la v3.0.0 también en
`sky/ai-mark.ts`, ya borrado).
Se llamó Lumen hasta el 2026-11-20. La parte 2 cambia de una vez lo que la gente
lee (el diccionario, `/lumen` a `/iris`, los legales, los correos, las etiquetas
del admin y las instrucciones con que la IA se presenta). Tablas, columnas,
constantes y nombres de archivo no se renombran: por dentro sigue `lumen`. La
voz de narración del catálogo que también se llamaba «Iris» cambia de nombre con
ese mismo despliegue (ver `pendiente.md`).

## Módulos

<!-- BEGIN generated:modules -->
<!-- No edites aquí: lo reescribe `npm run docs`. -->

Módulos de las carpetas publicadas (57), con la primera línea de su comentario de cabecera.

| Archivo | Qué hace |
| --- | --- |
| [`components/theme-provider.tsx`](../components/theme-provider.tsx) | OnView es oscuro entero (Ventana, como antes Feed vertical): el mismo casi negro fuera y dentro. |
| [`lib/platform-client.test.ts`](../lib/platform-client.test.ts) | El cliente de plataforma: la URL de entrada, las credenciales en cada llamada, la frase del servidor y un solo refresh. |
| [`lib/platform-client.ts`](../lib/platform-client.ts) | Hablar con el control plane desde una consola que vive en otro origen (admin., partners., developers. |
| [`lib/platform-origin-local.test.ts`](../lib/platform-origin-local.test.ts) | En local, una consola habla con el `wrangler pages dev` de onview (puerto 8900). |
| [`lib/platform-origin.test.ts`](../lib/platform-origin.test.ts) | Sin `VITE_PLATFORM_ORIGIN`, una consola en un subdominio habla con el apex de producción. |
| [`lib/vite-env.d.ts`](../lib/vite-env.d.ts) | Las variables de build que lee el paquete (`import.meta.env`). |
| [`ventana/ai-mark.ts`](../ventana/ai-mark.ts) | Iris, la IA de OnView en el mundo Ventana. |
| [`ventana/app-frame.test.tsx`](../ventana/app-frame.test.tsx) | El armazón de la app en Ventana: la raíz `.vn` (ahumada, nunca luminosa), el resplandor del kit detrás, arriba la marca y la cuenta (o la vuelta), el contenido con el… |
| [`ventana/app-frame.tsx`](../ventana/app-frame.tsx) | El armazón de la app en Ventana (spec 2026-11-23-onview-app-ventana §5): la raíz `.vn` (vidrio ahumado: la app enseña contenido del usuario y nunca va en una zona… |
| [`ventana/button.test.tsx`](../ventana/button.test.tsx) | Botones de Ventana: etiqueta o enlace según haya `href`, deshabilitado, nombre accesible del botón de ícono y la pulsación común. |
| [`ventana/button.tsx`](../ventana/button.tsx) | Botones en cápsula de Ventana. |
| [`ventana/chip.test.tsx`](../ventana/chip.test.tsx) | Chip y StateChip de Ventana: span o botón según haya `onSelect`, aspa propia que no dispara la selección, ni un botón dentro de otro, y los materiales (sólido sin… |
| [`ventana/chip.tsx`](../ventana/chip.tsx) | Chip y StateChip de Ventana. |
| [`ventana/content.test.tsx`](../ventana/content.test.tsx) | Piezas sólidas de contenido de Ventana: Section, Row, Skeleton, Alert, Status, Tabs, Progress, Accordion y Monogram. |
| [`ventana/content.tsx`](../ventana/content.tsx) | Las piezas sólidas de contenido de Ventana: Section, Row, Skeleton, Alert, Status, Tabs, Progress, Accordion y Monogram. |
| [`ventana/data.test.tsx`](../ventana/data.test.tsx) | La tabla y la cifra de Ventana (spec 2026-11-24-onview-admin-correos-ventana §4.2): láminas sólidas para leer datos. |
| [`ventana/data.tsx`](../ventana/data.tsx) | La tabla y la cifra de Ventana: láminas sólidas para leer datos (spec 2026-11-24-onview-admin-correos-ventana §4.2). |
| [`ventana/dock.test.tsx`](../ventana/dock.test.tsx) | El dock de Ventana: la cápsula de vidrio ahumado de abajo. |
| [`ventana/dock.tsx`](../ventana/dock.tsx) | El dock de Ventana: la navegación de la app, una cápsula de vidrio que flota abajo y al centro, igual en escritorio y teléfono (spec 2026-11-23-onview-app- ventana §5). |
| [`ventana/field.test.tsx`](../ventana/field.test.tsx) | Campos de Ventana: etiqueta enlazada, ayuda y error accesibles, cuenta de caracteres y el alto de TextArea, que crece con el texto hasta `maxRows`. |
| [`ventana/field.tsx`](../ventana/field.tsx) | Campos de Ventana: de una línea (`TextField`) y de varias (`TextArea`). |
| [`ventana/form-rows.test.tsx`](../ventana/form-rows.test.tsx) | Las filas de formulario de Ventana: guardar, confirmar y copiar. |
| [`ventana/form-rows.tsx`](../ventana/form-rows.tsx) | Las filas de formulario de Ventana (las gemelas de las de la consola de Feed vertical, ya borrada), sin texto escrito: todo lo visible llega por props (`words`,… |
| [`ventana/glass-contrast.test.ts`](../ventana/glass-contrast.test.ts) | La cuenta del contraste sobre vidrio (`glass-contrast.ts`): la garantía del ahumado dicha con la función, los techos del luminoso como frontera exacta (con su holgura),… |
| [`ventana/glass-contrast.ts`](../ventana/glass-contrast.ts) | La cuenta del contraste sobre el vidrio de Ventana: dado el color que hay detrás, qué color queda bajo el texto y cuánto contrasta la tinta con él. |
| [`ventana/glass.test.tsx`](../ventana/glass.test.tsx) | Vidrio, scrim y brillo de Ventana: las clases que pinta cada pieza y lo que pasa con lo que sobra (más de tres colores) o falta (ninguno). |
| [`ventana/glass.tsx`](../ventana/glass.tsx) | Vidrio, scrim y brillo de Ventana. |
| [`ventana/hooks.test.ts`](../ventana/hooks.test.ts) | Los hooks de Ventana (los que sobreviven a Feed vertical): la anchura, el movimiento reducido, el paso con flechas, el aviso que se apaga solo y la parada de la URL. |
| [`ventana/hooks.ts`](../ventana/hooks.ts) | Los hooks de Ventana: la anchura, el movimiento reducido, el paso con flechas, el aviso que se apaga solo y la parada de la URL. |
| [`ventana/link.ts`](../ventana/link.ts) | El enlace que pinta una pieza de Ventana cuando quien la monta tiene un enrutador: `Dock` y `AppFrame` aceptan `linkAs` para que la navegación de la app no recargue la… |
| [`ventana/mark.test.ts`](../ventana/mark.test.ts) | Las marcas de Ventana como datos: «Dos capas» (OnView) y «El prisma» (Iris). |
| [`ventana/mark.ts`](../ventana/mark.ts) | La marca de OnView en el mundo Ventana, «Dos capas», como datos: **dos marcos verticales 9:16 superpuestos**, el video (atrás, tenue) y el vidrio que flota encima… |
| [`ventana/marks.test.tsx`](../ventana/marks.test.tsx) | Mark, AiMark y Wordmark de Ventana. |
| [`ventana/marks.tsx`](../ventana/marks.tsx) | Las piezas de marca del mundo Ventana: la marca de OnView («Dos capas»), el símbolo de Iris («El prisma») y el logotipo. |
| [`ventana/nav-bar.test.tsx`](../ventana/nav-bar.test.tsx) | Barra de navegación de Ventana: cápsula de vidrio fino con los enlaces en línea desde 48rem y, por debajo, un botón de menú que abre una hoja de vidrio grueso desde… |
| [`ventana/nav-bar.tsx`](../ventana/nav-bar.tsx) | La barra de navegación de Ventana: una cápsula de vidrio fino que flota. |
| [`ventana/overlay.test.tsx`](../ventana/overlay.test.tsx) | Menú, popover y tooltip de Ventana sobre Radix: contenido dentro de `.vn`, vidrio grueso en el panel (nunca en las filas), teclado, ítems apagados, separador, nombre… |
| [`ventana/overlay.tsx`](../ventana/overlay.tsx) | Lo que flota en Ventana, sobre Radix: `Menu` (acciones de un disparador), `Popover` (un panel con contenido propio) y `Tooltip` (una frase corta). |
| [`ventana/portal-host.ts`](../ventana/portal-host.ts) | Dónde montan sus paneles las piezas de Radix de Ventana (`Select`, `Menu`, `Popover`, `Tooltip`). |
| [`ventana/segmented.test.tsx`](../ventana/segmented.test.tsx) | Segmentado de Ventana: radiogroup con tabindex móvil, flechas, Inicio y Fin, pulgar de vidrio medido del botón elegido, sin animar al primer pintado y quieto con… |
| [`ventana/segmented.tsx`](../ventana/segmented.tsx) | Control segmentado de Ventana. |
| [`ventana/select.test.tsx`](../ventana/select.test.tsx) | Desplegable de Ventana sobre Radix: nombre accesible, texto del disparador, lista montada dentro de `.vn`, teclado, opciones apagadas y valor vacío. |
| [`ventana/select.tsx`](../ventana/select.tsx) | El desplegable de Ventana, sobre Radix: el disparador es un campo sólido (`variant="field"`) o una cápsula sólida (`variant="chip"`), y la lista es un panel de vidrio… |
| [`ventana/sheet.test.tsx`](../ventana/sheet.test.tsx) | Hoja y avisos de Ventana: `<dialog>` nativo (abrir, cerrar, nombre, Escape, clic fuera, foco) y `Toaster` sobre sonner con las clases de vidrio del sistema. |
| [`ventana/sheet.tsx`](../ventana/sheet.tsx) | La hoja de Ventana, sobre el `<dialog>` nativo: el sistema ya atrapa el foco, lo devuelve al cerrar y sabe de Escape. |
| [`ventana/side-frame.test.tsx`](../ventana/side-frame.test.tsx) | El armazón con barra lateral (spec 2026-11-24-onview-admin-correos-ventana §4.1): en ancho, una barra de vidrio ahumado a la izquierda con la marca, las secciones y la… |
| [`ventana/side-frame.tsx`](../ventana/side-frame.tsx) | El armazón con barra lateral de Ventana: la consola de administración (spec 2026-11-24-onview-admin-correos-ventana §4.1). |
| [`ventana/springs.test.ts`](../ventana/springs.test.ts) | Muelles de Ventana: la curva se calcula en `springs.ts` y `npm run springs` la escribe como `linear()` en `styles/ventana/motion.css` (eso lo prueba… |
| [`ventana/springs.ts`](../ventana/springs.ts) | Muelles de Ventana. |
| [`ventana/toast.tsx`](../ventana/toast.tsx) | Los avisos de Ventana, sobre sonner, con el mismo juego de iconos que `ui/sonner.tsx`. |
| [`ventana/toggle.test.tsx`](../ventana/toggle.test.tsx) | Interruptor y casilla de Ventana: teclado, deshabilitado, texto clicable y piezas sólidas. |
| [`ventana/toggle.tsx`](../ventana/toggle.tsx) | Interruptor y casilla de Ventana, ambos sólidos (nunca vidrio): apagado sobre `--vn-raised`, encendido sobre `--vn-ink` con la perilla o la marca en `--vn-action-ink`. |
| [`ventana/video-frame.test.tsx`](../ventana/video-frame.test.tsx) | VideoFrame de Ventana: el formato como clase (el aspect-ratio vive en el CSS y lo comprueba tests/ventana-tokens.test.ts), rótulo con su propio scrim dentro del… |
| [`ventana/video-frame.tsx`](../ventana/video-frame.tsx) | Marco de video de Ventana, con la firma del `VideoFrame` de Feed vertical: el medio de borde a borde en su formato, radio de panel y el rótulo abajo a la izquierda. |
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
