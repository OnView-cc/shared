/**
 * El fondo «sky» de los templates (spec 2026-11-18 §5, «Fondo común»): un
 * degradado claro con dos manchas de color desenfocadas, como el video de
 * Arcade y el prototipo aprobado. Las manchas toman colores del kit aclarados
 * hacia el blanco para que el fondo nunca compita con el texto.
 *
 * `skyInk` elige el color de las letras sobre ese fondo: el color de texto del
 * kit si se lee (contraste ≥ 4.5), si no el de cierre, si no una tinta oscura.
 * El color de texto del kit suele pensarse para ir sobre video (blanco) y sobre
 * un fondo claro desaparecería.
 */
import type { MotionBrand } from "../video/compose";
import type { BackgroundKind, Style } from "./styles";

export const SKY_BASE = "#eef2f8";
export const DARK_INK = "#16181d";
const WARM = "#f8c9a4";
const COOL = "#c8d8f0";

const rgb = (hex: string): [number, number, number] | null => {
	const m = /^#([0-9a-f]{6})$/i.exec(hex);
	if (!m) return null;
	const n = parseInt(m[1]!, 16);
	return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const luminance = (hex: string): number => {
	const c = rgb(hex);
	if (!c) return 1;
	const [r, g, b] = c.map((v) => {
		const s = v / 255;
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	}) as [number, number, number];
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

export const contrast = (a: string, b: string): number => {
	const [x, y] = [luminance(a), luminance(b)].sort((p, q) => q - p) as [number, number];
	return (x + 0.05) / (y + 0.05);
};

/** Un color llevado hacia el blanco: `amount` 0 = el color, 1 = blanco. */
export function tint(hex: string, amount: number): string {
	const c = rgb(hex);
	if (!c) return hex;
	return `#${c.map((v) => Math.round(v + (255 - v) * amount).toString(16).padStart(2, "0")).join("")}`;
}

/** Un color llevado hacia otro: `amount` 0 = `from`, 1 = `to`. Si alguno no es `#rrggbb`, devuelve `from`. */
export function mix(from: string, to: string, amount: number): string {
	const a = rgb(from);
	const b = rgb(to);
	if (!a || !b) return from;
	return `#${a.map((v, i) => Math.round(v + (b[i]! - v) * amount).toString(16).padStart(2, "0")).join("")}`;
}

export function skyInk(brand: Pick<MotionBrand, "textColor" | "closingColor">): string {
	if (contrast(brand.textColor, SKY_BASE) >= 4.5) return brand.textColor;
	if (contrast(brand.closingColor, SKY_BASE) >= 4.5) return brand.closingColor;
	return DARK_INK;
}

/** Los colores de las dos manchas: el acento y otro color del kit, aclarados; sin kit, los del prototipo. */
export function skyBlobs(brand: Pick<MotionBrand, "colors" | "accent">): { warm: string; cool: string } {
	const usable = brand.colors.filter((c) => rgb(c));
	if (usable.length === 0) return { warm: WARM, cool: COOL };
	const accent = rgb(brand.accent) ? brand.accent : usable[0]!;
	// Un blanco o un negro del kit no dan una mancha: se salta.
	const other = usable.find((c) => c.toLowerCase() !== accent.toLowerCase() && luminance(c) > 0.03 && luminance(c) < 0.85);
	return { warm: tint(accent, 0.55), cool: other ? tint(other, 0.7) : COOL };
}

/** Dibuja el fondo dentro del escenario. Quieto: no entra en la línea de tiempo. */
export function drawSky(stage: HTMLElement, brand: MotionBrand, u: number): HTMLElement {
	const bg = stage.ownerDocument.createElement("div");
	bg.className = "motion-bg";
	bg.style.background = "linear-gradient(180deg, #dfe7f3 0%, #eef2f8 45%, #f6f3ef 100%)";
	const { warm, cool } = skyBlobs(brand);
	const blob = (color: string, css: Partial<CSSStyleDeclaration>) => {
		const b = stage.ownerDocument.createElement("div");
		b.className = "motion-blob";
		Object.assign(b.style, css, { background: color, filter: `blur(${u * 9}px)` });
		bg.appendChild(b);
	};
	blob(cool, { width: "70%", height: "42%", right: "-22%", top: "-16%", opacity: "0.8" });
	blob(warm, { width: "62%", height: "30%", left: "-12%", top: "58%", opacity: "0.75" });
	stage.appendChild(bg);
	return bg;
}

/* ── Los fondos de los estilos (spec 2026-11-19-onview-estilos-y-referencias §5.2) ── */

/** Casi negro (`dark`) y blanco roto (`paper`). */
export const DARK_BASE = "#0d0f14";
export const PAPER_BASE = "#f4f1ea";

type Resolved = { kind: Exclude<BackgroundKind, "auto">; color: string };

const hex = (c: [number, number, number]) => `#${c.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("")}`;

/** La saturación HSL de un color (0..1). */
function saturation(color: string): number {
	const c = rgb(color);
	if (!c) return 0;
	const [r, g, b] = c.map((v) => v / 255) as [number, number, number];
	const max = Math.max(r, g, b);
	const min = Math.min(r, g, b);
	const l = (max + min) / 2;
	if (max === min) return 0;
	return l > 0.5 ? (max - min) / (2 - max - min) : (max - min) / (max + min);
}

/** Lleva un color hacia su versión más saturada: `amount` 0 = el color, 1 = la saturación entera con la misma luz. */
export function saturate(color: string, amount: number): string {
	const c = rgb(color);
	if (!c || amount <= 0) return color;
	const mean = (c[0] + c[1] + c[2]) / 3;
	const spread = Math.max(...c.map((v) => Math.abs(v - mean)));
	if (spread === 0) return color;
	// Separar cada canal de la media lo que quepa hasta 0 o 255, en proporción a `amount`.
	const room = Math.min(...c.map((v) => (v > mean ? (255 - mean) / (v - mean) : v < mean ? mean / (mean - v) : Infinity)));
	const k = 1 + (room - 1) * Math.min(1, amount);
	return hex(c.map((v) => mean + (v - mean) * k) as [number, number, number]);
}

/** El color de la marca para un fondo: el acento, o el primer color del kit. */
const brandColor = (brand: Pick<MotionBrand, "accent" | "colors">): string => (rgb(brand.accent) ? brand.accent : (brand.colors.find((c) => rgb(c)) ?? "#3b5bfd"));

/** Qué fondo es de verdad: `auto` elige oscuro o de marca; `photo` sin foto, oscuro. */
export function resolveBackground(bg: Style["background"], brand: Pick<MotionBrand, "accent" | "colors">, photo?: string | null): Resolved {
	const color = brandColor(brand);
	switch (bg.kind) {
		case "sky":
			return { kind: "sky", color: SKY_BASE };
		case "paper":
			return { kind: "paper", color: PAPER_BASE };
		case "dark":
			return { kind: "dark", color: DARK_BASE };
		case "photo":
			return photo ? { kind: "photo", color: DARK_BASE } : { kind: "dark", color: DARK_BASE };
		case "brand":
			return { kind: "brand", color: saturate(color, bg.saturate) };
		case "auto":
			return luminance(color) > 0.6 || saturation(color) < 0.25 ? { kind: "dark", color: DARK_BASE } : { kind: "brand", color: saturate(color, bg.saturate) };
	}
}

/**
 * El color de las letras sobre un fondo: sobre el cielo, el de siempre
 * (`skyInk`); sobre los demás, el de texto del kit si se lee, si no el de
 * cierre, si no blanco o casi negro, el que más se lea.
 */
export function inkOn(bg: Resolved, brand: Pick<MotionBrand, "textColor" | "closingColor">, min = 4.5): string {
	if (bg.kind === "sky") return skyInk(brand);
	for (const c of [brand.textColor, brand.closingColor]) if (rgb(c) && contrast(c, bg.color) >= min) return c;
	return contrast("#ffffff", bg.color) >= contrast(DARK_INK, bg.color) ? "#ffffff" : DARK_INK;
}

/** El gris de una luminancia (0..1). */
export function greyOf(lum: number): string {
	const l = Math.max(0, Math.min(1, lum));
	const s = l <= 0.0031308 ? l * 12.92 : 1.055 * l ** (1 / 2.4) - 0.055;
	const v = Math.round(s * 255);
	return hex([v, v, v]);
}

/** La opacidad del velo negro sobre una foto de esa luminancia para que el blanco se lea a `min`. */
export function photoScrim(photoLuminance: number, min = 4.5): number {
	const grey = greyOf(photoLuminance);
	for (let a = 0; a <= 1; a += 0.01) if (contrast("#ffffff", mix(grey, "#000000", a)) >= min) return Math.round(a * 100) / 100;
	return 1;
}

/**
 * Dibuja el fondo del estilo en el escenario. Quieto: lo que se mueve
 * (`background.motion: "drift"`) lo mueve la cámara (`camera.ts`) en la línea
 * de tiempo. `photo` toma la primera foto del video, ampliada y desenfocada,
 * con el velo del peor caso (una foto blanca).
 */
export function drawBackground(stage: HTMLElement, bg: Style["background"], brand: MotionBrand, u: number, photo?: string | null): Resolved & { layer: HTMLElement } {
	const resolved = resolveBackground(bg, brand, photo);
	if (resolved.kind === "sky") return { ...resolved, layer: drawSky(stage, brand, u) };
	const doc = stage.ownerDocument;
	const layer = doc.createElement("div");
	layer.className = "motion-bg";
	layer.dataset.background = resolved.kind;
	if (resolved.kind === "dark") {
		layer.style.background = `radial-gradient(ellipse 70% 55% at 72% 18%, ${mix(brandColor(brand), DARK_BASE, 0.82)} 0%, ${DARK_BASE} 70%), ${DARK_BASE}`;
	} else if (resolved.kind === "photo" && photo) {
		layer.style.background = DARK_BASE;
		const img = doc.createElement("img");
		img.alt = "";
		img.src = photo;
		Object.assign(img.style, { position: "absolute", inset: "0", width: "100%", height: "100%", objectFit: "cover", transform: "scale(1.15)", filter: `blur(${6 * u}px)` });
		const veil = doc.createElement("div");
		Object.assign(veil.style, { position: "absolute", inset: "0", background: "#000000", opacity: String(photoScrim(1)) });
		layer.append(img, veil);
	} else {
		layer.style.background = resolved.color;
	}
	stage.appendChild(layer);
	return { ...resolved, layer };
}
