import { describe, expect, it } from "vitest";
import { closingVersion, isLightColor, pickFont, pickLogo, pickLogos, pickMark } from "./brand";

const mark = (o: Partial<{ id: string; isDefault: boolean; onDark: string | null; onLight: string | null }>) => ({ id: "m", isDefault: false, onDark: null, onLight: null, ...o });

describe("pickMark", () => {
	it("picks the chosen mark, else the default, else the first", () => {
		const marks = [mark({ id: "a" }), mark({ id: "b", isDefault: true }), mark({ id: "c" })];
		expect(pickMark(marks, "c")?.id).toBe("c");
		expect(pickMark(marks, "gone")?.id).toBe("b");
		expect(pickMark(marks, null)?.id).toBe("b");
		expect(pickMark([mark({ id: "a" }), mark({ id: "c" })])?.id).toBe("a");
		expect(pickMark([])).toBeNull();
	});
});

describe("pickLogo and pickLogos", () => {
	it("falls back to the other version when the wanted one is missing", () => {
		expect(pickLogo(mark({ onDark: "D", onLight: "L" }), "on_light")).toBe("L");
		expect(pickLogo(mark({ onDark: "D" }), "on_light")).toBe("D");
		expect(pickLogo(mark({}), "on_dark")).toBeNull();
		expect(pickLogo(null, "on_dark")).toBeNull();
	});

	it("asks for the light-background logo on a light closing colour and falls back to the other version", () => {
		const marks = [mark({ isDefault: true, onDark: "D", onLight: "L" })];
		expect(pickLogos(marks, {}, "#ffffff")).toEqual({ scene: "D", closing: "L", light: "L" });
		expect(pickLogos(marks, { version: "on_light" }, "#000000")).toEqual({ scene: "L", closing: "D", light: "L" });
		expect(pickLogos([mark({ isDefault: true, onLight: "L" })], {}, "#000000")).toEqual({ scene: "L", closing: "L", light: "L" });
		expect(pickLogos([mark({ isDefault: true, onDark: "D" })], {}, null)).toEqual({ scene: "D", closing: "D", light: "D" });
		expect(pickLogos([], {}, null)).toEqual({ scene: null, closing: null, light: null });
	});

	it("uses the video's mark in the corner and in the closing", () => {
		const marks = [mark({ id: "a", isDefault: true, onDark: "A" }), mark({ id: "b", onDark: "B" })];
		expect(pickLogos(marks, { markId: "b" }, null)).toEqual({ scene: "B", closing: "B", light: "B" });
	});
});

describe("isLightColor and closingVersion", () => {
	it("calls a colour light when black contrasts better with it than white", () => {
		expect(isLightColor("#ffffff")).toBe(true);
		expect(isLightColor("#f2a33a")).toBe(true);
		expect(isLightColor("#0a0a0b")).toBe(false);
		expect(isLightColor("nope")).toBe(false);
		expect(closingVersion("#ffffff")).toBe("on_light");
		expect(closingVersion(null)).toBe("on_dark");
	});
});

describe("pickFont", () => {
	const font = (id: string, isDefault: boolean, weight: number) => ({ id, isDefault, primary: { family: "inter", weight }, secondary: { family: "montserrat", weight } });

	it("picks the video's font, else the kit default, else the first, else Bricolage 600", () => {
		const fonts = [font("a", false, 400), font("b", true, 700)];
		expect(pickFont(fonts, "a").primary.weight).toBe(400);
		expect(pickFont(fonts, "gone").primary.weight).toBe(700);
		expect(pickFont([font("a", false, 400)]).secondary).toEqual({ family: "montserrat", weight: 400 });
		expect(pickFont([])).toEqual({ primary: { family: "bricolage-grotesque", weight: 600 }, secondary: { family: "bricolage-grotesque", weight: 600 } });
	});
});
