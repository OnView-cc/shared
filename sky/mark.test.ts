/** La marca de Blue Hour: un fotograma rodeado por el círculo abierto del lápiz graso ámbar. */
import { describe, expect, it } from "vitest";
import { MARK, MARK_COLORS, markSvg } from "./mark";

describe("markSvg", () => {
	it("draws the grease circle in amber over the paper-coloured frame at night", () => {
		const svg = markSvg("night");
		expect(svg).toContain("#f2a33a");
		expect(svg).toContain(MARK_COLORS.night.frame);
		expect(MARK_COLORS.night.frame).toBe("#e9ecf5");
	});

	it("on paper the frame is the film-rebate ink", () => {
		expect(MARK_COLORS.paper.frame).toBe("#0a1124");
		expect(markSvg("paper")).toContain("#0a1124");
	});

	it("the circle is one hand-drawn open stroke, never a geometric circle", () => {
		const svg = markSvg("night");
		expect(svg).not.toMatch(/<circle|<ellipse/);
		expect(svg).toMatch(/<path d="M[^"]+" fill="none" stroke="#f2a33a" stroke-width="[\d.]+" stroke-linecap="round" stroke-linejoin="round"\/>/);
		// abierto: el trazo no vuelve a su punto de partida
		const [start] = MARK.grease.d.match(/^M\s*[\d.]+\s+[\d.]+/)!;
		expect(MARK.grease.d.trim().endsWith(start.slice(1).trim())).toBe(false);
	});

	it("the frame is a 4:3 film frame with the 2px corner of the world", () => {
		const { w, h, rx } = MARK.frame;
		expect(w / h).toBeCloseTo(4 / 3, 2);
		expect(rx).toBeLessThanOrEqual(1.5);
	});

	it("is a square standalone svg at the size it is asked for, with no text inside", () => {
		const svg = markSvg("night", 64);
		expect(svg.startsWith("<svg")).toBe(true);
		expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
		expect(svg).toContain('width="64" height="64"');
		const [, , w, h] = MARK.viewBox.split(" ").map(Number);
		expect(w).toBe(h);
		expect(svg).not.toMatch(/<text/);
	});
});
