import { describe, expect, it } from "vitest";
import { chooseVersion, composeVideo, DEFAULT_FACE, frameSize, incompleteMoments, type ComposeInput } from "./compose";
import { parseBlockParams } from "../motion/types";

type Shot = ComposeInput["shots"][number];
const clipParams = (o: Record<string, unknown> = {}) => parseBlockParams("clip", o);

const shot = (o: Partial<Shot>): Shot => ({
	id: "a",
	position: 0,
	seconds: 6,
	block: "clip",
	params: clipParams(),
	beats: null,
	transition: "cut",
	trimIn: 0,
	trimOut: null,
	clip: null,
	still: null,
	voice: null,
	images: [],
	...o,
});

const base: ComposeInput = {
	format: "9:16",
	quality: "standard_720p",
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
	limits: { maxResolution: "1080p", watermark: false },
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
	it("lays clip moments out in order with their trims and voices", () => {
		const c = composeVideo({
			...base,
			shots: [
				shot({ id: "b", position: 1, seconds: 4, clip: { src: "B", seconds: 4 } }),
				shot({ id: "a", position: 0, clip: { src: "A", seconds: 6 }, trimIn: 1, trimOut: 5, params: clipParams({ text: "Hola", textIn: 0.5 }), voice: { src: "VA" } }),
			],
		});
		expect(c.v).toBe(2);
		expect(c.moments.map((m) => [m.shotId, m.block, m.at, m.seconds, m.clip?.from, m.clip?.to])).toEqual([
			["a", "clip", 0, 4, 1, 5],
			["b", "clip", 4, 4, 0, 4],
		]);
		expect(c.moments[0]!.params).toMatchObject({ text: "Hola", textIn: 0.5 });
		expect(c.voices).toEqual([{ shotId: "a", src: "VA", at: 0, slot: 4 }]);
		expect([c.scenesTotal, c.total]).toEqual([8, 8]);
	});

	it("a moment with beats lasts beats times 60 over bpm", () => {
		const c = composeVideo({ ...base, shots: [shot({ block: "text", params: parseBlockParams("text", { lines: ["Hi"] }), beats: 4 }), shot({ id: "b", position: 1, block: "text", params: parseBlockParams("text", {}), beats: 3 })] });
		expect(c.moments.map((m) => [m.at, m.seconds])).toEqual([
			[0, 2],
			[2, 1.5],
		]);
		expect(c.total).toBe(3.5);
	});

	it("appends a 4-beat logo moment when the kit has a closing logo", () => {
		const c = composeVideo({ ...base, brand, closingLine: " Order today ", shots: [shot({ clip: { src: "A", seconds: 6 } })] });
		const last = c.moments.at(-1)!;
		expect(last).toMatchObject({ shotId: null, block: "logo", at: 6, seconds: 2, params: { line: "Order today" } });
		expect([c.scenesTotal, c.total]).toEqual([6, 8]);
		expect(c.brand).toMatchObject({ face: { family: "inter", weight: 700 }, textColor: "#ffee00", closingColor: "#101010", accent: "#ff5500", sceneLogo: "L1", closingLogo: "L2" });
	});

	it("does not append a closing without a closing logo", () => {
		const c = composeVideo({ ...base, closingLine: "x", brand: { ...brand, closingLogo: null }, shots: [shot({ clip: { src: "A", seconds: 6 } })] });
		expect(c.moments.map((m) => m.block)).toEqual(["clip"]);
		expect(c.total).toBe(6);
	});

	it("does not append a second closing when the last moment is a logo", () => {
		const c = composeVideo({ ...base, brand, shots: [shot({ block: "text", params: parseBlockParams("text", {}), beats: 4 }), shot({ id: "z", position: 1, block: "logo", params: parseBlockParams("logo", { line: "Hi" }), beats: 4 })] });
		expect(c.moments.map((m) => [m.shotId, m.block])).toEqual([
			["a", "text"],
			["z", "logo"],
		]);
	});

	it("the final logo does not count toward scenesTotal", () => {
		const c = composeVideo({ ...base, shots: [shot({ block: "text", params: parseBlockParams("text", {}), beats: 4 }), shot({ id: "z", position: 1, block: "logo", params: parseBlockParams("logo", {}), beats: 4 })] });
		expect([c.scenesTotal, c.total]).toEqual([2, 4]);
	});

	it("a logo moment in the middle counts", () => {
		const c = composeVideo({
			...base,
			shots: [shot({ block: "logo", params: parseBlockParams("logo", {}), beats: 4 }), shot({ id: "b", position: 1, block: "text", params: parseBlockParams("text", {}), beats: 4 })],
		});
		expect([c.scenesTotal, c.total]).toEqual([4, 4]);
	});

	it("a template without voice arms no voices", () => {
		const c = composeVideo({ ...base, template: { id: "software-launch", voice: false }, shots: [shot({ block: "text", params: parseBlockParams("text", {}), beats: 4, voice: { src: "V" } })] });
		expect(c.voices).toEqual([]);
	});

	it("a voice starts at the start of its moment", () => {
		const c = composeVideo({ ...base, shots: [shot({ block: "text", params: parseBlockParams("text", {}), beats: 4 }), shot({ id: "b", position: 1, block: "text", params: parseBlockParams("text", {}), beats: 4, voice: { src: "V" } })] });
		expect(c.voices).toEqual([{ shotId: "b", src: "V", at: 2, slot: 2 }]);
	});

	it("falls back to the default face and white text without a kit", () => {
		const c = composeVideo({ ...base, shots: [shot({})] });
		expect(c.brand).toMatchObject({ face: DEFAULT_FACE, textColor: "#ffffff", sceneLogo: null, closingLogo: null });
	});

	it("fills a clip moment without a clip with its photo for its asked seconds", () => {
		const c = composeVideo({ ...base, shots: [shot({ seconds: 6, still: "PHOTO", trimIn: 2, trimOut: 3 })] });
		expect(c.moments[0]).toMatchObject({ clip: null, still: "PHOTO", at: 0, seconds: 6 });
	});

	it("a non-clip moment ignores any clip and photo", () => {
		const c = composeVideo({ ...base, shots: [shot({ block: "text", params: parseBlockParams("text", {}), beats: 2, clip: { src: "x.mp4", seconds: 8 }, still: "s.png" })] });
		expect(c.moments[0]).toMatchObject({ clip: null, still: null, seconds: 1 });
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
			shots: [shot({ clip: { src: "A", seconds: 6 } })],
			sfx: [
				{ id: "1", shotId: "a", sfxKey: "pop-soft", at: 9, volume: 0.6 },
				{ id: "2", shotId: "gone", sfxKey: "pop-soft", at: 0, volume: 0.6 },
			],
		});
		expect(c.sfx).toEqual([{ id: "1", shotId: "a", sfxKey: "pop-soft", at: 5.95, volume: 0.6 }]);
	});

	it("carries the music mix and the plan's watermark", () => {
		const c = composeVideo({ ...base, music: { src: "M" }, limits: { maxResolution: "720p", watermark: true }, shots: [shot({ clip: { src: "A", seconds: 6 } })] });
		expect(c.music).toEqual({ src: "M", volume: 0.35, fadeIn: 0, fadeOut: 1.5 });
		expect(c.watermark).toBe(true);
		expect([c.width, c.height, c.fps, c.format]).toEqual([720, 1280, 30, "9:16"]);
	});
});

