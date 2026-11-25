/**
 * Los dispositivos de la caja (spec 2026-11-24 §6.3): teléfono, tableta,
 * laptop y navegador, dibujados con CSS (sin imágenes de marcas de
 * dispositivos). En la pantalla va una captura del material (`image`) o una
 * pieza armada por la escena (`content`).
 *
 * La geometría se calcula de las opciones, no del DOM: `point()` da el punto
 * de la pantalla en `u` del escenario aunque el navegador todavía no haya
 * medido nada (así el cursor sabe adónde ir al construir la escena).
 */
import { gsap } from "gsap";
import type { SceneCtx } from "../scene/context";
import { AFTER, documented, offsetFrom, stage3d, stageU, within, type From } from "./base";

export type DeviceKind = "phone" | "tablet" | "laptop" | "browser";

export interface DeviceOptions {
	kind: DeviceKind;
	/** La clave (id o índice) de una imagen del momento. */
	image?: string | number;
	content?: HTMLElement;
	url?: string;
	x?: number;
	y?: number;
	/** El ancho del marco en `u`. */
	width?: number;
	tilt?: { x: number; y: number };
}

/** Proporciones de cada dispositivo: alto del marco / ancho, marco, radio, barra de arriba (fracciones del ancho). */
const SHAPE: Record<DeviceKind, { ratio: number; bezel: number; radius: number; screenRadius: number; bar: number }> = {
	phone: { ratio: 2.05, bezel: 0.035, radius: 0.16, screenRadius: 0.125, bar: 0 },
	tablet: { ratio: 1.38, bezel: 0.03, radius: 0.06, screenRadius: 0.035, bar: 0 },
	laptop: { ratio: 0.64, bezel: 0.025, radius: 0.025, screenRadius: 0.006, bar: 0 },
	browser: { ratio: 0.66, bezel: 0, radius: 0.016, screenRadius: 0, bar: 0.045 },
};

function defaultWidth(kind: DeviceKind, portrait: boolean): number {
	if (kind === "phone") return portrait ? 40 : 26;
	if (kind === "tablet") return portrait ? 62 : 50;
	return portrait ? 88 : 80;
}

export interface DeviceHandle {
	el: HTMLElement;
	screen: HTMLElement;
	enter(o: { from: From; at: number }): void;
	tilt(o: { x: number; y: number; at: number; duration?: number }): void;
	scroll(o: { to: number; at: number; duration?: number }): void;
	zoom(o: { x: number; y: number; scale: number; at: number }): void;
	point(xy: { x: number; y: number }): { x: number; y: number };
	exit(o: { at: number; to?: From | "fade" }): void;
}

