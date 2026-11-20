import { describe, expect, it } from "vitest";
import { clampBpm, isStyleId, parseStylePatch, resolveStyle, STYLE_IDS, STYLES } from "./styles";

describe("the styles", () => {
	it("Arcade is exactly today's look", () => {
		const { id, name, summary, music, ...look } = STYLES.arcade;
		expect(id).toBe("arcade");
		expect(name.es).toBe("Arcade");
		expect(summary.length).toBeGreaterThan(10);
		expect(music.mood.length).toBeGreaterThan(3);
		expect(look).toEqual({
			background: { kind: "sky", motion: "still", saturate: 0 },
			type: { scale: "m", weight: "kit-500", case: "normal", tracking: -0.025, entry: "groups", place: "center" },
			tempo: { bpm: 116, min: 110, max: 124 },
			transitions: { between: "blur", close: "blur" },
			camera: { drift: "none", amount: "subtle", hit: "none" },
			product: { frame: "shadow", move: "subtle" },
		});
	});

	it("the other seven follow the spec's table", () => {
		const pick = (id: keyof typeof STYLES) => {
			const s = STYLES[id];
			return [s.background.kind, s.type.scale, s.type.weight, s.type.entry, s.tempo.bpm, s.tempo.min, s.tempo.max, s.transitions.between, s.camera.drift, s.camera.hit];
		};
		expect(pick("changelog")).toEqual(["paper", "m", 600, "rise", 120, 114, 128, "cut", "none", "zoom"]);
		expect(pick("orbit")).toEqual(["dark", "l", 600, "groups", 120, 112, 126, "push", "parallax", "none"]);
		expect(pick("showcase")).toEqual(["auto", "s", 400, "fade", 96, 88, 104, "wipe", "in", "none"]);
		expect(pick("blocks")).toEqual(["brand", "l", 700, "slam", 124, 118, 130, "cut", "none", "zoom"]);
		expect(pick("steps")).toEqual(["paper", "m", 500, "rise", 90, 84, 100, "slide", "none", "none"]);
		expect(pick("impact")).toEqual(["brand", "xl", 800, "slam", 128, 122, 134, "punch", "none", "shake"]);
		expect(pick("cinema")).toEqual(["dark", "l", 400, "fade", 80, 72, 90, "fade", "in", "none"]);
		expect(STYLES.orbit.background.motion).toBe("drift");
		expect(STYLES.cinema.background.motion).toBe("drift");
		expect(STYLES.showcase.type).toMatchObject({ case: "upper", tracking: 0.12, place: "corner" });
		expect(STYLES.showcase.camera.amount).toBe("wide");
		expect(STYLES.showcase.product).toEqual({ frame: "plinth", move: "wide" });
		expect(STYLES.steps.type.place).toBe("lower");
		expect(STYLES.impact.type.case).toBe("upper");
		expect(STYLES.impact.background.saturate).toBe(0.8);
		expect(STYLES.cinema.camera.amount).toBe("subtle");
		// Lo que entra al cierre: la misma de entre momentos (en Arcade, el beneficio sale al cierre con blur).
		for (const id of STYLE_IDS) expect(STYLES[id].transitions.close).toBe(STYLES[id].transitions.between);
	});

	it("knows its ids", () => {
		expect(isStyleId("impact")).toBe(true);
		expect(isStyleId("nope")).toBe(false);
	});
});

describe("resolveStyle", () => {
	it("is Arcade without a template", () => {
		expect(resolveStyle(null, null, null).id).toBe("arcade");
	});

	it("takes the template's style, or the chosen one if it exists", () => {
		expect(resolveStyle("offer", null, null).id).toBe("impact");
		expect(resolveStyle("offer", "cinema", null).id).toBe("cinema");
		expect(resolveStyle("offer", "nope", null).id).toBe("impact");
	});

	it("puts the valid overrides on top and drops the rest", () => {
		const s = resolveStyle("product", null, { background: { kind: "dark" }, type: { scale: "xl", weight: 9999 }, camera: { hit: "boom" } });
		expect(s.background.kind).toBe("dark");
		expect(s.type.scale).toBe("xl");
		expect(s.type.weight).toBe(400);
		expect(s.camera.hit).toBe("none");
	});

	it("never changes the shared style objects", () => {
		resolveStyle("offer", null, { background: { kind: "paper" } });
		expect(STYLES.impact.background.kind).toBe("brand");
	});
});

describe("parseStylePatch", () => {
	it("keeps nothing of tempo, music or unknown keys", () => {
		expect(parseStylePatch({ tempo: { bpm: 200 }, music: { mood: "x" }, junk: 1 })).toEqual({});
		expect(parseStylePatch("nope")).toEqual({});
		expect(parseStylePatch(null)).toEqual({});
	});

	it("keeps valid fields only", () => {
		expect(parseStylePatch({ background: { kind: "paper", saturate: 3 }, type: { weight: 700, tracking: 0.05 }, transitions: { between: "fade", close: "spin" } })).toEqual({
			background: { kind: "paper" },
			type: { weight: 700, tracking: 0.05 },
			transitions: { between: "fade" },
		});
	});
});

describe("clampBpm", () => {
	it("keeps the tempo inside the style's range", () => {
		expect(clampBpm(STYLES.impact, 100)).toBe(122);
		expect(clampBpm(STYLES.impact, 130)).toBe(130);
		expect(clampBpm(STYLES.impact, 300)).toBe(134);
	});
});
