/** Iris, la IA de OnView (antes Lumen): su nombre y su símbolo en Feed vertical, un punto blanco con halo. */
import { describe, expect, it } from "vitest";
import { AI_MARK, AI_NAME, aiMarkSvg } from "./ai-mark";

describe("Iris", () => {
	it("is called Iris in every language", () => {
		expect(AI_NAME).toBe("Iris");
	});

	it("draws a solid dot inside a faint halo ring", () => {
		const svg = aiMarkSvg("night");
		expect(svg).toMatch(new RegExp(`<circle [^>]*r="${AI_MARK.dot.r}"[^>]*fill="#f4f4f2"`));
		const ring = svg.match(/<circle [^>]*fill="none"[^>]*opacity="([\d.]+)"/);
		expect(ring).not.toBeNull();
		expect(Number(ring![1])).toBeLessThan(1);
		expect(AI_MARK.halo.r).toBeGreaterThan(AI_MARK.dot.r);
	});

	it("is white on the ground and black on paper, never amber", () => {
		expect(aiMarkSvg("paper")).toContain("#0a0a0b");
		for (const tone of ["night", "paper"] as const) expect(aiMarkSvg(tone)).not.toMatch(/f2a33a|d98a22/i);
	});

	it("is a square standalone svg at the size asked", () => {
		const svg = aiMarkSvg("night", 48);
		expect(svg).toContain('width="48" height="48"');
		expect(svg).toContain(`viewBox="${AI_MARK.viewBox}"`);
		expect(svg).not.toMatch(/<text/);
	});
});
