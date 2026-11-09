/** Lumen, la IA de OnView: su nombre y su símbolo, la primera ventana que se enciende a la hora azul. */
import { describe, expect, it } from "vitest";
import { AI_MARK, AI_NAME, aiMarkSvg } from "./ai-mark";

describe("Lumen", () => {
	it("is called Lumen in every language", () => {
		expect(AI_NAME).toBe("Lumen");
	});

	it("draws a lit amber window with its mullions in both tones", () => {
		for (const tone of ["night", "paper"] as const) {
			const svg = aiMarkSvg(tone);
			expect(svg).toContain(AI_MARK.window.fill[tone]);
			expect(svg.match(/<line /g)?.length).toBe(2);
		}
		expect(AI_MARK.window.fill.night).toBe("#f2a33a");
	});

	it("glows only at night", () => {
		expect(aiMarkSvg("night")).toContain("feGaussianBlur");
		expect(aiMarkSvg("paper")).not.toContain("feGaussianBlur");
	});

	it("is a square standalone svg at the size asked", () => {
		const svg = aiMarkSvg("night", 48);
		expect(svg).toContain('width="48" height="48"');
		expect(svg).toContain(`viewBox="${AI_MARK.viewBox}"`);
		expect(svg).not.toMatch(/<text/);
	});
});
