import { describe, expect, it } from "vitest";
import { textLayout } from "./layout";

describe("textLayout", () => {
	it("textLayout keeps one line in landscape for short text", () => {
		expect(textLayout(["Seis apps", "que ya se", "conocen."], "landscape")).toEqual({ sizeU: 8.6, widthPct: 84, wrap: false });
	});

	it("textLayout wraps in portrait", () => {
		const l = textLayout(["Seis apps", "que ya se", "conocen."], "portrait");
		expect(l.wrap).toBe(true);
		expect(l.sizeU).toBe(11);
		expect(l.widthPct).toBe(78);
	});

	it("textLayout wraps between groups in landscape when the whole text is long", () => {
		const l = textLayout(["Apps que se comportan", "como un solo producto."], "landscape");
		expect(l.wrap).toBe(true);
		expect(l.sizeU).toBe(8.6);
	});

	it("textLayout shrinks a group that does not fit a line", () => {
		const l = textLayout(["Aplicativos que se comportam", "como um só produto."], "portrait");
		expect(l.sizeU).toBeLessThan(11);
		expect(l.sizeU).toBeGreaterThanOrEqual(6);
	});

	it("textLayout never goes below 6u", () => {
		expect(textLayout(["x".repeat(60)], "portrait").sizeU).toBe(6);
		expect(textLayout(["x".repeat(60)], "landscape").sizeU).toBeGreaterThanOrEqual(6);
	});

	it("textLayout of nothing is the base size", () => {
		expect(textLayout([], "square").sizeU).toBe(8.6);
	});
});
