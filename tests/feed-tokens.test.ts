/**
 * El mundo Feed vertical en `styles/sky.css` (subproyecto 8, spec
 * 2026-11-10-onview-feed-vertical-design §3): casi negro, tinta blanco roto,
 * la acción en blanco sin color de acento, Bricolage para lo grande y Hanken
 * Grotesk para la interfaz, un solo degradado (el scrim bajo el texto de un
 * video) y contraste AA en los pares que se leen.
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

describe("Feed vertical tokens", () => {
	it("fixes the ground, the inks and a white action with no accent colour", () => {
		expect(token("ground")).toBe("#0a0a0b");
		expect(token("ink")).toBe("#f4f4f2");
		expect(token("accent")).toBe("var(--sk-ink)");
		expect(token("accent-ink")).toBe("#0a0a0b");
	});

	it("frames at 16px, fields at 12px, round pills", () => {
		expect(token("radius-frame")).toBe("16px");
		expect(token("radius-field")).toBe("12px");
		expect(token("radius-pill")).toBe("999px");
		expect(token("radius")).toBe("var(--sk-radius-field)");
	});

	it.todo("the only gradient is the scrim");

	it("Bricolage for display, Hanken Grotesk for the interface, no Archivo", () => {
		expect(token("display")).toContain("Bricolage Grotesque Variable");
		expect(token("font")).toContain("Hanken Grotesk Variable");
		expect(css).not.toMatch(/Archivo/);
	});

	it("nothing of Blue Hour is left in the tokens", () => {
		for (const gone of ["sky-1", "sky-2", "horizon", "film", "perf", "ambient", "accent-gradient", "accent-glow", "glass-panel"]) expect(token(gone), gone).toBeUndefined();
		expect(css).not.toMatch(/#f2a33a|#0a1124/i);
	});

	it.each([
		["ink", "ground"],
		["ink", "surface"],
		["ink-2", "surface"],
		["ink-3", "surface"],
		["ink-3", "ground"],
		["accent-ink", "ink"],
		["danger-fg", "surface"],
	])("%s on %s reads at AA", (fg, bg) => {
		expect(contrast(token(fg)!, token(bg)!)).toBeGreaterThanOrEqual(4.5);
	});
});
