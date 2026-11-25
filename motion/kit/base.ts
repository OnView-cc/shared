/**
 * Lo que comparten los componentes de la caja (spec 2026-11-24 §6.3): crear
 * una pieza con posición absoluta en unidades `u` (1 % del lado corto), los
 * colores del kit, normalizar palabras para compararlas, y la ficha de
 * documentación de cada componente (`ComponentDoc`), que `docs.ts` junta para
 * el modelo que escribe escenas.
 *
 * Reglas de todos los componentes: animan sólo en `ctx.tl` (tiempos absolutos,
 * `immediateRender: false` y el estado de partida puesto con `gsap.set`), no
 * crean nodos dentro de un `onUpdate` y dibujan dentro de `ctx.el` (o de la
 * pieza que se les pase).
 */
import type { SceneCtx } from "../scene/context";

export interface ComponentDoc {
	name: string;
	signature: string;
	options: string;
	example: string;
}

/** Un componente con su ficha colgada (`KineticText.doc`). */
export type Documented<F> = F & { doc: ComponentDoc };
export function documented<F>(fn: F, doc: ComponentDoc): Documented<F> {
	return Object.assign(fn as object, { doc }) as Documented<F>;
}

/** Lo que mide el escenario en `u`. */
export const stageU = (ctx: SceneCtx) => ({ w: ctx.width / ctx.u, h: ctx.height / ctx.u });

/** Una pieza nueva, con posición absoluta y centrada en (x, y) en `u`; sin (x, y), en el centro del cuadro. */
export function piece(ctx: SceneCtx, cls: string, o: { x?: number; y?: number; width?: number; height?: number; parent?: HTMLElement } = {}): HTMLElement {
	const el = ctx.el.ownerDocument.createElement("div");
	el.className = cls;
	const s = stageU(ctx);
	Object.assign(el.style, {
		position: "absolute",
		left: `${(o.x ?? s.w / 2) * ctx.u}px`,
		top: `${(o.y ?? s.h / 2) * ctx.u}px`,
		transform: "translate(-50%, -50%)",
	});
	if (o.width != null) el.style.width = `${o.width * ctx.u}px`;
	if (o.height != null) el.style.height = `${o.height * ctx.u}px`;
	(o.parent ?? ctx.el).appendChild(el);
	return el;
}

/** `#rrggbb` a `rgba(r, g, b, a)`. */
export function rgba(hex: string, alpha: number): string {
	const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
	if (!m) return `rgba(255, 255, 255, ${alpha})`;
	const n = parseInt(m[1]!, 16);
	return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${alpha})`;
}

/** Una palabra para comparar: minúsculas, sin acentos ni signos. */
export const norm = (w: string) =>
	w
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.replace(/[^\p{L}\p{N}]/gu, "")
		.toLowerCase();

export const AFTER = { immediateRender: false } as const;

/** Un tiempo dentro del momento: nunca antes de que empiece ni después de que acabe. */
export const within = (ctx: SceneCtx, t: number) => Math.min(ctx.at + ctx.seconds, Math.max(ctx.at, t));