function device(ctx: SceneCtx, o: DeviceOptions): DeviceHandle {
	const { tl, u } = ctx;
	const doc = ctx.el.ownerDocument;
	const s = stageU(ctx);
	const shape = SHAPE[o.kind];
	const W = o.width ?? defaultWidth(o.kind, ctx.orientation === "portrait");
	const H = W * shape.ratio;
	const cx = o.x ?? s.w / 2;
	const cy = o.y ?? s.h / 2;
	const bezel = W * shape.bezel;
	const bar = W * shape.bar;
	// La pantalla, en `u`, respecto a la esquina del marco.
	const screenBox = { left: bezel, top: bezel + bar, w: W - 2 * bezel, h: H - 2 * bezel - bar };

	const wrap = stage3d(ctx, `kit-device-wrap kit-${o.kind}`, { x: cx, y: cy });
	const frame = doc.createElement("div");
	frame.className = "kit-device";
	Object.assign(frame.style, {
		position: "relative",
		width: `${W * u}px`,
		height: `${H * u}px`,
		borderRadius: `${W * shape.radius * u}px`,
		background: o.kind === "browser" ? "#f4f5f7" : "#0c0d10",
		boxShadow: `0 ${3 * u}px ${8 * u}px rgba(0, 0, 0, 0.35), inset 0 0 0 ${0.25 * u}px rgba(255, 255, 255, 0.12)`,
		transformStyle: "preserve-3d",
	});
	wrap.appendChild(frame);

	if (o.kind === "browser") {
		const top = doc.createElement("div");
		top.className = "kit-device-bar";
		Object.assign(top.style, { position: "absolute", left: "0", right: "0", top: "0", height: `${bar * u}px`, display: "flex", alignItems: "center", gap: `${0.8 * u}px`, padding: `0 ${1.6 * u}px`, boxSizing: "border-box" });
		for (const c of ["#ff5f57", "#febc2e", "#28c840"]) {
			const dot = doc.createElement("span");
			Object.assign(dot.style, { width: `${1 * u}px`, height: `${1 * u}px`, borderRadius: "50%", background: c, flex: "none" });
			top.appendChild(dot);
		}
		const address = doc.createElement("span");
		address.className = "kit-device-url";
		address.textContent = o.url ?? "";
		Object.assign(address.style, { marginLeft: `${2 * u}px`, flex: "1", height: `${bar * 0.62 * u}px`, borderRadius: `${bar * 0.31 * u}px`, background: "#e6e8ec", color: "#5b616b", fontSize: `${bar * 0.36 * u}px`, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: ctx.font(ctx.doc.brand.secondary.family), whiteSpace: "nowrap", overflow: "hidden" });
		top.appendChild(address);
		frame.appendChild(top);
	}

	const screen = doc.createElement("div");
	screen.className = "kit-device-screen";
	Object.assign(screen.style, {
		position: "absolute",
		left: `${screenBox.left * u}px`,
		top: `${screenBox.top * u}px`,
		width: `${screenBox.w * u}px`,
		height: `${screenBox.h * u}px`,
		borderRadius: `${W * shape.screenRadius * u}px`,
		overflow: "hidden",
		background: "#ffffff",
	});
	frame.appendChild(screen);
	const view = doc.createElement("div");
	view.className = "kit-device-view";
	Object.assign(view.style, { position: "absolute", left: "0", top: "0", width: "100%" });
	screen.appendChild(view);

	// Cuánto se puede desplazar el contenido, en `u` (una captura más alta que la pantalla).
	let scrollRange = 0;
	const image = o.image != null ? ctx.image(o.image) : null;
	if (image) {
		const img = doc.createElement("img");
		img.src = image.src;
		img.alt = "";
		const shownH = image.width > 0 ? screenBox.w * (image.height / image.width) : screenBox.h;
		if (shownH > screenBox.h) {
			Object.assign(img.style, { display: "block", width: "100%", height: "auto" });
			scrollRange = shownH - screenBox.h;
		} else Object.assign(img.style, { display: "block", width: "100%", height: `${screenBox.h * u}px`, objectFit: "cover", objectPosition: "top center" });
		view.appendChild(img);
	} else if (o.content) {
		view.style.height = "100%";
		view.appendChild(o.content);
	}

	if (o.kind === "phone") {
		const island = doc.createElement("div");
		island.className = "kit-device-island";
		Object.assign(island.style, { position: "absolute", left: "50%", top: `${(bezel + W * 0.03) * u}px`, width: `${W * 0.28 * u}px`, height: `${W * 0.075 * u}px`, transform: "translateX(-50%)", borderRadius: `${W * 0.04 * u}px`, background: "#0c0d10" });
		frame.appendChild(island);
	}
	if (o.kind === "laptop") {
		const base = doc.createElement("div");
		base.className = "kit-device-base";
		Object.assign(base.style, { position: "absolute", left: "-7%", width: "114%", top: "100%", height: `${W * 0.035 * u}px`, borderRadius: `0 0 ${W * 0.03 * u}px ${W * 0.03 * u}px`, background: "linear-gradient(#c9ccd2, #9a9ea6)" });
		frame.appendChild(base);
	}

	let rot = { x: o.tilt?.x ?? 0, y: o.tilt?.y ?? 0 };
	gsap.set(frame, { rotationX: rot.x, rotationY: rot.y });
	gsap.set(view, { y: 0, scale: 1 });
	let scrolled = 0;

	return {
		el: wrap,
		screen,
		enter({ from, at }) {
			const t = within(ctx, at);
			const off = offsetFrom(ctx, from);
			gsap.set(wrap, { x: off.x, y: off.y, scale: off.scale, opacity: from === "scale" ? 0 : 1 });
			tl.fromTo(wrap, { x: off.x, y: off.y, scale: off.scale, opacity: from === "scale" ? 0 : 1 }, { x: 0, y: 0, scale: 1, opacity: 1, duration: 0.9, ease: "expo.out", ...AFTER }, t);
			ctx.event("whoosh", t);
		},
		tilt({ x, y, at, duration = 2 }) {
			tl.fromTo(frame, { rotationX: rot.x, rotationY: rot.y }, { rotationX: x, rotationY: y, duration: duration * ctx.beatSeconds, ease: "sine.inOut", ...AFTER }, within(ctx, at));
			rot = { x, y };
		},
		scroll({ to, at, duration = 3 }) {
			const target = -Math.min(1, Math.max(0, to)) * scrollRange * u;
			tl.fromTo(view, { y: scrolled }, { y: target, duration: duration * ctx.beatSeconds, ease: "power2.inOut", ...AFTER }, within(ctx, at));
			scrolled = target;
		},
		zoom({ x, y, scale, at }) {
			view.style.transformOrigin = `${x * 100}% ${y * 100}%`;
			tl.fromTo(view, { scale: 1 }, { scale, duration: 2 * ctx.beatSeconds, ease: "power2.inOut", ...AFTER }, within(ctx, at));
		},
		point(xy) {
			return { x: cx - W / 2 + screenBox.left + xy.x * screenBox.w, y: cy - H / 2 + screenBox.top + xy.y * screenBox.h };
		},
		exit({ at, to = "fade" }) {
			const t = within(ctx, at);
			if (to === "fade") tl.fromTo(wrap, { opacity: 1, scale: 1 }, { opacity: 0, scale: 0.92, duration: 0.45, ease: "power2.in", ...AFTER }, t);
			else {
				const off = offsetFrom(ctx, to);
				tl.fromTo(wrap, { x: 0, y: 0 }, { x: off.x, y: off.y, duration: 0.6, ease: "expo.in", ...AFTER }, t);
			}
		},
	};
}

export const Device = documented(device, {
	name: "Device",
	signature: "kit.Device(ctx, { kind, image?, content?, url?, x?, y?, width?, tilt? }) → { el, screen, enter, tilt, scroll, zoom, point, exit }",
	options:
		"kind: 'phone' | 'tablet' | 'laptop' | 'browser' (drawn in CSS, no device brands). image: key of a moment image (a screenshot) shown in the screen; a taller screenshot can scroll. content: an element you built to show inside the screen. url: the browser address bar text. x, y: centre in u. width: frame width in u. tilt: starting 3D tilt in degrees. enter({ from: 'left'|'right'|'top'|'bottom'|'scale', at }) emits 'whoosh'. tilt({ x, y, at, duration? }) duration in beats. scroll({ to: 0..1, at, duration? }). zoom({ x, y: 0..1 of the screen, scale, at }). point({ x, y: 0..1 of the screen }) → a stage point in u, for the cursor. exit({ at, to? }).",
	example: 'const phone = kit.Device(ctx, { kind: "phone", image: 0, tilt: { x: 6, y: -18 } });\nphone.enter({ from: "bottom", at: ctx.beat(0) });\nphone.tilt({ x: 0, y: 0, at: ctx.beat(2) });',
});
