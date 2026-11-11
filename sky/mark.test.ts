/** La marca del mundo Feed vertical: un marco 9:16 redondeado con el rótulo macizo en su tercio bajo. */
import { describe, expect, it } from "vitest";
import { MARK, MARK_COLORS, markSvg } from "./mark";

describe("markSvg", () => {
	it("is a rounded vertical 9:16 frame", () => {
		const { w, h, rx } = MARK.frame;
		expect(w / h).toBeCloseTo(0.5625, 2);
		expect(rx).toBeGreaterThan(1.5);
		expect(markSvg("night")).toMatch(/<rect [^>]*rx="[\d.]+"[^>]*fill="none"/);
	});

	it("carries a solid caption bar in the lower third of the frame", () => {
		const { frame: f, caption: c } = MARK;
		expect(c.y).toBeGreaterThan(f.y + (f.h * 2) / 3 - 1);
		expect(c.y + c.h).toBeLessThan(f.y + f.h);
		expect(c.x).toBeGreaterThan(f.x);
		expect(markSvg("night")).toMatch(/<rect [^>]*fill="#f4f4f2"\/>/);
	});

	it("is white on the ground and black on paper, with no other colour", () => {
		expect(MARK_COLORS.night).toBe("#f4f4f2");
		expect(MARK_COLORS.paper).toBe("#0a0a0b");
		for (const tone of ["night", "paper"] as const) {
			const colours = new Set(markSvg(tone).match(/#[0-9a-f]{6}/gi));
			expect([...colours]).toEqual([MARK_COLORS[tone]]);
		}
		expect(markSvg("night")).not.toMatch(/f2a33a/i);
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
