/**
 * El mundo Ventana en `styles/ventana/` (vidrio ahumado estilo Liquid Glass):
 * suelo casi negro, tinta blanco roto, acción blanca sin acento, y un vidrio
 * oscuro cuya tinta se lee incluso con blanco puro detrás. Cada vidrio trae su
 * sólido de respaldo.
 */
import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (rel: string) => readFileSync(new URL(rel, import.meta.url), "utf8");
const tokens = read("../styles/ventana/tokens.css");
const glass = read("../styles/ventana/glass.css");
const all = tokens + glass + read("../styles/ventana.css");
const allVentanaCss = [
	...readdirSync(new URL("../styles/ventana/", import.meta.url))
		.filter((f) => f.endsWith(".css"))
		.map((f) => read(`../styles/ventana/${f}`)),
	read("../styles/ventana.css"),
];

const block = tokens.match(/\n\.vn \{([\s\S]*?)\n\}/)?.[1] ?? "";
const token = (name: string) => block.match(new RegExp(`--vn-${name}:\\s*([^;]+);`))?.[1].trim();

function channels(color: string): [number, number, number, number] {
	const rgba = color.match(/rgba?\(([^)]+)\)/);
	if (rgba) {
		const [r, g, b, a = "1"] = rgba[1].split(",").map((s) => s.trim());
		return [Number(r), Number(g), Number(b), Number(a)];
	}
	const n = color.replace("#", "");
	const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16));
	return [r, g, b, 1];
}
function luminance(hex: string): number {
	const [r, g, b] = channels(hex).slice(0, 3).map((c) => c / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}
/** Compone `top` (rgba o hex) sobre `bottom` (hex) y devuelve hex. */
function over(top: string, bottom: string): string {
	const [tr, tg, tb, ta] = channels(top);
	const [br, bg, bb] = channels(bottom);
	return "#" + [tr * ta + br * (1 - ta), tg * ta + bg * (1 - ta), tb * ta + bb * (1 - ta)].map((c) => Math.round(c).toString(16).padStart(2, "0")).join("");
}

describe("Ventana tokens", () => {
	it("fija el suelo, las tintas y una acción blanca sin acento", () => {
		expect(token("ground")).toBe("#060607");
		expect(token("ink")).toBe("#f5f5f7");
		expect(token("action")).toBe("var(--vn-ink)");
	});

	it.each([
		["thin", "ink", 4.5],
		["thick", "ink", 4.5],
		["thick", "ink-2-glass", 4.5],
		["clear", "ink", 3],
	])("sobre blanco puro, %s deja leer %s a %s:1", (grade, ink, min) => {
		const behind = over(token("sheen")!, over(token(`smoke-${grade}`)!, "#ffffff"));
		expect(contrast(token(ink)!, behind)).toBeGreaterThanOrEqual(min);
	});

	it.each([
		["ink", "ground"],
		["ink", "surface"],
		["ink", "raised"],
		["ink-2", "ground"],
		["ink-2", "surface"],
		["ink-2", "raised"],
		["ink", "solid-thin"],
		["ink", "solid-thick"],
		["ink-2-glass", "solid-thick"],
	])("%s sobre %s pasa AA", (a, b) => {
		expect(contrast(token(a)!, token(b)!)).toBeGreaterThanOrEqual(4.5);
	});

	it("la tinta 3 no llega a AA: no es para texto", () => {
		expect(contrast(token("ink-3")!, token("ground")!)).toBeLessThan(4.5);
	});

	it("la fuente empieza por la del sistema de Apple y no sirve SF ni pasa por system-ui", () => {
		expect(token("font")).toMatch(/^-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Inter Tight Variable", sans-serif$/);
		expect(all).not.toMatch(/@font-face/);
	});

	it("cada vidrio tiene su sólido con transparencia reducida, contraste alto y sin backdrop-filter", () => {
		expect(glass).toMatch(/@media \(prefers-reduced-transparency: reduce\)/);
		expect(glass).toMatch(/@media \(prefers-contrast: more\)/);
		expect(glass).toMatch(/@supports not \(\(backdrop-filter: blur\(1px\)\) or \(-webkit-backdrop-filter: blur\(1px\)\)\)/);
	});

	it("el desenfoque baja a 12px en táctil y en estrecho", () => {
		expect(tokens).toMatch(/@media \(pointer: coarse\), \(max-width: 47\.9rem\)[\s\S]*--vn-blur-thin: 12px;[\s\S]*--vn-blur-thick: 12px;/);
	});

	it("no toca Feed vertical", () => {
		for (const file of allVentanaCss) {
			expect(file).not.toMatch(/--sk-/);
			expect(file).not.toMatch(/\.sk[\s.{,]/);
		}
	});
});
