# @onview/shared — documentación

**El código común de las apps de OnView.** UI (`ui/`, `components/`), cliente
CRUD y helpers (`lib/`, `hooks/`), el mundo visual y sus piezas (`styles/`,
`sky/`) y dos módulos de worker (`worker/response`, `worker/cookies`). Envía TypeScript crudo: lo compila el bundler de la app que
lo consume.

`ui/`, `lib/`, `hooks/`, `components/` y `sky/` asumen el DOM; `worker/` asume
`@cloudflare/workers-types`. Nunca se importa cruzando esa frontera (hay dos
`tsconfig` por eso).

El pin es a un **tag** de git, no a master (`github:OnView-cc/shared#v1.0.0`;
consumidores: `onview` y `admin`). El repo es **público**: el CI de los
consumidores lo baja con `npm ci`, sin token. Para trabajar shared en local
contra una app, se enlaza con una junction y se quita con `rmdir` antes de
commitear.
El mundo visual es **«Airglow»**, heredado del fork y provisional hasta que el
subproyecto 2 lo sustituya por «Blue Hour». Ver `decisiones.md` y lo
que falta en `pendiente.md`. Las dependencias de runtime son
`peerDependencies`; cada consumidor las deduplica (`dedupe` en su
`vite.config.ts`) para que no haya dos React.

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

Módulos de las carpetas publicadas (58), con la primera línea de su comentario de cabecera.

