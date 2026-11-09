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
