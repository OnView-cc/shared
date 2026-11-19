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
