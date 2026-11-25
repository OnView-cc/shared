/**
 * Las colecciones de la caja (spec 2026-11-24 §6.3): `Grid`, una rejilla que
 * cae en cascada (los productos de Daxuz); `Carousel`, piezas que pasan una a
 * una (el sitio, el catálogo y las redes); y `Stack`, tarjetas que caen
 * apiladas. Cada elemento es la clave de una imagen del momento o una pieza
 * armada por la escena.
 */
import { gsap } from "gsap";
import type { SceneCtx } from "../scene/context";
import { AFTER, documented, piece, stageU, within } from "./base";

type Item = string | number | HTMLElement;

/** El contenido de una celda: la imagen (cubriendo) o la pieza. */
function fill(ctx: SceneCtx, cell: HTMLElement, item: Item): void {
	if (typeof item === "object") {
		cell.appendChild(item);
		return;
	}
	const image = ctx.image(item);
	if (!image) return;
	const img = ctx.el.ownerDocument.createElement("img");
	img.src = image.src;
	img.alt = "";
	Object.assign(img.style, { display: "block", width: "100%", height: "100%", objectFit: "cover" });
	cell.appendChild(img);
}

function card(ctx: SceneCtx, cls: string, w: number, h: number): HTMLElement {
	const el = ctx.el.ownerDocument.createElement("div");
	el.className = cls;
	Object.assign(el.style, { width: `${w * ctx.u}px`, height: `${h * ctx.u}px`, borderRadius: `${1.6 * ctx.u}px`, overflow: "hidden", background: "#ffffff", boxShadow: `0 ${1.2 * ctx.u}px ${3.5 * ctx.u}px rgba(0, 0, 0, 0.25)`, flex: "none" });
	return el;
}

export interface GridOptions {
	items: Item[];
	columns: number;
	/** En `u`. */
	gap?: number;
	enter?: "cascade" | "pop" | "rise";
	at: number;
	/** En golpes, entre una celda y la siguiente. */
	stagger?: number;
	/** El ancho de la rejilla en `u`; por defecto el 84 % del cuadro. */
	width?: number;
	/** El alto de cada celda / su ancho. */
	cellRatio?: number;
	x?: number;
	y?: number;
}

function grid(ctx: SceneCtx, o: GridOptions): { el: HTMLElement } {
	const { tl, u } = ctx;
	const columns = Math.max(1, Math.round(o.columns));
	const gap = o.gap ?? 2;
	const width = o.width ?? stageU(ctx).w * 0.84;
	const cellW = (width - gap * (columns - 1)) / columns;
	const cellH = cellW * (o.cellRatio ?? 1);
	const el = piece(ctx, "kit-grid", { x: o.x, y: o.y });
	Object.assign(el.style, { display: "grid", gridTemplateColumns: `repeat(${columns}, ${cellW * u}px)`, gap: `${gap * u}px` });
	const step = (o.stagger ?? 0.25) * ctx.beatSeconds;
	const enter = o.enter ?? "cascade";
	const from = enter === "pop" ? { opacity: 0, scale: 0.5, y: 0, rotate: 0 } : enter === "rise" ? { opacity: 0, scale: 1, y: 6 * u, rotate: 0 } : { opacity: 0, scale: 1, y: -5 * u, rotate: -4 };
	o.items.forEach((item, i) => {
		const cell = card(ctx, "kit-cell", cellW, cellH);
		fill(ctx, cell, item);
		el.appendChild(cell);
		const t = within(ctx, o.at + i * step);
		gsap.set(cell, from);
		tl.fromTo(cell, from, { opacity: 1, scale: 1, y: 0, rotate: 0, duration: 0.55, ease: enter === "pop" ? "back.out(1.8)" : "expo.out", ...AFTER }, t);
		if (i % columns === 0) ctx.event("land", within(ctx, t + 0.35));
	});
	return { el };
}

export const Grid = documented(grid, {
	name: "Grid",
	signature: "kit.Grid(ctx, { items, columns, gap?, enter?, at, stagger?, width?, cellRatio?, x?, y? }) → { el }",
	options: "A grid of cards. items: moment image keys or elements you built. columns: how many per row. gap and width in u. enter: 'cascade' (default, falls in) | 'pop' | 'rise'. stagger: beats between cells (0.25). cellRatio: height / width of a cell (1). Emits 'land' once per row.",
	example: "kit.Grid(ctx, { items: [0, 1, 2, 3, 4, 5], columns: 3, at: ctx.beat(1) });",
});

export interface CarouselOptions {
	items: Item[];
	/** En golpes, cuánto está cada pieza al centro. */
	every: number;
	at: number;
	style?: "slide" | "coverflow";
	/** El tamaño de cada pieza en `u`. */
	width?: number;
	height?: number;
	x?: number;
	y?: number;
}

