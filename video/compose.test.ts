import { describe, expect, it } from "vitest";
import { composeVideo, DEFAULT_FACE, frameSize, incompleteMoments, type ComposeInput } from "./compose";
import { parseBlockParams } from "../motion/types";

type Shot = ComposeInput["shots"][number];
const textParams = (o: Record<string, unknown> = {}) => parseBlockParams("text", o);

const shot = (o: Partial<Shot>): Shot => ({
	id: "a",
	position: 0,
	seconds: 6,
	block: "text",
	params: textParams(),
	beats: null,
	transition: "cut",
	voice: null,
	images: [],
	...o,
});

const base: ComposeInput = {
	format: "9:16",
	voiceVolume: 1,
	musicVolume: 0.35,
	musicFadeIn: 0,
	musicFadeOut: 1.5,
	closingLine: "",
	tempo: { bpm: 120, offset: 0 },
	template: null,
	shots: [],
	music: null,
	sfx: [],
	brand: null,
	limits: { watermark: false },
};

const brand = {
	textColor: "#ffee00",
	closingColor: "#101010",
	accentColor: "#ff5500",
	colors: ["#ffee00", "#101010", "#ff5500"],
	primary: { family: "inter", weight: 700 },
	secondary: { family: "inter", weight: 500 },
	sceneLogo: "L1",
	closingLogo: "L2",
};

const img = (id: string) => ({ id, src: `${id}.png`, width: 400, height: 400 });

describe("composeVideo", () => {
	it("lays moments out in order with their seconds and voices", () => {
		const c = composeVideo({
			...base,
			shots: [shot({ id: "b", position: 1, seconds: 4 }), shot({ id: "a", position: 0, seconds: 4, params: textParams({ lines: ["Hola"] }), voice: { src: "VA" } })],
		});
		expect(c.v).toBe(2);
		expect(c.moments.map((m) => [m.shotId, m.block, m.at, m.seconds])).toEqual([
			["a", "text", 0, 4],
			["b", "text", 4, 4],
		]);
		expect(c.moments[0]!.params).toMatchObject({ lines: ["Hola"] });
		expect(c.voices).toEqual([{ shotId: "a", src: "VA", at: 0, slot: 4 }]);
		expect([c.scenesTotal, c.total]).toEqual([8, 8]);
	});

	it("a moment with beats lasts beats times 60 over bpm", () => {
		const c = composeVideo({ ...base, shots: [shot({ params: textParams({ lines: ["Hi"] }), beats: 4 }), shot({ id: "b", position: 1, beats: 3 })] });
		expect(c.moments.map((m) => [m.at, m.seconds])).toEqual([
			[0, 2],
			[2, 1.5],
		]);
		expect(c.total).toBe(3.5);
	});

	it("appends a 4-beat logo moment when the kit has a closing logo", () => {
		const c = composeVideo({ ...base, brand, closingLine: " Order today ", shots: [shot({})] });
		const last = c.moments.at(-1)!;
		expect(last).toMatchObject({ shotId: null, block: "logo", at: 6, seconds: 2, params: { line: "Order today" } });
		expect([c.scenesTotal, c.total]).toEqual([6, 8]);
		expect(c.brand).toMatchObject({ face: { family: "inter", weight: 700 }, textColor: "#ffee00", closingColor: "#101010", accent: "#ff5500", sceneLogo: "L1", closingLogo: "L2" });
	});

	it("does not append a closing without a closing logo", () => {
		const c = composeVideo({ ...base, closingLine: "x", brand: { ...brand, closingLogo: null }, shots: [shot({})] });
		expect(c.moments.map((m) => m.block)).toEqual(["text"]);
		expect(c.total).toBe(6);
	});

	it("does not append a second closing when the last moment is a logo", () => {
		const c = composeVideo({ ...base, brand, shots: [shot({ beats: 4 }), shot({ id: "z", position: 1, block: "logo", params: parseBlockParams("logo", { line: "Hi" }), beats: 4 })] });
		expect(c.moments.map((m) => [m.shotId, m.block])).toEqual([
			["a", "text"],
			["z", "logo"],
		]);
	});

	it("the final logo does not count toward scenesTotal", () => {
		const c = composeVideo({ ...base, shots: [shot({ beats: 4 }), shot({ id: "z", position: 1, block: "logo", params: parseBlockParams("logo", {}), beats: 4 })] });
		expect([c.scenesTotal, c.total]).toEqual([2, 4]);
	});

	it("a logo moment in the middle counts", () => {
		const c = composeVideo({
			...base,
			shots: [shot({ block: "logo", params: parseBlockParams("logo", {}), beats: 4 }), shot({ id: "b", position: 1, beats: 4 })],
		});
		expect([c.scenesTotal, c.total]).toEqual([4, 4]);
	});

	it("a video without voice arms no voices", () => {
		const c = composeVideo({ ...base, template: { id: "software-launch", voice: false }, shots: [shot({ beats: 4, voice: { src: "V" } })] });
		expect(c.voices).toEqual([]);
	});

	it("a voice starts at the start of its moment", () => {
		const c = composeVideo({ ...base, shots: [shot({ beats: 4 }), shot({ id: "b", position: 1, beats: 4, voice: { src: "V" } })] });
		expect(c.voices).toEqual([{ shotId: "b", src: "V", at: 2, slot: 2 }]);
	});

	it("falls back to the default face and white text without a kit", () => {
		const c = composeVideo({ ...base, shots: [shot({})] });
		expect(c.brand).toMatchObject({ face: DEFAULT_FACE, textColor: "#ffffff", sceneLogo: null, closingLogo: null });
	});

	it("carries images, tempo and transitions", () => {
		const c = composeVideo({ ...base, tempo: { bpm: 116, offset: 0.03 }, shots: [shot({ block: "icons", params: parseBlockParams("icons", {}), beats: 8, transition: "push", images: [img("i1"), img("i2")] })] });
		expect(c.tempo).toEqual({ bpm: 116, offset: 0.03 });
		expect(c.moments[0]!.images.map((i) => i.id)).toEqual(["i1", "i2"]);
		expect(c.moments[0]!.transition).toBe("push");
	});

	it("pulls a sound effect past the end of its moment back inside it, and drops orphans", () => {
		const c = composeVideo({
			...base,
			shots: [shot({})],
			sfx: [
				{ id: "1", shotId: "a", sfxKey: "pop-soft", at: 9, volume: 0.6 },
				{ id: "2", shotId: "gone", sfxKey: "pop-soft", at: 0, volume: 0.6 },
			],
		});
		expect(c.sfx).toEqual([{ id: "1", shotId: "a", sfxKey: "pop-soft", at: 5.95, volume: 0.6 }]);
	});

	it("carries the music mix and the plan's watermark, always at 1080", () => {
		const c = composeVideo({ ...base, music: { src: "M" }, limits: { watermark: true }, shots: [shot({})] });
		expect(c.music).toEqual({ src: "M", volume: 0.35, fadeIn: 0, fadeOut: 1.5 });
		expect(c.watermark).toBe(true);
		expect([c.width, c.height, c.fps, c.format]).toEqual([1080, 1920, 30, "9:16"]);
	});
});

