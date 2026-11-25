/**
 * El cursor de la caja (spec 2026-11-24 §6.3): una flecha o un dedo que se
 * mueve, pulsa con onda, arrastra y escribe en un campo. Las acciones se piden
 * en el orden en que pasan: cada movimiento parte de donde quedó el anterior.
 * Emite `click` al pulsar, `swipe` al arrastrar y `type` cada 3 letras.
 *
 * Los puntos van en `u` del escenario (como los que da `Device.point`).
 */
import { gsap } from "gsap";
import type { SceneCtx } from "../scene/context";
import { AFTER, documented, stageU, within } from "./base";

type P = { x: number; y: number };

export interface CursorHandle {
	el: HTMLElement;
	moveTo(p: P, o: { at: number; duration?: number }): void;
	tap(p: P, o: { at: number }): void;
	drag(from: P, to: P, o: { at: number; duration?: number }): void;
	type(field: HTMLElement, text: string, o: { at: number; cps?: number }): void;
}

const ARROW = '<svg viewBox="0 0 24 24" width="100%" height="100%"><path d="M4 2 L4 20 L9 15.5 L12.5 22.5 L15.5 21 L12 14 L19 14 Z" fill="#111" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/></svg>';
const FINGER = '<svg viewBox="0 0 24 24" width="100%" height="100%"><circle cx="12" cy="12" r="9" fill="rgba(255,255,255,0.55)" stroke="rgba(0,0,0,0.35)" stroke-width="1.2"/></svg>';

function cursor(ctx: SceneCtx, o: { start?: P; kind?: "arrow" | "finger" } = {}): CursorHandle {
	const { tl, u } = ctx;
	const doc = ctx.el.ownerDocument;
	const s = stageU(ctx);
	const size = (o.kind === "finger" ? 6 : 4.2) * u;
	const el = doc.createElement("div");
	el.className = "kit-cursor";
	el.innerHTML = o.kind === "finger" ? FINGER : ARROW;
	// La punta de la flecha (o el centro del dedo) es el punto.
	Object.assign(el.style, { position: "absolute", left: "0", top: "0", width: `${size}px`, height: `${size}px`, zIndex: "50", pointerEvents: "none", marginLeft: o.kind === "finger" ? `${-size / 2}px` : `${-size * 0.17}px`, marginTop: o.kind === "finger" ? `${-size / 2}px` : `${-size * 0.08}px`, transformOrigin: "top left" });
	ctx.el.appendChild(el);
	let last: P = o.start ?? { x: s.w * 0.62, y: s.h * 0.7 };
	gsap.set(el, { x: last.x * u, y: last.y * u, opacity: 0, scale: 1 });
	let shown = false;
	const show = (t: number) => {
		if (shown) return;
		shown = true;
		tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.2, ease: "none", ...AFTER }, Math.max(ctx.at, t - 0.2));
	};
	const move = (p: P, start: number, duration: number) => {
		show(start);
		tl.fromTo(el, { x: last.x * u, y: last.y * u }, { x: p.x * u, y: p.y * u, duration, ease: "power3.inOut", ...AFTER }, start);
		last = p;
	};
	const press = (t: number) => tl.fromTo(el, { scale: 1 }, { scale: 0.82, duration: 0.08, ease: "power2.out", yoyo: true, repeat: 1, ...AFTER }, t);
	const ripple = (p: P, t: number) => {
		const r = doc.createElement("div");
		r.className = "kit-ripple";
		Object.assign(r.style, { position: "absolute", left: `${p.x * u}px`, top: `${p.y * u}px`, width: `${5 * u}px`, height: `${5 * u}px`, margin: `${-2.5 * u}px 0 0 ${-2.5 * u}px`, borderRadius: "50%", border: `${0.35 * u}px solid ${ctx.doc.brand.accent}`, boxSizing: "border-box", pointerEvents: "none", zIndex: "49" });
		ctx.el.appendChild(r);
		gsap.set(r, { opacity: 0, scale: 0.2 });
		tl.fromTo(r, { opacity: 0.9, scale: 0.2 }, { opacity: 0, scale: 1.6, duration: 0.5, ease: "power2.out", ...AFTER }, t);
	};

	return {
		el,
		moveTo(p, { at, duration = 1 }) {
			move(p, within(ctx, at), duration * ctx.beatSeconds);
		},
		tap(p, { at }) {
			const t = within(ctx, at);
			if (p.x !== last.x || p.y !== last.y) move(p, Math.max(ctx.at, t - 0.45), 0.4);
			show(t);
			press(t);
			ripple(p, t);
			ctx.event("click", t);
		},
		drag(from, to, { at, duration = 2 }) {
			const t = within(ctx, at);
			if (from.x !== last.x || from.y !== last.y) move(from, Math.max(ctx.at, t - 0.45), 0.4);
			show(t);
			tl.fromTo(el, { scale: 1 }, { scale: 0.85, duration: 0.1, ...AFTER }, t);
			move(to, t + 0.1, duration * ctx.beatSeconds);
			tl.fromTo(el, { scale: 0.85 }, { scale: 1, duration: 0.1, ...AFTER }, t + 0.1 + duration * ctx.beatSeconds);
			ctx.event("swipe", t);
		},
		type(field, text, { at, cps = 12 }) {
			const t = within(ctx, at);
			field.textContent = "";
			const proxy = { n: 0 };
			tl.fromTo(
				proxy,
				{ n: 0 },
				{ n: text.length, duration: text.length / cps, ease: "none", ...AFTER, onUpdate: () => void (field.textContent = text.slice(0, Math.round(proxy.n))), onReverseComplete: () => void (field.textContent = "") },
				t,
			);
			for (let i = 0; i < text.length; i += 3) ctx.event("type", t + i / cps);
		},
	};
}

export const Cursor = documented(cursor, {
	name: "Cursor",
	signature: "kit.Cursor(ctx, { start?, kind? }) → { el, moveTo(p, { at, duration? }), tap(p, { at }), drag(from, to, { at, duration? }), type(field, text, { at, cps? }) }",
	options:
		"A pointer ('arrow', default) or a finger ('finger', for phones). Points are { x, y } in stage u — use device.point({ x, y }) to aim inside a screen. Call actions in time order; each move starts where the last ended. moveTo duration in beats (1). tap emits 'click' with a ripple in the accent colour. drag emits 'swipe'. type writes text into an element you made (cps: letters per second, 12) and emits 'type'.",
	example: 'const c = kit.Cursor(ctx, { kind: "finger" });\nc.tap(phone.point({ x: 0.5, y: 0.82 }), { at: ctx.beat(3) });',
});
