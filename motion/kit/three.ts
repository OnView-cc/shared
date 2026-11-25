/**
 * Las piezas en 3D de la caja (spec 2026-11-24 §6.3), con CSS 3D y sin WebGL:
 * `Box3D`, una caja con caras de color o imagen y el logo al frente (la caja de
 * Daxuz), que cae, gira y flota; y `Card3D`, una tarjeta inclinada con brillo
 * que barre.
 */
import { gsap } from "gsap";
import type { SceneCtx } from "../scene/context";
import { AFTER, documented, offsetFrom, rgba, stage3d, within, type From } from "./base";

type Face = string | number;

export interface Box3DOptions {
	size: number;
	faces: { front?: Face; side?: Face; top?: Face; color?: string };
	logo?: "scene" | "light";
	x?: number;
	y?: number;
}

/** Un color más oscuro, para las caras de lado. */
function shade(hex: string, k: number): string {
	const m = /^#?([0-9a-f]{6})$/i.exec(hex);
	if (!m) return hex;
	const n = parseInt(m[1]!, 16);
	const c = (v: number) => Math.round(v * k).toString(16).padStart(2, "0");
	return `#${c((n >> 16) & 255)}${c((n >> 8) & 255)}${c(n & 255)}`;
}

function paint(ctx: SceneCtx, el: HTMLElement, face: Face | undefined, color: string): void {
	const image = face != null && (typeof face === "number" || !face.startsWith("#")) ? ctx.image(face) : null;
	if (image) {
		el.style.backgroundImage = `url("${image.src}")`;
		el.style.backgroundSize = "cover";
		el.style.backgroundPosition = "center";
	} else el.style.background = typeof face === "string" && face.startsWith("#") ? face : color;
}

function box3D(ctx: SceneCtx, o: Box3DOptions) {
	const { tl, u } = ctx;
	const doc = ctx.el.ownerDocument;
	const S = o.size * u;
	const wrap = stage3d(ctx, "kit-box-wrap", { x: o.x, y: o.y });
	const cube = doc.createElement("div");
	cube.className = "kit-box";
	Object.assign(cube.style, { position: "relative", width: `${S}px`, height: `${S}px`, transformStyle: "preserve-3d" });
	wrap.appendChild(cube);
	const base = o.faces.color ?? ctx.doc.brand.accent;
	const faces: [string, string, Face | undefined, string][] = [
		["front", `translateZ(${S / 2}px)`, o.faces.front, base],
		["back", `rotateY(180deg) translateZ(${S / 2}px)`, o.faces.side, shade(base, 0.7)],
		["right", `rotateY(90deg) translateZ(${S / 2}px)`, o.faces.side, shade(base, 0.78)],
		["left", `rotateY(-90deg) translateZ(${S / 2}px)`, o.faces.side, shade(base, 0.78)],
		["top", `rotateX(90deg) translateZ(${S / 2}px)`, o.faces.top, base],
		["bottom", `rotateX(-90deg) translateZ(${S / 2}px)`, o.faces.top, shade(base, 0.6)],
	];
	for (const [name, transform, face, color] of faces) {
		const f = doc.createElement("div");
		f.className = `kit-box-face ${name}`;
		Object.assign(f.style, { position: "absolute", inset: "0", transform, backfaceVisibility: "hidden", boxShadow: `inset 0 0 ${S * 0.12}px ${rgba("#000000", 0.18)}`, display: "grid", placeItems: "center" });
		paint(ctx, f, face, color);
		if (name === "front" && o.logo) {
			const b = ctx.doc.brand;
			const src = o.logo === "light" ? (b.lightLogo ?? b.sceneLogo) : (b.sceneLogo ?? b.lightLogo);
			if (src) {
				const img = doc.createElement("img");
				img.src = src;
				img.alt = "";
				Object.assign(img.style, { maxWidth: "70%", maxHeight: "40%", objectFit: "contain" });
				f.appendChild(img);
			}
		}
		cube.appendChild(f);
	}
	let rotY = 32;
	gsap.set(cube, { rotationX: -18, rotationY: rotY });
	gsap.set(wrap, { x: 0, y: 0, opacity: 1 });

	return {
		el: wrap,
		enter({ from, at }: { from: From; at: number }) {
			const t = within(ctx, at);
			const off = offsetFrom(ctx, from);
			gsap.set(wrap, { x: off.x, y: off.y, scale: off.scale, opacity: from === "scale" ? 0 : 1 });
			tl.fromTo(wrap, { x: off.x, y: off.y, scale: off.scale, opacity: from === "scale" ? 0 : 1 }, { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.45, ease: from === "top" ? "power2.in" : "expo.out", ...AFTER }, t);
			gsap.set(cube, { rotationY: rotY - 120 });
			tl.fromTo(cube, { rotationY: rotY - 120 }, { rotationY: rotY, duration: 0.45, ease: "power2.out", ...AFTER }, t);
			ctx.event("land", t + 0.45);
		},
		spin({ turns, at, duration }: { turns: number; at: number; duration: number }) {
			const next = rotY + 360 * turns;
			tl.fromTo(cube, { rotationY: rotY }, { rotationY: next, duration: duration * ctx.beatSeconds, ease: "power2.inOut", ...AFTER }, within(ctx, at));
			rotY = next;
		},
		float({ at, until }: { at: number; until: number }) {
			const period = 2 * ctx.beatSeconds;
			for (let t = within(ctx, at); t + period <= Math.min(until, ctx.at + ctx.seconds) + 0.001; t += period) {
				tl.fromTo(cube, { y: 0 }, { y: -1.4 * u, duration: period / 2, ease: "sine.inOut", yoyo: true, repeat: 1, ...AFTER }, t);
			}
		},
	};
}

