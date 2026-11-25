/**
 * La luz de la caja (spec 2026-11-24 §6.3): `Glow`, un brillo radial con el
 * color de la marca (el de Spotify y Daxuz detrás del teléfono), y
 * `GradientMesh`, un fondo de varios brillos con los colores del kit. Son
 * degradados, no filtros: no cuentan para el tope de `blur()`.
 */
import { gsap } from "gsap";
import type { SceneCtx } from "../scene/context";
import { AFTER, documented, piece, rgba, within } from "./base";

export interface GlowOptions {
	color?: string;
	x: number;
	y: number;
	size: number;
	pulse?: boolean;
	at: number;
}

function glow(ctx: SceneCtx, o: GlowOptions): { el: HTMLElement } {
	const el = piece(ctx, "kit-glow", { x: o.x, y: o.y, width: o.size, height: o.size });
	el.style.background = `radial-gradient(circle, ${rgba(o.color ?? ctx.doc.brand.accent, 0.55)} 0%, ${rgba(o.color ?? ctx.doc.brand.accent, 0)} 68%)`;
	el.style.pointerEvents = "none";
	el.style.zIndex = "0";
	const { tl } = ctx;
	const start = within(ctx, o.at);
	gsap.set(el, { opacity: 0, scale: 0.8 });
	tl.fromTo(el, { opacity: 0, scale: 0.8 }, { opacity: 1, scale: 1, duration: 0.8, ease: "sine.out", ...AFTER }, start);
	if (o.pulse) {
		// Late cada dos golpes hasta el final del momento.
		const period = 2 * ctx.beatSeconds;
		for (let t = start + 0.8; t + period <= ctx.at + ctx.seconds; t += period) {
			tl.fromTo(el, { scale: 1 }, { scale: 1.12, duration: period / 2, ease: "sine.inOut", yoyo: true, repeat: 1, ...AFTER }, t);
		}
	}
	return { el };
}

export const Glow = documented(glow, {
	name: "Glow",
	signature: "kit.Glow(ctx, { color?, x, y, size, pulse?, at }) → { el }",
	options: "A soft radial light. color: default the brand accent. x, y: centre in u. size: diameter in u. pulse: breathes every 2 beats. Put it before the pieces that sit on it.",
	example: "kit.Glow(ctx, { x: ctx.width / ctx.u / 2, y: 50, size: 90, pulse: true, at: ctx.beat(0) });",
});

export interface GradientMeshOptions {
	colors?: string[];
	drift?: boolean;
}

function gradientMesh(ctx: SceneCtx, o: GradientMeshOptions = {}): { el: HTMLElement } {
	const colors = (o.colors?.length ? o.colors : ctx.doc.brand.colors.length ? ctx.doc.brand.colors : [ctx.doc.brand.accent]).slice(0, 4);
	const el = ctx.el.ownerDocument.createElement("div");
	el.className = "kit-mesh";
	const spots = ["20% 25%", "80% 30%", "30% 80%", "75% 75%"];
	Object.assign(el.style, {
		position: "absolute",
		inset: "-10%",
		pointerEvents: "none",
		background: colors.map((c, i) => `radial-gradient(circle at ${spots[i]}, ${rgba(c, 0.5)} 0%, ${rgba(c, 0)} 55%)`).join(", "),
	});
	ctx.el.insertBefore(el, ctx.el.firstChild);
	if (o.drift) {
		const d = 3 * ctx.u;
		gsap.set(el, { x: -d, y: d * 0.5 });
		ctx.tl.fromTo(el, { x: -d, y: d * 0.5 }, { x: d, y: -d * 0.5, duration: ctx.seconds, ease: "none", ...AFTER }, ctx.at);
	}
	return { el };
}

export const GradientMesh = documented(gradientMesh, {
	name: "GradientMesh",
	signature: "kit.GradientMesh(ctx, { colors?, drift? }) → { el }",
	options: "A full-frame background of soft colour glows behind everything in the scene. colors: up to 4 (default: the brand kit colours). drift: moves slowly for the whole moment.",
	example: "kit.GradientMesh(ctx, { drift: true });",
});
