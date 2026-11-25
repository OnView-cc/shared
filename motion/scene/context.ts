/**
 * El `ctx` de una escena (spec 2026-11-24-onview-escenas-con-codigo §6.2): lo
 * mismo que recibe un bloque (`BlockCtx`) más lo que una escena necesita para
 * ser determinista y editable:
 *
 * - `text(clave)` e `image(clave|índice)`: los textos y las imágenes del momento
 *   (el código nunca escribe textos en literal: la persona los edita).
 * - `random(semilla)`: un aleatorio con semilla (mulberry32); `Math.random` está
 *   prohibido.
 * - `event(tipo, t)`: los eventos (clic, una pieza que cae…), con su segundo
 *   absoluto; se guardan desde el inicio del momento y numerados por tipo, y de
 *   ellos salen los efectos de sonido (§9.1).
 * - `handoff` / `receive`: pasar una pieza a la escena siguiente (§6.5). El
 *   registro es uno por montaje del motor (`createHandoffRegistry`).
 */
import type { ComposeImage } from "../../video/compose";
import type { BlockCtx } from "../registry";
import type { SceneParams } from "../types";
import type { SceneEvent, SceneEventKind } from "./events";

export type { SceneEvent, SceneEventKind } from "./events";
export { SCENE_EVENT_KINDS } from "./events";

export interface HandoffRegistry {
	give(name: string, el: HTMLElement, at: number): void;
	take(name: string): { el: HTMLElement; rect: { x: number; y: number; w: number; h: number } } | null;
}

export interface SceneCtx extends BlockCtx {
	at: number;
	seconds: number;
	width: number;
	height: number;
	text(key: string): string;
	image(key: string | number): ComposeImage | null;
	random(seed: number): () => number;
	event(kind: SceneEventKind, t: number): void;
	handoff(name: string, el: HTMLElement): void;
	receive(name: string): HTMLElement | null;
}

/** El aleatorio con semilla: mulberry32. */
export function seeded(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function createHandoffRegistry(): HandoffRegistry {
	const held = new Map<string, { el: HTMLElement; rect: { x: number; y: number; w: number; h: number } }>();
	return {
		give(name, el) {
			// La caja respecto al escenario, en píxeles del cuadro (el escenario no se escala en la exportación).
			const stage = el.closest<HTMLElement>(".motion-stage");
			const r = el.getBoundingClientRect();
			const s = stage?.getBoundingClientRect() ?? { left: 0, top: 0 };
			held.set(name, { el, rect: { x: r.left - s.left, y: r.top - s.top, w: r.width, h: r.height } });
		},
		take(name) {
			const got = held.get(name) ?? null;
			held.delete(name);
			return got;
		},
	};
}

export function sceneContext(base: BlockCtx, params: SceneParams, handoffs: HandoffRegistry): { ctx: SceneCtx; events: () => SceneEvent[] } {
	const { at, seconds, images } = base.moment;
	const raw: { kind: SceneEventKind; at: number }[] = [];
	const ctx: SceneCtx = {
		...base,
		at,
		seconds,
		width: base.doc.width,
		height: base.doc.height,
		text: (key) => params.texts[key] ?? "",
		image: (key) => (typeof key === "number" ? (images[key] ?? null) : (images.find((im) => im.id === key) ?? null)),
		random: (seed) => seeded(seed),
		event(kind, t) {
			const rel = t - at;
			if (rel < -0.001 || rel > seconds + 0.001) return;
			raw.push({ kind, at: Math.round(Math.max(0, rel) * 1000) / 1000 });
		},
		handoff(name, el) {
			handoffs.give(name, el, at + seconds);
		},
		receive(name) {
			const got = handoffs.take(name);
			if (!got) return null;
			const { el, rect } = got;
			// Sigue donde estaba: posición absoluta dentro de la capa de esta escena.
			Object.assign(el.style, { position: "absolute", left: `${rect.x}px`, top: `${rect.y}px`, width: `${rect.w}px`, height: `${rect.h}px`, margin: "0" });
			base.el.appendChild(el);
			return el;
		},
	};
	const events = (): SceneEvent[] => {
		const sorted = [...raw].sort((a, b) => a.at - b.at);
		const count = new Map<SceneEventKind, number>();
		return sorted.map((e) => {
			const n = count.get(e.kind) ?? 0;
			count.set(e.kind, n + 1);
			return { kind: e.kind, at: e.at, n };
		});
	};
	return { ctx, events };
}
