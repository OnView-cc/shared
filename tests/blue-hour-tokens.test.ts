/**
 * El mundo Blue Hour en `styles/sky.css` (contrato de dirección del
 * subproyecto 2): la paleta fijada, una sola familia tipográfica, el suelo
 * oscuro y contraste AA en los pares que se leen.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../styles/sky.css", import.meta.url), "utf8");
const block = css.match(/\n\.sk \{([\s\S]*?)\n\}/)?.[1] ?? "";
const token = (name: string) => block.match(new RegExp(`--sk-${name}:\\s*([^;]+);`))?.[1].trim();

function luminance(hex: string): number {
	const n = hex.replace("#", "");
	const [r, g, b] = [0, 2, 4].map((i) => parseInt(n.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
	return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a: string, b: string): number {
	const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
	return (hi + 0.05) / (lo + 0.05);
}

describe("Blue Hour tokens", () => {
	it("carries the five colours the direction contract fixes", () => {
		expect(token("ground")).toBe("#0a1124");
		expect(token("sky-1")).toBe("#1d3a8a");
		expect(token("sky-2")).toBe("#5a6fc4");
		expect(token("accent")).toBe("#f2a33a");
		expect(token("ink")).toBe("#e9ecf5");
	});

	it("one corner for everything: the 2px film frame", () => {
		expect(token("radius")).toBe("2px");
	});

	it.each([
		["ink", "ground", 4.5],
		["ink", "surface", 4.5],
		["ink-2", "surface", 4.5],
		["ink-2", "ground", 4.5],
		["accent-ink", "accent", 4.5],
		["accent", "ground", 4.5],
		["accent", "surface", 4.5],
		["danger-fg", "surface", 4.5],
		["success-fg", "surface", 4.5],
		["ink-3", "ground", 3],
		["ink-3", "surface", 3],
	])("%s on %s reaches %s:1", (fg, bg, min) => {
		const a = token(fg as string);
		const b = token(bg as string);
		expect(a, `--sk-${fg}`).toMatch(/^#[0-9a-f]{6}$/i);
		expect(b, `--sk-${bg}`).toMatch(/^#[0-9a-f]{6}$/i);
		expect(contrast(a!, b!)).toBeGreaterThanOrEqual(min as number);
	});

	it("the page is dark, on the film-rebate ink", () => {
		expect(css).toMatch(/\.sk-page\s*\{[^}]*background:\s*#0a1124[^}]*color-scheme:\s*dark/);
	});

	it("one type family, Archivo, and nothing left of the inherited world's", () => {
		expect(token("font")).toMatch(/^"Archivo Variable"/);
		expect(css).not.toMatch(/Geist/);
		expect(css).not.toContain("#5b3fd9");
		expect(css).not.toContain("#f5f5fa");
	});
});
