/**
 * La marca en la caja (spec 2026-11-24 §6.3): `LogoReveal`, el logo del kit
 * que entra armándose, con máscara o de golpe, con una línea opcional debajo;
 * y `Morph`, una pieza que se convierte en otra (posición, tamaño y opacidad).
 */
import { gsap } from "gsap";
import type { SceneCtx } from "../scene/context";
import { AFTER, documented, piece, within } from "./base";

export interface LogoRevealOptions {
	logo: "scene" | "closing" | "light";
	mode: "assemble" | "mask" | "pop";
	at: number;
	line?: string;
	x?: number;
	y?: number;
	/** El ancho máximo en `u`. */
	width?: number;
}

function logoSrc(ctx: SceneCtx, which: LogoRevealOptions["logo"]): string | null {
	const b = ctx.doc.brand;
	const wanted = which === "scene" ? b.sceneLogo : which === "closing" ? b.closingLogo : b.lightLogo;
	return wanted ?? b.sceneLogo ?? b.closingLogo ?? b.lightLogo ?? null;
}

function logoReveal(ctx: SceneCtx, o: LogoRevealOptions): { el: HTMLElement } {
	const { tl, u } = ctx;
	const doc = ctx.el.ownerDocument;
	const el = piece(ctx, "kit-logo", { x: o.x, y: o.y });
	Object.assign(el.style, { display: "flex", flexDirection: "column", alignItems: "center", gap: `${2 * u}px` });
	const src = logoSrc(ctx, o.logo);
	const mark = doc.createElement("div");
	mark.className = "kit-logo-mark";
	if (src) {
		const img = doc.createElement("img");
		img.src = src;
		img.alt = "";
		Object.assign(img.style, { display: "block", maxWidth: `${(o.width ?? 46) * u}px`, maxHeight: `${22 * u}px`, objectFit: "contain" });
		mark.appendChild(img);
	}
	el.appendChild(mark);
	const at = within(ctx, o.at);
	if (o.mode === "mask") {
		gsap.set(mark, { clipPath: "inset(0% 100% 0% 0%)" });
		tl.fromTo(mark, { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.7, ease: "power3.inOut", ...AFTER }, at);
	} else if (o.mode === "pop") {
		gsap.set(mark, { opacity: 0, scale: 0.4 });
		tl.fromTo(mark, { opacity: 0, scale: 0.4 }, { opacity: 1, scale: 1, duration: 0.5, ease: "back.out(2)", ...AFTER }, at);
	} else {
		gsap.set(mark, { opacity: 0, scale: 0.7, rotate: -6, filter: "blur(16px)" });
		tl.fromTo(mark, { opacity: 0, scale: 0.7, rotate: -6, filter: "blur(16px)" }, { opacity: 1, scale: 1, rotate: 0, filter: "blur(0px)", duration: 0.7, ease: "expo.out", ...AFTER }, at);
	}
	ctx.event("logo", within(ctx, at + 0.35));
	if (o.line) {
		const line = doc.createElement("div");
		line.className = "kit-logo-line";
		line.textContent = o.line;
		Object.assign(line.style, { fontSize: `${4 * u}px`, fontFamily: ctx.font(ctx.doc.brand.secondary.family), color: ctx.ink, textAlign: "center", whiteSpace: "nowrap" });
		el.appendChild(line);
		gsap.set(line, { opacity: 0, y: u });
		tl.fromTo(line, { opacity: 0, y: u }, { opacity: 1, y: 0, duration: 0.5, ease: "power2.out", ...AFTER }, within(ctx, at + 0.45));
	}
	return { el };
}

export const LogoReveal = documented(logoReveal, {
	name: "LogoReveal",
	signature: "kit.LogoReveal(ctx, { logo, mode, at, line?, x?, y?, width? }) → { el }",
	options: "The brand logo from the kit. logo: 'scene' | 'closing' | 'light' (use 'light' on light backgrounds; falls back to another logo if missing). mode: 'assemble' (blur and rotate in) | 'mask' (wipes in) | 'pop'. line: a short line under it (use ctx.text). Emits 'logo'.",
	example: 'kit.LogoReveal(ctx, { logo: "closing", mode: "assemble", at: ctx.beat(0), line: ctx.text("tagline") });',
});

export interface MorphOptions {
	from: HTMLElement;
	to: HTMLElement;
	at: number;
	/** En segundos; por defecto 0.6. */
	duration?: number;
}

function morph(ctx: SceneCtx, o: MorphOptions): void {
	const { tl } = ctx;
	const at = within(ctx, o.at);
	const duration = o.duration ?? 0.6;
	gsap.set(o.from, { opacity: 1 });
	gsap.set(o.to, { opacity: 0 });
	tl.fromTo(o.from, { opacity: 1 }, { opacity: 0, duration, ease: "power2.inOut", ...AFTER }, at);
	tl.fromTo(o.to, { opacity: 0 }, { opacity: 1, duration, ease: "power2.inOut", ...AFTER }, at);
	// Con las letras y las imágenes ya puestas: la pieza nueva sale de la caja de la vieja (FLIP).
	// Medidas donde están las dos piezas en su segundo y en píxeles del cuadro: iguales en la vista previa y en el MP4.
	ctx.onReady(() => {
		const a = ctx.rectAt(o.from, at);
		const b = ctx.rectAt(o.to, at);
		if (!(a.w > 0 && b.w > 0 && a.h > 0 && b.h > 0)) return;
		const dx = a.x + a.w / 2 - (b.x + b.w / 2);
		const dy = a.y + a.h / 2 - (b.y + b.h / 2);
		const sx = a.w / b.w;
		const sy = a.h / b.h;
		tl.fromTo(o.to, { x: dx, y: dy, scaleX: sx, scaleY: sy }, { x: 0, y: 0, scaleX: 1, scaleY: 1, duration, ease: "expo.inOut", ...AFTER }, at);
		tl.fromTo(o.from, { x: 0, y: 0, scaleX: 1, scaleY: 1 }, { x: -dx, y: -dy, scaleX: 1 / sx, scaleY: 1 / sy, duration, ease: "expo.inOut", ...AFTER }, at);
	});
}

export const Morph = documented(morph, {
	name: "Morph",
	signature: "kit.Morph(ctx, { from, to, at, duration? })",
	options: "One piece turns into another: 'to' grows out of the box of 'from' while they cross-fade. Both must already be in the scene. duration in seconds (0.6).",
	example: "kit.Morph(ctx, { from: card.el, to: phone.el, at: ctx.beat(4) });",
});
