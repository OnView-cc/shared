import { describe, expect, it } from "vitest";
import { textLayout } from "./layout";

describe("textLayout", () => {
	it("textLayout keeps one line in landscape for short text", () => {
		expect(textLayout(["Seis apps", "que ya se", "conocen."], "landscape")).toEqual({ sizeU: 11.4, widthPct: 84, wrap: false, breakGroups: false });
	});

	it("textLayout wraps in portrait", () => {
		const l = textLayout(["Seis apps", "que ya se", "conocen."], "portrait");
		expect(l.wrap).toBe(true);
		expect(l.sizeU).toBe(12.5);
		expect(l.widthPct).toBe(78);
	});

	it("textLayout wraps between groups in landscape when the whole text is long", () => {
		const l = textLayout(["Apps que se comportan", "como un solo producto."], "landscape");
		expect(l.wrap).toBe(true);
		expect(l.sizeU).toBe(11.4);
	});

	it("textLayout shrinks a group that does not fit a line", () => {
		const l = textLayout(["Aplicativos que se comportam", "como um só produto."], "portrait");
		expect(l.sizeU).toBeLessThan(12.5);
		expect(l.sizeU).toBeGreaterThanOrEqual(6);
	});

	it("textLayout never goes below 6u", () => {
		expect(textLayout(["x".repeat(60)], "portrait").sizeU).toBe(10);
		expect(textLayout(["x".repeat(60)], "landscape").sizeU).toBeGreaterThanOrEqual(6);
	});

	it("in portrait a long group breaks between its words instead of shrinking under 80 % (tarea 0b)", () => {
		expect(textLayout(["Start your workspace today"], "portrait")).toEqual({ sizeU: 10, widthPct: 78, wrap: true, breakGroups: true });
		expect(textLayout(["Seis apps"], "portrait").breakGroups).toBe(false);
	});

	it("textLayout of nothing is the base size", () => {
		expect(textLayout([], "square").sizeU).toBe(11.4);
	});
});

describe("textLayout with the style's scale (spec 2026-11-19)", () => {
	it("with no scale it is exactly as before", () => {
		expect(textLayout(["Seis apps"], "landscape", 1)).toEqual(textLayout(["Seis apps"], "landscape"));
		expect(textLayout(["Seis apps"], "portrait", 1, "center")).toEqual(textLayout(["Seis apps"], "portrait"));
	});

	it("scales the size", () => {
		expect(textLayout(["Sale"], "landscape", 1.7).sizeU).toBeCloseTo(11.4 * 1.7, 1);
		expect(textLayout(["Sale"], "landscape", 0.55).sizeU).toBeCloseTo(11.4 * 0.55, 1);
	});

	it("a corner phrase takes a narrower column", () => {
		expect(textLayout(["New collection"], "landscape", 0.55, "corner").widthPct).toBeLessThan(textLayout(["New collection"], "landscape").widthPct);
	});
});
