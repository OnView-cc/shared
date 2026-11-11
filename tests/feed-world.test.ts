/**
 * El vocabulario del mundo Feed vertical en `styles/sky.css` (spec §3): el
 * vidrio sólo sobre un video, el foco como anillo blanco con separación, las
 * preferencias de movimiento y transparencia respetadas, sin sombras
 * decorativas y sin las piezas de Blue Hour.
 */
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const css = readFileSync(new URL("../styles/sky.css", import.meta.url), "utf8").replace(/\/\*[\s\S]*?\*\//g, "");

describe("Feed vertical world", () => {
	it("glass only over video", () => {
		const rules = [...css.matchAll(/([^{}]+)\{([^{}]*backdrop-filter:\s*blur[^{}]*)\}/g)].map((m) => m[1].trim());
		expect(rules.length).toBeGreaterThan(0);
		for (const sel of rules) expect(sel).toMatch(/over-video/);
	});

	it("focus is a white ring with a gap", () => {
		expect(css).toMatch(/\.sk :focus-visible \{[^}]*outline: 2px solid var\(--sk-ink\)[^}]*outline-offset: 2px/);
	});

	it("reduced transparency turns glass solid; reduced motion is honoured", () => {
		expect(css).toMatch(/@media \(prefers-reduced-transparency: reduce\)[\s\S]*--sk-glass: var\(--sk-glass-solid\)/);
		expect(css).toMatch(/@media \(prefers-reduced-motion: reduce\)/);
	});

	it("no decorative shadow on the ground", () => {
		expect(css).not.toMatch(/--sk-shadow-[123]/);
	});

	it("the only gradient is the scrim", () => {
		expect(css.match(/gradient\(/g)?.length).toBe(1);
		expect(css).toMatch(/--sk-scrim: linear-gradient\(180deg, transparent/);
	});

	it.each(["sk-strip", "sk-grease", "sk-sky", "sk-perf", "sk-strike", "sk-frame-unrevealed"])("%s is gone", (name) => {
		expect(css).not.toContain(`.${name}`);
	});
});
