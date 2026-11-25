import { describe, expect, it } from "vitest";
import { KIT_VERSION, MATERIAL_KINDS, MAX_SCENE_TEXT, MAX_SCENE_TEXTS, parseBlockParams, parseMaterialKind, parseSceneParams } from "./types";

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

describe("parseSceneParams", () => {
	const base = { code: "export default function scene(ctx, kit) {}", texts: {}, fallback: { block: "text", params: { lines: ["a"] } } };

	it("rejects code over 40960 bytes", () => {
		expect(parseSceneParams({ ...base, code: "a".repeat(40961) })).toBeNull();
		expect(parseSceneParams({ ...base, code: "a".repeat(40960) })).not.toBeNull();
	});

	it("rejects empty or non-string code", () => {
		expect(parseSceneParams({ ...base, code: "" })).toBeNull();
		expect(parseSceneParams({ ...base, code: 3 })).toBeNull();
	});

	it("drops bad text keys and clips values", () => {
		const p = parseSceneParams({ ...base, texts: { headline: "x".repeat(200), "Bad Key": "y", n: 4 } });
		expect(Object.keys(p!.texts)).toEqual(["headline"]);
		expect(p!.texts.headline).toHaveLength(MAX_SCENE_TEXT);
	});

	it("keeps at most MAX_SCENE_TEXTS keys", () => {
		const texts = Object.fromEntries(Array.from({ length: 20 }, (_, i) => [`t${i}`, "x"]));
		expect(Object.keys(parseSceneParams({ ...base, texts })!.texts)).toHaveLength(MAX_SCENE_TEXTS);
	});

	it("parses fallback through parseBlockParams", () => {
		const p = parseSceneParams({ ...base, fallback: { block: "text", params: { lines: ["a", "b", "c", "d"] } } });
		expect((p!.fallback.params as { lines: string[] }).lines).toHaveLength(3);
	});

	it("rejects unknown fallback block", () => {
		expect(parseSceneParams({ ...base, fallback: { block: "scene", params: {} } })).toBeNull();
		expect(parseSceneParams({ ...base, fallback: null })).toBeNull();
	});

	it("defaults kitVersion to KIT_VERSION", () => {
		expect(parseSceneParams(base)!.kitVersion).toBe(KIT_VERSION);
		expect(parseSceneParams({ ...base, kitVersion: 1 })!.kitVersion).toBe(1);
	});
});
