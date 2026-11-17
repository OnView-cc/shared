import { describe, expect, it } from "vitest";
import { chooseVersion, composeVideo, DEFAULT_FACE, frameSize, type ComposeInput } from "./compose";

const shot = (o: Partial<ComposeInput["shots"][number]>): ComposeInput["shots"][number] => ({
	id: "a",
	position: 0,
	seconds: 6,
	onScreenText: "",
	textPosition: "bottom",
	textIn: 0,
	textOut: null,
	trimIn: 0,
	trimOut: null,
	clip: null,
	still: null,
	voice: null,
	...o,
});

const base: ComposeInput = {
	format: "9:16",
	quality: "standard_720p",
	voiceVolume: 1,
	musicVolume: 0.35,
	musicFadeIn: 0,
	musicFadeOut: 1.5,
	closingText: "",
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
	primary: { family: "inter", weight: 700 },
	secondary: { family: "inter", weight: 500 },
	sceneLogo: "L1",
	closingLogo: "L2",
};

describe("composeVideo", () => {
	it("lays scenes out in order with trims, text moments and the closing", () => {
		const c = composeVideo({
			...base,
			closingText: " Order today ",
			brand,
			shots: [
				shot({ id: "b", position: 1, seconds: 4, clip: { src: "B", seconds: 4 } }),
				shot({ id: "a", position: 0, clip: { src: "A", seconds: 6 }, trimIn: 1, trimOut: 5, onScreenText: "Hola", textIn: 0.5, voice: { src: "VA" } }),
			],
		});
		expect(c.scenes.map((s) => [s.shotId, s.from, s.to, s.at])).toEqual([
			["a", 1, 5, 0],
			["b", 0, 4, 4],
		]);
		expect(c.texts).toEqual([{ shotId: "a", text: "Hola", position: "bottom", from: 0.5, to: 4 }]);
		expect(c.voices).toEqual([{ shotId: "a", src: "VA", at: 0, slot: 4 }]);
		expect(c.closing).toMatchObject({ at: 8, seconds: 2, color: "#101010", logo: "L2", text: "Order today", accent: "#ff5500", face: { family: "inter", weight: 500 } });
		expect([c.scenesTotal, c.total]).toEqual([8, 10]);
		expect(c.text).toEqual({ face: { family: "inter", weight: 700 }, color: "#ffee00" });
		expect(c.logo).toBe("L1");
	});

	it("has no closing without a closing logo, even with a closing line", () => {
		const c = composeVideo({ ...base, closingText: "x", brand: { ...brand, closingLogo: null }, shots: [shot({ clip: { src: "A", seconds: 6 } })] });
		expect(c.closing).toBeNull();
		expect(c.total).toBe(6);
	});

	it("falls back to the default face and white text without a kit", () => {
		const c = composeVideo({ ...base, shots: [shot({})] });
		expect(c.text).toEqual({ face: DEFAULT_FACE, color: "#ffffff" });
		expect(c.logo).toBeNull();
	});

	it("fills a scene without a clip with its photo for its asked seconds", () => {
		const c = composeVideo({ ...base, shots: [shot({ seconds: 6, still: "PHOTO", trimIn: 2, trimOut: 3 })] });
		expect(c.scenes).toEqual([{ shotId: "a", src: null, still: "PHOTO", from: 0, to: 6, at: 0 }]);
	});

	it("keeps a text inside its scene and drops an empty or zero-length one", () => {
		const c = composeVideo({
			...base,
			shots: [
				shot({ id: "a", position: 0, clip: { src: "A", seconds: 6 }, onScreenText: "uno", textIn: 2, textOut: 99 }),
				shot({ id: "b", position: 1, clip: { src: "B", seconds: 6 }, onScreenText: "", textIn: 0 }),
				shot({ id: "c", position: 2, clip: { src: "C", seconds: 6 }, onScreenText: "tres", textIn: 4, textOut: 1 }),
			],
		});
		expect(c.texts).toEqual([{ shotId: "a", text: "uno", position: "bottom", from: 2, to: 6 }]);
	});

	it("pulls a sound effect past the end of its scene back inside it, and drops orphans", () => {
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
		expect([c.width, c.height, c.fps]).toEqual([720, 1280, 30]);
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
	it("keeps a scene whose trim starts at or past the end of its clip inside the clip", () => {
		const c = composeVideo({ ...base, shots: [shot({ clip: { src: "A", seconds: 6 }, trimIn: 7 }), shot({ id: "b", position: 1, clip: { src: "B", seconds: 4 } })] });
		const [a, b] = c.scenes;
		expect(a!.from).toBeLessThan(6);
		expect(a!.to).toBeGreaterThan(a!.from);
		expect(b!.at).toBeCloseTo(a!.to - a!.from);
	});

	it("never lets a scene end before it starts", () => {
		const c = composeVideo({ ...base, shots: [shot({ clip: { src: "A", seconds: 6 }, trimIn: 3, trimOut: 2 })] });
		expect(c.scenes[0]!.to).toBeGreaterThan(c.scenes[0]!.from);
		expect(c.total).toBeGreaterThan(0);
	});
});