function carousel(ctx: SceneCtx, o: CarouselOptions): { el: HTMLElement } {
	const { tl, u } = ctx;
	const s = stageU(ctx);
	const w = o.width ?? Math.min(s.w * 0.6, 70);
	const h = o.height ?? w * 0.62;
	const gap = w * 0.12;
	const el = piece(ctx, "kit-carousel", { x: o.x, y: o.y, width: w, height: h });
	el.style.overflow = "visible";
	const coverflow = o.style === "coverflow";
	const cards = o.items.map((item, i) => {
		const c = card(ctx, "kit-carousel-card", w, h);
		fill(ctx, c, item);
		Object.assign(c.style, { position: "absolute", left: "0", top: "0" });
		el.appendChild(c);
		gsap.set(c, { x: i * (w + gap) * u, scale: coverflow && i > 0 ? 0.82 : 1, opacity: i === 0 ? 1 : 0.55, rotationY: coverflow && i > 0 ? -28 : 0 });
		return c;
	});
	el.style.perspective = `${200 * u}px`;
	const stepS = o.every * ctx.beatSeconds;
	// La primera entra; después, un paso por cada pieza siguiente.
	gsap.set(el, { opacity: 0 });
	tl.fromTo(el, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: "power2.out", ...AFTER }, within(ctx, o.at));
	for (let k = 1; k < cards.length; k++) {
		const t = within(ctx, o.at + k * stepS);
		cards.forEach((c, i) => {
			const before = i - (k - 1);
			const after = i - k;
			const pose = (d: number) => ({ x: d * (w + gap) * u, scale: coverflow && d !== 0 ? 0.82 : 1, opacity: d === 0 ? 1 : 0.55, rotationY: coverflow ? (d > 0 ? -28 : d < 0 ? 28 : 0) : 0 });
			tl.fromTo(c, pose(before), { ...pose(after), duration: 0.6, ease: "expo.inOut", ...AFTER }, t);
		});
		ctx.event("swipe", t);
	}
	return { el };
}

export const Carousel = documented(carousel, {
	name: "Carousel",
	signature: "kit.Carousel(ctx, { items, every, at, style?, width?, height?, x?, y? }) → { el }",
	options: "Pieces that pass one by one through the centre (a website, a catalogue, social profiles). every: beats each one stays. style: 'slide' (default) | 'coverflow' (neighbours turned in 3D). width/height of each piece in u. Emits 'swipe' on every step.",
	example: 'kit.Carousel(ctx, { items: [0, 1, 2], every: 2, at: ctx.beat(1), style: "coverflow" });',
});

export interface StackOptions {
	items: Item[];
	at: number;
	/** Cuánto se separan y giran, en `u` y grados por tarjeta. */
	spread?: number;
	width?: number;
	height?: number;
	x?: number;
	y?: number;
}

function stack(ctx: SceneCtx, o: StackOptions): { el: HTMLElement } {
	const { tl, u } = ctx;
	const w = o.width ?? 40;
	const h = o.height ?? w * 1.2;
	const spread = o.spread ?? 3;
	const el = piece(ctx, "kit-stack", { x: o.x, y: o.y, width: w, height: h });
	const rnd = ctx.random(o.items.length * 31 + 7);
	o.items.forEach((item, i) => {
		const c = card(ctx, "kit-stack-card", w, h);
		fill(ctx, c, item);
		Object.assign(c.style, { position: "absolute", left: "0", top: "0" });
		el.appendChild(c);
		const rest = { x: (i - (o.items.length - 1) / 2) * spread * u, y: -i * 0.6 * u, rotate: Math.round((rnd() - 0.5) * 2 * spread * 100) / 100, opacity: 1, scale: 1 };
		const from = { ...rest, y: rest.y - 30 * u, opacity: 0, scale: 1.08 };
		gsap.set(c, from);
		const t = within(ctx, o.at + i * 0.5 * ctx.beatSeconds);
		tl.fromTo(c, from, { ...rest, duration: 0.5, ease: "power3.out", ...AFTER }, t);
		ctx.event("land", within(ctx, t + 0.4));
	});
	return { el };
}

export const Stack = documented(stack, {
	name: "Stack",
	signature: "kit.Stack(ctx, { items, at, spread?, width?, height?, x?, y? }) → { el }",
	options: "Cards that drop one on top of another, half a beat apart, slightly turned. spread: offset in u and degrees per card (3). Emits 'land' for each card.",
	example: "kit.Stack(ctx, { items: [0, 1, 2], at: ctx.beat(0) });",
});