export const Box3D = documented(box3D, {
	name: "Box3D",
	signature: "kit.Box3D(ctx, { size, faces, logo?, x?, y? }) → { el, enter({ from, at }), spin({ turns, at, duration }), float({ at, until }) }",
	options: "A 3D box (CSS 3D). size in u. faces: { color? (default brand accent), front?, side?, top? } each a '#rrggbb' or a moment image key. logo: 'scene' | 'light' on the front face. enter emits 'land' when it lands (0.45 s after at). spin: turns, duration in beats. float: bobs every 2 beats until 'until' (absolute second).",
	example: 'const box = kit.Box3D(ctx, { size: 24, faces: {}, logo: "light" });\nbox.enter({ from: "top", at: ctx.beat(1) });\nbox.float({ at: ctx.beat(2), until: ctx.at + ctx.seconds });',
});

export interface Card3DOptions {
	image?: string | number;
	content?: HTMLElement;
	width: number;
	height: number;
	tilt?: { x: number; y: number };
	shine?: boolean;
	x?: number;
	y?: number;
}

function card3D(ctx: SceneCtx, o: Card3DOptions) {
	const { tl, u } = ctx;
	const doc = ctx.el.ownerDocument;
	const wrap = stage3d(ctx, "kit-card3d-wrap", { x: o.x, y: o.y });
	const card = doc.createElement("div");
	card.className = "kit-card3d";
	Object.assign(card.style, { position: "relative", width: `${o.width * u}px`, height: `${o.height * u}px`, borderRadius: `${2 * u}px`, overflow: "hidden", background: "#ffffff", boxShadow: `0 ${3 * u}px ${7 * u}px rgba(0, 0, 0, 0.3)` });
	wrap.appendChild(card);
	const image = o.image != null ? ctx.image(o.image) : null;
	if (image) {
		const img = doc.createElement("img");
		img.src = image.src;
		img.alt = "";
		Object.assign(img.style, { display: "block", width: "100%", height: "100%", objectFit: "cover" });
		card.appendChild(img);
	} else if (o.content) card.appendChild(o.content);
	let shineEl: HTMLElement | null = null;
	if (o.shine) {
		shineEl = doc.createElement("div");
		shineEl.className = "kit-card3d-shine";
		Object.assign(shineEl.style, { position: "absolute", inset: "0", background: "linear-gradient(105deg, rgba(255,255,255,0) 35%, rgba(255,255,255,0.45) 50%, rgba(255,255,255,0) 65%)", pointerEvents: "none" });
		card.appendChild(shineEl);
		gsap.set(shineEl, { xPercent: -120 });
	}
	let rot = { x: o.tilt?.x ?? 0, y: o.tilt?.y ?? 0 };
	gsap.set(card, { rotationX: rot.x, rotationY: rot.y });
	return {
		el: wrap,
		enter({ from, at }: { from: From; at: number }) {
			const t = within(ctx, at);
			const off = offsetFrom(ctx, from);
			gsap.set(wrap, { x: off.x, y: off.y, scale: off.scale, opacity: from === "scale" ? 0 : 1 });
			tl.fromTo(wrap, { x: off.x, y: off.y, scale: off.scale, opacity: from === "scale" ? 0 : 1 }, { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.8, ease: "expo.out", ...AFTER }, t);
			if (shineEl) tl.fromTo(shineEl, { xPercent: -120 }, { xPercent: 120, duration: 0.9, ease: "power2.inOut", ...AFTER }, t + 0.6);
			ctx.event("land", t + 0.6);
		},
		tilt({ x, y, at, duration = 2 }: { x: number; y: number; at: number; duration?: number }) {
			tl.fromTo(card, { rotationX: rot.x, rotationY: rot.y }, { rotationX: x, rotationY: y, duration: duration * ctx.beatSeconds, ease: "sine.inOut", ...AFTER }, within(ctx, at));
			rot = { x, y };
		},
		exit({ at, to = "fade" }: { at: number; to?: From | "fade" }) {
			const t = within(ctx, at);
			if (to === "fade") tl.fromTo(wrap, { opacity: 1 }, { opacity: 0, duration: 0.4, ease: "power2.in", ...AFTER }, t);
			else {
				const off = offsetFrom(ctx, to);
				tl.fromTo(wrap, { x: 0, y: 0 }, { x: off.x, y: off.y, duration: 0.6, ease: "expo.in", ...AFTER }, t);
			}
		},
	};
}

export const Card3D = documented(card3D, {
	name: "Card3D",
	signature: "kit.Card3D(ctx, { image?, content?, width, height, tilt?, shine?, x?, y? }) → { el, enter({ from, at }), tilt({ x, y, at, duration? }), exit({ at, to? }) }",
	options: "A tilted card with shadow (a product photo, a screen, a piece of UI). width, height in u. tilt in degrees. shine: a light sweep after it enters. enter emits 'land'. tilt duration in beats.",
	example: 'const card = kit.Card3D(ctx, { image: 0, width: 46, height: 34, tilt: { x: 10, y: -22 }, shine: true });\ncard.enter({ from: "right", at: ctx.beat(0) });',
});