describe("incompleteMoments", () => {
	it("lists icons with one image and ui or product without an image", () => {
		const c = composeVideo({
			...base,
			brand,
			shots: [
				shot({ id: "icons", position: 1, block: "icons", params: parseBlockParams("icons", {}), beats: 4, images: [img("i1")] }),
				shot({ id: "ui", position: 2, block: "ui", params: parseBlockParams("ui", {}), beats: 4 }),
				shot({ id: "product", position: 3, block: "product", params: parseBlockParams("product", {}), beats: 4 }),
				shot({ id: "ok", position: 4, block: "icons", params: parseBlockParams("icons", {}), beats: 4, images: [img("i1"), img("i2")] }),
				shot({ id: "text", position: 5, beats: 4 }),
			],
		});
		expect(incompleteMoments(c)).toEqual(["icons", "ui", "product"]);
	});
});

describe("frameSize", () => {
	it("is always 1080 on the short side", () => {
		expect(frameSize("9:16")).toEqual({ width: 1080, height: 1920 });
		expect(frameSize("16:9")).toEqual({ width: 1920, height: 1080 });
		expect(frameSize("1:1")).toEqual({ width: 1080, height: 1080 });
	});
});

describe("blocks", () => {
	it("there are five blocks and none is an AI clip", async () => {
		const { BLOCKS } = await import("../motion/types");
		expect(BLOCKS).toEqual(["text", "icons", "ui", "product", "logo"]);
	});
});

