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