describe("incompleteMoments", () => {
	it("incompleteMoments lists a clip without a clip, icons with one image and ui without an image", () => {
		const c = composeVideo({
			...base,
			brand,
			shots: [
				shot({ id: "clip", position: 0 }),
				shot({ id: "icons", position: 1, block: "icons", params: parseBlockParams("icons", {}), beats: 4, images: [img("i1")] }),
				shot({ id: "ui", position: 2, block: "ui", params: parseBlockParams("ui", {}), beats: 4 }),
				shot({ id: "product", position: 3, block: "product", params: parseBlockParams("product", {}), beats: 4 }),
				shot({ id: "ok", position: 4, block: "icons", params: parseBlockParams("icons", {}), beats: 4, images: [img("i1"), img("i2")] }),
				shot({ id: "text", position: 5, block: "text", params: parseBlockParams("text", {}), beats: 4 }),
			],
		});
		expect(incompleteMoments(c)).toEqual(["clip", "icons", "ui", "product"]);
	});
});

describe("frameSize", () => {
	it("sizes the frame by format, quality and the plan's ceiling", () => {
		expect(frameSize("9:16", "standard_1080p", "720p")).toEqual({ width: 720, height: 1280 });
		expect(frameSize("16:9", "premium_1080p", "1080p")).toEqual({ width: 1920, height: 1080 });
		expect(frameSize("1:1", "standard_720p", "1080p")).toEqual({ width: 720, height: 720 });
	});
});

describe("chooseVersion", () => {
	it("chooses the selected version when ready, else the last ready one", () => {
		const v = [
			{ id: "1", state: "ready" },
			{ id: "2", state: "failed" },
			{ id: "3", state: "ready" },
		];
		expect(chooseVersion(v, "1")?.id).toBe("1");
		expect(chooseVersion(v, "2")?.id).toBe("3");
		expect(chooseVersion([], null)).toBeNull();
	});
});

describe("composeVideo and impossible trims (review I1)", () => {
	it("keeps a clip whose trim starts at or past the end of its clip inside the clip", () => {
		const c = composeVideo({ ...base, shots: [shot({ clip: { src: "A", seconds: 6 }, trimIn: 7 }), shot({ id: "b", position: 1, clip: { src: "B", seconds: 4 } })] });
		const [a, b] = c.moments;
		expect(a!.clip!.from).toBeLessThan(6);
		expect(a!.clip!.to).toBeGreaterThan(a!.clip!.from);
		expect(b!.at).toBeCloseTo(a!.seconds);
	});

	it("never lets a moment end before it starts", () => {
		const c = composeVideo({ ...base, shots: [shot({ clip: { src: "A", seconds: 6 }, trimIn: 3, trimOut: 2 })] });
		expect(c.moments[0]!.seconds).toBeGreaterThan(0);
		expect(c.total).toBeGreaterThan(0);
	});
});