describe("composeVideo with styles (spec 2026-11-19)", () => {
	const shots = [shot({ id: "a", position: 0, transition: null }), shot({ id: "b", position: 1, transition: null }), shot({ id: "c", position: 2, transition: null })];

	it("resolves an empty transition to the style's, and the one into the closing to its close", () => {
		const c = composeVideo({ ...base, template: { id: "offer", voice: true }, brand, shots });
		expect(c.style.id).toBe("impact");
		expect(c.moments.map((m) => [m.shotId, m.transition])).toEqual([
			["a", "punch"],
			["b", "punch"],
			["c", "punch"],
			[null, "cut"],
		]);
	});

	it("uses the close transition for the moment before a closing logo the person placed", () => {
		const style = { id: "cinema", overrides: { transitions: { close: "cut" } } };
		const c = composeVideo({ ...base, template: { id: "offer", voice: true }, style, shots: [...shots, shot({ id: "z", position: 3, block: "logo", params: parseBlockParams("logo", {}), transition: null })] });
		expect(c.moments.map((m) => m.transition)).toEqual(["fade", "fade", "cut", "cut"]);
	});

	it("keeps a transition the moment fixed", () => {
		const c = composeVideo({ ...base, template: { id: "offer", voice: true }, shots: [shot({ id: "a", transition: "fade" }), shot({ id: "b", position: 1, transition: null }), shot({ id: "c", position: 2, transition: null })] });
		// El último no pasa a nada: corte.
		expect(c.moments.map((m) => m.transition)).toEqual(["fade", "punch", "cut"]);
	});

	it("takes the chosen style over the template's", () => {
		expect(composeVideo({ ...base, template: { id: "offer", voice: true }, style: { id: "cinema", overrides: null } }).style.id).toBe("cinema");
	});

	it("is Arcade with neither style nor template", () => {
		expect(composeVideo({ ...base, template: null }).style.id).toBe("arcade");
	});

	it("passes the font's weights to the engine", () => {
		const c = composeVideo({ ...base, brand: { ...brand, primary: { family: "bebas-neue", weight: 400, weights: [400] } } });
		expect(c.brand.face.weights).toEqual([400]);
	});
});

describe("scenes in the composition (spec 2026-11-24)", () => {
	const code = "export default function scene(ctx, kit) {}";
	const four = [0, 1, 2, 3].map((i) => shot({ id: `s${i}`, position: i, beats: 4, params: textParams({ lines: [`L${i}`] }) }));

	it("without scenes, the composition is unchanged", () => {
		const a = composeVideo({ ...base, shots: four });
		const b = composeVideo({ ...base, shots: four.map((s) => ({ ...s, scene: null })) });
		expect(b).toEqual(a);
		expect(a.moments.every((m) => m.block === "text" && m.events === undefined)).toBe(true);
	});

	it("a shot with a ready scene becomes a scene moment with its classic block as fallback", () => {
		const c = composeVideo({ ...base, shots: [shot({ id: "a", beats: 4, params: textParams({ lines: ["Respaldo"] }), scene: { code, texts: { headline: "Hola" }, kitVersion: 1, events: [] } })] });
		const m = c.moments[0]!;
		expect(m.block).toBe("scene");
		expect(m.params).toEqual({ code, texts: { headline: "Hola" }, kitVersion: 1, fallback: { block: "text", params: textParams({ lines: ["Respaldo"] }) } });
	});

	it("scene events become sfx at moment.at + event.at", () => {
		const c = composeVideo({
			...base,
			shots: [shot({ id: "a", position: 0, beats: 4 }), shot({ id: "b", position: 1, beats: 4, scene: { code, texts: {}, kitVersion: 1, events: [{ kind: "click", at: 0.5, n: 0 }, { kind: "land", at: 1.2, n: 0 }] } })],
			sfx: [{ id: "m1", shotId: "a", sfxKey: "pop-soft", at: 0.3, volume: 0.6 }],
		});
		expect(c.moments[1]!.events).toEqual([{ kind: "click", at: 0.5, n: 0 }, { kind: "land", at: 1.2, n: 0 }]);
		expect(c.sfx.map((x) => [x.sfxKey, x.at])).toEqual([["pop-soft", 0.3], ["click-ui", 2.5], ["pop-soft", 3.2]]);
	});

	it("incompleteMoments ignores scene moments", () => {
		const c = composeVideo({ ...base, shots: [shot({ id: "u", block: "ui", params: parseBlockParams("ui", {}), scene: { code, texts: {}, kitVersion: 1, events: [] } })] });
		expect(incompleteMoments(c)).toEqual([]);
	});
});
