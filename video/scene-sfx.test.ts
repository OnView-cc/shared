import { describe, expect, it } from "vitest";
import type { Moment } from "./compose";
import { EVENT_SFX, sceneSfx } from "./scene-sfx";
import { KIT_VERSION, parseBlockParams } from "../motion/types";
import type { SceneEvent } from "../motion/scene/events";

const moment = (shotId: string, at: number, events: SceneEvent[]): Moment => ({
	shotId,
	block: "scene",
	params: { code: "x", texts: {}, kitVersion: KIT_VERSION, fallback: { block: "text", params: parseBlockParams("text", {}) } },
	at,
	seconds: 4,
	transition: "cut",
	images: [],
	events,
});

describe("sceneSfx", () => {
	it("maps every event kind to a library key", () => {
		expect(Object.keys(EVENT_SFX).sort()).toEqual(["click", "land", "logo", "reveal", "success", "swipe", "type", "whoosh"]);
	});

	it("alternates variants by n", () => {
		const cues = sceneSfx([moment("a", 10, [{ kind: "land", at: 0, n: 0 }, { kind: "land", at: 1, n: 1 }, { kind: "land", at: 2, n: 2 }, { kind: "land", at: 3, n: 3 }])], []);
		expect(cues.map((c) => c.sfxKey)).toEqual(["pop-soft", "pop-bubble", "hit-soft", "pop-soft"]);
		expect(cues.map((c) => c.at)).toEqual([10, 11, 12, 13]);
		expect(cues[0]).toMatchObject({ id: "a:land#0", shotId: "a", volume: 0.6 });
	});

	it("mute override removes the event sfx", () => {
		const cues = sceneSfx([moment("a", 0, [{ kind: "click", at: 1, n: 0 }, { kind: "click", at: 2, n: 1 }])], [{ id: "o", shotId: "a", sfxKey: "pop-soft", at: 0, volume: 0, origin: "mute", eventRef: "click#1" }]);
		expect(cues.map((c) => c.id)).toEqual(["a:click#0"]);
	});

	it("swap override changes key and volume", () => {
		const cues = sceneSfx([moment("a", 0, [{ kind: "click", at: 1, n: 0 }])], [{ id: "o", shotId: "a", sfxKey: "chime-ding", at: 0, volume: 0.3, origin: "swap", eventRef: "click#0" }]);
		expect(cues[0]).toMatchObject({ sfxKey: "chime-ding", volume: 0.3, at: 1 });
	});

	it("drops events closer than 0.25 s in a moment", () => {
		const cues = sceneSfx([moment("a", 0, [{ kind: "type", at: 1, n: 0 }, { kind: "type", at: 1.1, n: 1 }, { kind: "type", at: 1.3, n: 2 }])], []);
		expect(cues.map((c) => c.at)).toEqual([1, 1.3]);
	});

	it("orphan override is ignored", () => {
		const cues = sceneSfx([moment("a", 0, [{ kind: "click", at: 1, n: 0 }])], [{ id: "o", shotId: "a", sfxKey: "pop-soft", at: 0, volume: 0, origin: "mute", eventRef: "land#4" }]);
		expect(cues).toHaveLength(1);
	});

	it("classic moments give no event sfx", () => {
		const m: Moment = { shotId: "b", block: "text", params: parseBlockParams("text", {}), at: 0, seconds: 2, transition: "cut", images: [] };
		expect(sceneSfx([m], [])).toEqual([]);
	});
});