| Archivo | Qué hace |
| --- | --- |
| [`components/confirm-delete-modal.tsx`](../components/confirm-delete-modal.tsx) | «¿Seguro?» antes de un borrado, igual en toda la plataforma. |
| [`components/form-modal.tsx`](../components/form-modal.tsx) | El envoltorio de cualquier formulario en diálogo: título, descripción y hueco. |
| [`components/theme-provider.tsx`](../components/theme-provider.tsx) | Blue Hour es oscuro entero (spec §10): el cielo fuera, la tinta del editor dentro. |
| [`lib/crud-api.ts`](../lib/crud-api.ts) | El cliente CRUD que se repetía en cada feature, escrito una vez. |
| [`lib/crud-hooks.ts`](../lib/crud-hooks.ts) | Los hooks de React Query que van encima de `crud-api.ts`. |
| [`lib/initials.ts`](../lib/initials.ts) | Dos letras en lugar de alguien que todavía no tiene avatar. |
| [`lib/platform-client.ts`](../lib/platform-client.ts) | Hablar con el control plane desde una consola que vive en otro origen (admin., partners., developers. |
| [`lib/use-copy.ts`](../lib/use-copy.ts) | Copiar, hecho una sola vez para todo el proyecto: la misma implementación que partners y developers, la que usa `CopyTicket` en `console.tsx`. |
| [`lib/utils.ts`](../lib/utils.ts) | `cn` — juntar clases de Tailwind sin que se peleen entre ellas. |
| [`lib/vite-env.d.ts`](../lib/vite-env.d.ts) | Las variables de build que lee el paquete (`import.meta.env`). |
| [`sky/ai-mark.test.ts`](../sky/ai-mark.test.ts) | Lumen, la IA de OnView: su nombre y su símbolo, la primera ventana que se enciende a la hora azul. |
| [`sky/ai-mark.ts`](../sky/ai-mark.ts) | Lumen, la IA de OnView (nombre elegido por el usuario el 2026-11-09): la que escribe el guion y genera las tomas. |
| [`sky/blue-hour-sky.test.tsx`](../sky/blue-hour-sky.test.tsx) | El cielo de la hora azul: decoración pintada en un lienzo; con movimiento reducido, un solo cuadro. |
| [`sky/blue-hour-sky.tsx`](../sky/blue-hour-sky.tsx) | El cielo de la hora azul, pintado en un `<canvas>` 2D: el degradado que pasa del índigo al cobalto, la línea cálida del horizonte que se apaga, estrellas tenues arriba… |
| [`sky/console-frame.tsx`](../sky/console-frame.tsx) | El marco de consola del admin, en el mundo «Blue Hour»: la forma de una app de trabajo, la misma que el área con sesión de onview. |
| [`sky/console.tsx`](../sky/console.tsx) | Las piezas de la consola, en el mundo «Blue Hour» (2026-11-09). |
| [`sky/contact-strip.test.tsx`](../sky/contact-strip.test.tsx) | La tira de contactos: fotogramas numerados en un borde de película; el lápiz graso marca el elegido. |
| [`sky/contact-strip.tsx`](../sky/contact-strip.tsx) | La hoja de contactos de Blue Hour: un video es una tira de fotogramas en un borde de película (perforaciones arriba y abajo, números de fotograma en el margen, en la… |
| [`sky/day.test.tsx`](../sky/day.test.tsx) | El documento del mundo: mientras se ve una página de Blue Hour, `<html>` y la barra del navegador llevan la tinta del borde de película, y al salir vuelven a lo que… |
| [`sky/day.ts`](../sky/day.ts) | El documento entero lleva la tinta del borde de película de Blue Hour mientras se ve una página del mundo: el fondo de `<html>` (lo que asoma en el rebote del scroll) y… |
| [`sky/grease.test.tsx`](../sky/grease.test.tsx) | El lápiz graso: se traza al dibujarse, salvo con movimiento reducido, donde aparece ya dibujado. |
| [`sky/grease.tsx`](../sky/grease.tsx) | El lápiz graso ámbar del montador sobre la hoja de contactos: un círculo (la toma elegida), una cruz (descartada, pero sigue en la hoja) o una flecha (el orden). |
| [`sky/hooks.ts`](../sky/hooks.ts) | Hooks de scroll y de montaje contra los que se animan las páginas de Clear Sky, y los tres que usan las piezas de consola de `console.tsx` (`useFlash`, `useDismiss`,… |
| [`sky/kit.tsx`](../sky/kit.tsx) | Las piezas del mundo de OnView («Blue Hour»): la marca, el botón como enlace y la flecha. |
| [`sky/mark.test.ts`](../sky/mark.test.ts) | La marca de Blue Hour: un fotograma rodeado por el círculo abierto del lápiz graso ámbar. |
| [`sky/mark.ts`](../sky/mark.ts) | La marca de OnView en Blue Hour, como datos: **un fotograma rodeado por el círculo del lápiz graso**, la marca con la que un montador elige la toma buena en una hoja de… |
| [`sky/page.tsx`](../sky/page.tsx) | Las piezas de página del mundo de OnView («Blue Hour»), las del sitio de onview: la cabecera de página con su panel de cielo, el encabezado de sección, el aro de icono,… |
| [`sky/platform-client.test.ts`](../sky/platform-client.test.ts) | El cliente de plataforma: la URL de entrada, las credenciales en cada llamada, la frase del servidor y un solo refresh. |
| [`sky/platform-origin-local.test.ts`](../sky/platform-origin-local.test.ts) | En local, una consola habla con el `wrangler pages dev` de onview (puerto 8900). |
| [`sky/platform-origin.test.ts`](../sky/platform-origin.test.ts) | Sin `VITE_PLATFORM_ORIGIN`, una consola en un subdominio habla con el apex de producción. |
| [`sky/strike-number.test.tsx`](../sky/strike-number.test.tsx) | Un número que cambia lo hace de golpe, con un resplandor; nunca rueda por los valores intermedios. |
| [`sky/strike-number.tsx`](../sky/strike-number.tsx) | Un número que cambia (el saldo de créditos, un código de tiempo) lo hace de golpe: pinta el valor nuevo y le da un resplandor ámbar que decae en 260ms (`.sk-strike`, en… |
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
| `npm run docs` | `node scripts/gen-docs.mjs` |
| `npm run docs:check` | `node scripts/gen-docs.mjs --check` |
| `npm run docs:gaps` | `node scripts/gen-docs.mjs --gaps` |

<!-- END generated:config -->
