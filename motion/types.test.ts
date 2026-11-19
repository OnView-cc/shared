import { describe, expect, it } from "vitest";
import { MATERIAL_KINDS, parseBlockParams, parseMaterialKind } from "./types";

describe("parseMaterialKind", () => {
	it("keeps a known kind and turns anything else into other", () => {
		expect(MATERIAL_KINDS).toEqual(["screenshot", "product_photo", "logo", "other"]);
		expect(parseMaterialKind("screenshot")).toBe("screenshot");
		expect(parseMaterialKind("product_photo")).toBe("product_photo");
		expect(parseMaterialKind(null)).toBe("other");
		expect(parseMaterialKind("x")).toBe("other");
	});
});

describe("product params", () => {
	it("a product moment moves in by default, and can move out or pan", () => {
		expect(parseBlockParams("product", { lines: ["a"] }).move).toBe("in");
		expect(parseBlockParams("product", { move: "pan" }).move).toBe("pan");
		expect(parseBlockParams("product", { move: "out" }).move).toBe("out");
		expect(parseBlockParams("product", { move: "zz" }).move).toBe("in");
	});
});
