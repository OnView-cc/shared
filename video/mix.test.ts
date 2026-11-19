import { describe, expect, it } from "vitest";
import { composeVideo, type ComposeInput } from "./compose";
import { parseBlockParams } from "../motion/types";
import { fitVoice, gainAt, musicEnvelope, resolveAudio } from "./mix";

const shot = (o: Partial<ComposeInput["shots"][number]>): ComposeInput["shots"][number] => ({
	id: "a",
	position: 0,
	seconds: 4,
	block: "text",
	params: parseBlockParams("text", {}),
	beats: null,
	transition: "cut",
	voice: null,
	images: [],
	...o,
});

/** 8 s de escenas (a y b, 4 s cada una) más el cierre de 4 golpes a 120 BPM: 10 s; música "M" y una voz en la escena a. */
const composition = () =>
	composeVideo({
		format: "9:16",
		voiceVolume: 1,
		musicVolume: 0.4,
		musicFadeIn: 0,
		musicFadeOut: 2,
		closingLine: "",
		tempo: { bpm: 120, offset: 0 },
		template: null,
		shots: [shot({ id: "a", position: 0, voice: { src: "VA" } }), shot({ id: "b", position: 1 })],
		music: { src: "M" },
		sfx: [],
		brand: { textColor: null, closingColor: null, accentColor: null, colors: [], primary: { family: "inter", weight: 600 }, secondary: { family: "inter", weight: 600 }, sceneLogo: null, closingLogo: "L" },
		limits: { watermark: false },
	});

describe("fitVoice", () => {
	it("leaves a voice that fits alone", () => {
		expect(fitVoice(5, 6)).toEqual({ rate: 1, play: 5, fade: 0, overflow: false });
	});

	it("speeds up a voice that is up to 15% too long", () => {
		const f = fitVoice(6.6, 6);
		expect(f.rate).toBeCloseTo(1.1);
		expect(f.play).toBeCloseTo(6);
		expect(f.fade).toBe(0);
		expect(f.overflow).toBe(false);
	});

	it("caps the speed and cuts with a fade when it still does not fit", () => {
		expect(fitVoice(8, 6)).toEqual({ rate: 1.15, play: 6, fade: 0.15, overflow: true });
	});

	it("plays an unmeasured voice for its slot with a fade", () => {
		expect(fitVoice(null, 6)).toEqual({ rate: 1, play: 6, fade: 0.15, overflow: false });
	});
});

describe("musicEnvelope", () => {
	it("ducks the music under a voice and fades it out at the end", () => {
		const e = musicEnvelope(10, 0.4, 0, 2, [{ from: 1, to: 3 }]);
		expect(gainAt(e, 0.5)).toBeCloseTo(0.4);
		expect(gainAt(e, 1.125)).toBeCloseTo(0.29);
		expect(gainAt(e, 2)).toBeCloseTo(0.18);
		expect(gainAt(e, 3.125)).toBeCloseTo(0.29);
		expect(gainAt(e, 5)).toBeCloseTo(0.4);
		expect(gainAt(e, 9)).toBeCloseTo(0.2);
		expect(gainAt(e, 10)).toBe(0);
	});

	it("fades the music in from silence", () => {
		const e = musicEnvelope(10, 0.5, 2, 0, []);
		expect(gainAt(e, 0)).toBe(0);
		expect(gainAt(e, 1)).toBeCloseTo(0.25);
		expect(gainAt(e, 2)).toBeCloseTo(0.5);
		expect(gainAt(e, 10)).toBeCloseTo(0.5);
	});

	it("keeps the music down between two voices closer than two ramps", () => {
		const e = musicEnvelope(10, 1, 0, 0, [
			{ from: 1, to: 2 },
			{ from: 2.3, to: 3 },
		]);
		expect(gainAt(e, 2.15)).toBeLessThan(1);
		expect(gainAt(e, 2.7)).toBeCloseTo(0.45);
	});

	it("never leaves the 0 to 1 range and is constant without voices or fades", () => {
		const e = musicEnvelope(10, 1.4, 0, 0, []);
		expect(gainAt(e, 3)).toBe(1);
		expect(gainAt(e, -1)).toBe(1);
		expect(gainAt(e, 99)).toBe(1);
	});
});

describe("resolveAudio", () => {
	it("loops a short track to cover the whole video, closing included", () => {
		const c = composition();
		expect(c.total).toBe(10);
		const p = resolveAudio(c, { voices: { a: 3 }, music: 4 });
		expect(p.music?.loops).toBe(3);
		expect(p.voices).toEqual([{ shotId: "a", src: "VA", at: 0, rate: 1, play: 3, fade: 0, overflow: false }]);
		expect(resolveAudio(c, { voices: {}, music: null }).music?.loops).toBe(1);
	});

	it("ducks the music for exactly as long as each voice is heard", () => {
		const p = resolveAudio(composition(), { voices: { a: 3 }, music: 60 });
		const e = p.music!.envelope;
		expect(gainAt(e, 1.5)).toBeCloseTo(0.4 * 0.45);
		expect(gainAt(e, 5)).toBeCloseTo(0.4);
	});

	it("starts the music at its first beat so the beat grid lines up with the video", () => {
		const c = { ...composition(), tempo: { bpm: 120, offset: 0.31 } };
		const plan = resolveAudio(c, { voices: { a: 3 }, music: 4 })!.music!;
		expect(plan.start).toBe(0.31);
		// La pista se repite contando desde su primer golpe: 10 s de video con 3.69 s útiles por vuelta.
		expect(plan.loops).toBe(3);
	});

	it("has no music plan without music", () => {
		const c = { ...composition(), music: null };
		expect(resolveAudio(c, { voices: { a: 3 }, music: null }).music).toBeNull();
	});
});
